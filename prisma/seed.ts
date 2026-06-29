import { PrismaClient, Prisma } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { GYM_SINGLETON_ID } from '@/lib/gym-constants';

const databaseUrl = process.env.DATABASE_URL || '';

let user = '', password = '', host = '', port = 5432, dbName = '';

try {
  const url = new URL(databaseUrl);
  user = url.username;
  password = url.password;
  host = url.hostname;
  port = parseInt(url.port, 10) || 5432;
  dbName = url.pathname.slice(1).split('?')[0];
} catch {
  console.error('Invalid DATABASE_URL format:', databaseUrl);
  throw new Error('Invalid DATABASE_URL');
}

const pool = new Pool({
  user,
  password,
  host,
  port,
  database: dbName,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Parse "3x10" format into series and repetitions
 */
function parseFormato(formato: string) {
  const match = formato.match(/^(\d+)x(\d+)$/);
  if (!match) return { series: null, repes: null };
  return { series: parseInt(match[1], 10), repes: parseInt(match[2], 10) };
}

/**
 * Generate a cryptographically strong random password (32 hex chars = 128 bits)
 */
function generateStrongPassword(): string {
  return crypto.randomBytes(16).toString('hex');
}

async function main() {
  console.log('Seeding database...');

  await prisma.$transaction(async (tx) => {
    // Clear existing data
    await tx.ejercicio.deleteMany();
    await tx.dia.deleteMany();
    await tx.ownershipTransfer.deleteMany();
    await tx.rutina.deleteMany();
    await tx.promocion.deleteMany();
    await tx.descuentoDuracion.deleteMany();
    await tx.feriado.deleteMany();
    await tx.gym.deleteMany();
    await tx.member.deleteMany();
    await tx.session.deleteMany();
    await tx.account.deleteMany();
    await tx.user.deleteMany();

    // ============================================================
    // Organization & Gym (singleton)
    // ============================================================

    // Create Organization — must exist before any user/entity that references it
    await tx.organization.upsert({
      where: { id: GYM_SINGLETON_ID },
      update: {},
      create: {
        id: GYM_SINGLETON_ID,
        name: 'GymFlow Default',
        slug: 'gymflow-default',
      },
    });

    // Create/update singleton Gym config (FK to Organization)
    // The default 'nombre' is a friendly placeholder ("Mi Gimnasio") so the
    // dev environment shows something sensible on first boot. Admins
    // overwrite this via the gym config page; production deployments should
    // also set NEXT_PUBLIC_GYM_NAME as a deploy-time safety net.
    // Other display fields stay null by design — unconfigured = "render
    // nothing" UX (HoursSection, AddressSection, SocialLinksSection all
    // hide themselves when their value is null).
    // `horarioJson` is the structured weekly schedule; null = unconfigured
    // (public HoursSection hides itself).
    await tx.gym.upsert({
      where: { id: 'gym' },
      update: {}, // don't touch existing fields — preserve admin edits
      create: {
        id: 'gym',
        price: 45000,
        nombre: 'Mi Gimnasio',
        horarioJson: Prisma.JsonNull,
        direccion: null,
        mapsEmbedUrl: null,
        socialInstagram: null,
        socialWhatsapp: null,
      },
    });

    console.log('Gym config ensured with price: $45.000, nombre: "Mi Gimnasio" (or preserved if already set)');

    // ============================================================
    // Promociones & Descuentos
    // ============================================================

    const promociones = [
      {
        titulo: '2x1 en Matrícula',
        descripcion: 'Pagá la matrícula de un mes y llevá el segundo gratis. Válido para nuevas altas.',
        precio: 47000,
        activo: true,
      },
      {
        titulo: '50% OFF Primer Mes',
        descripcion: 'Descuento exclusivo para nuevos socios. Aplica solo en el primer mes de suscripción.',
        precio: 24500,
        activo: true,
      },
      {
        titulo: 'Pack Anual Sin Costo de Inscripción',
        descripcion: 'Contratá el plan anual y te bonificamos la matrícula. Ahorrá $45.000.',
        precio: 470000,
        activo: true,
      },
    ];

    for (const promo of promociones) {
      await tx.promocion.create({
        data: { ...promo, gymId: 'gym' },
      });
    }
    console.log(`Created ${promociones.length} promociones`);

    const descuentosDuracion = [
      { meses: 3, porcentaje: 10 },
      { meses: 6, porcentaje: 15 },
      { meses: 9, porcentaje: 17 },
      { meses: 12, porcentaje: 20 },
    ];

    for (const descuento of descuentosDuracion) {
      await tx.descuentoDuracion.create({
        data: { ...descuento, gymId: 'gym' },
      });
    }
    console.log(`Created ${descuentosDuracion.length} descuentos por duración`);

    // ============================================================
    // Routine templates
    // ============================================================

    const routineTemplates = [
      { nombre: 'Full Body', tipo: 'fuerza', descripcion: 'Rutina completa para todo el cuerpo' },
      { nombre: 'Pecho y Tríceps', tipo: 'fuerza', descripcion: 'Entrenamiento de empujes' },
      { nombre: 'Espalda y Bíceps', tipo: 'fuerza', descripcion: 'Entrenamiento de tirones' },
      { nombre: 'Piernas', tipo: 'fuerza', descripcion: 'Cuádriceps, isquiotibiales, gemelos' },
      { nombre: 'Hombros', tipo: 'fuerza', descripcion: 'Deltoides y manguito rotador' },
      { nombre: 'Cardio HIIT', tipo: 'cardio', descripcion: 'High intensity interval training' },
      { nombre: 'Core y Abdominales', tipo: 'fuerza', descripcion: 'Fuerza central' },
      { nombre: 'Full Body Ligero', tipo: 'flexibilidad', descripcion: 'Rutina accesible para todos' },
      { nombre: 'Potencia', tipo: 'fuerza', descripcion: 'Ejercicios pliométricos' },
      { nombre: 'Resistencia', tipo: 'cardio', descripcion: 'Endurance y stamina' },
    ];

    // ============================================================
    // Helper: create user + account + routines
    // ============================================================

    async function createUserWithRoutines(
      tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
      params: {
        name: string;
        dni: string;
        password: string;
        isSuperAdmin: boolean;
        memberRole?: 'admin' | 'trainer'; // undefined = no member entry
        routineCount: number;
      },
    ) {
      const hashedPwd = await bcrypt.hash(params.password, 12);

      const user = await tx.user.create({
        data: {
          name: params.name,
          username: params.dni,
          email: null,
          dni: params.dni,
          emailVerified: false,
          isSuperAdmin: params.isSuperAdmin,
          banned: false,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          accountId: params.dni,
          providerId: 'credential',
          providerType: 'credential',
          password: hashedPwd,
        },
      });

      // Create Member entry if role is specified (gym org member)
      if (params.memberRole) {
        await tx.member.create({
          data: {
            userId: user.id,
            organizationId: GYM_SINGLETON_ID,
            role: params.memberRole,
          },
        });
      }

      // Create routines
      const templateSlice = routineTemplates.slice(0, params.routineCount);
      for (let i = 0; i < templateSlice.length; i++) {
        const template = templateSlice[i];

        const rutina = await tx.rutina.create({
          data: {
            nombre: `${template.nombre} - ${params.name}`,
            tipo: template.tipo,
            descripcion: template.descripcion,
            creadorId: user.id,
            organizationId: GYM_SINGLETON_ID,
          },
        });

        await tx.ownershipTransfer.create({
          data: {
            rutinaId: rutina.id,
            fromUserId: null,
            toUserId: user.id,
            organizationId: GYM_SINGLETON_ID,
          },
        });

        // Create 1-2 days per routine (first 5 templates get 2 days)
        const numDias = i < Math.min(5, params.routineCount) ? 2 : 1;

        for (let d = 1; d <= numDias; d++) {
          const ejerciciosData = [
            { nombre: 'Press de Banca', formato: '4x10', orden: 1 },
            { nombre: 'Sentadillas', formato: '4x12', orden: 2 },
            { nombre: 'Peso Muerto', formato: '3x8', orden: 3 },
            { nombre: 'Fondos', formato: '3x12', orden: 4 },
            { nombre: 'Press Militar', formato: '4x10', orden: 5 },
          ];

          const ejercicios = ejerciciosData.map(ej => {
            const { series, repes } = parseFormato(ej.formato);
            return {
              nombre: ej.nombre,
              series,
              repes,
              orden: ej.orden,
            };
          });

          await tx.dia.create({
            data: {
              musculosEnfocados: [template.tipo],
              orden: d,
              rutinaId: rutina.id,
              ejercicios: {
                create: ejercicios,
              },
            },
          });
        }
      }

      return user;
    }

    // ============================================================
    // Nando — gym admin (isSuperAdmin: false, Member.role: "admin")
    // ============================================================

    const adminPassword = process.env.SEED_ADMIN_PASSWORD_1;
    if (!adminPassword) throw new Error('Missing SEED_ADMIN_PASSWORD_1 for Nando');
    if (adminPassword.length > 72) throw new Error('Nando password exceeds 72 bytes (bcrypt limit)');

    await createUserWithRoutines(tx as any, {
      name: 'Nando',
      dni: '11111111',
      password: adminPassword,
      isSuperAdmin: false,
      memberRole: 'admin',
      routineCount: 10,
    });

    console.log('Admin Nando created as gym org admin (Member.role: admin)');

    // ============================================================
    // Leo, Santi, Facu — trainers (isSuperAdmin: false, Member.role: "trainer")
    // ============================================================

    const trainerConfigs = [
      { name: 'Leo', dni: '22222222', password: process.env.SEED_TRAINER_PASSWORD_1 },
      { name: 'Santi', dni: '33333333', password: process.env.SEED_TRAINER_PASSWORD_2 },
      { name: 'Facu', dni: '44444444', password: process.env.SEED_TRAINER_PASSWORD_3 },
    ];

    for (const t of trainerConfigs) {
      if (!t.password) throw new Error(`Missing SEED_TRAINER_PASSWORD for ${t.name}`);
      if (t.password.length > 72) throw new Error(`${t.name} password exceeds 72 bytes`);

      await createUserWithRoutines(tx as any, {
        name: t.name,
        dni: t.dni,
        password: t.password,
        isSuperAdmin: false,
        memberRole: 'trainer',
        routineCount: 5,
      });

      console.log(`Trainer ${t.name} created as gym org trainer (Member.role: trainer)`);
    }

    // ============================================================
    // Tomás — super admin (isSuperAdmin: true, NO Member)
    // Password generated randomly, printed once below.
    // ============================================================

    const tomasPassword = generateStrongPassword();
    const tomasDni = '99999999';

    const tomas = await tx.user.create({
      data: {
        name: 'Tomás',
        username: tomasDni,
        email: null,
        dni: tomasDni,
        emailVerified: false,
        isSuperAdmin: true,
        banned: false,
      },
    });

    const hashedTomasPwd = await bcrypt.hash(tomasPassword, 12);
    await tx.account.create({
      data: {
        userId: tomas.id,
        accountId: tomasDni,
        providerId: 'credential',
        providerType: 'credential',
        password: hashedTomasPwd,
      },
    });

    // NO Member entry — Tomás is a super-admin with no org membership

    // ============================================================
    // Print Tomás credentials — ONE TIME only, never persisted
    // ============================================================

    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('  TOMÁS — SUPER ADMIN ACCOUNT (ONE-TIME PRINT)');
    console.log('  Save these credentials in your password manager.');
    console.log('  They will NOT be shown again.');
    console.log('');
    console.log(`  Username: ${tomasDni}`);
    console.log(`  Password: ${tomasPassword}`);
    console.log('══════════════════════════════════════════════════');
    console.log('');

    console.log('Seeding complete!');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
