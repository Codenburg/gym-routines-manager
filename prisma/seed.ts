import { PrismaClient, Role } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

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
    await tx.session.deleteMany();
    await tx.account.deleteMany();
    await tx.user.deleteMany();

    // Create/update singleton Gym config
    // Display fields are intentionally NOT seeded with brand strings — admins
    // configure them via the gym config page. Nullable defaults keep the
    // singleton in a "no brand identity" state until the admin fills them in.
    await tx.gym.upsert({
      where: { id: 'gym' },
      update: {},
      create: {
        id: 'gym',
        price: 45000,
        nombre: null,
        horario: null,
        direccion: null,
        mapsEmbedUrl: null,
        socialInstagram: null,
        socialWhatsapp: null,
      },
    });

    console.log('Gym config ensured with price: $45.000 (display fields null)');

    // Seed Promociones
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

    // Seed DescuentosDuracion (meses as enum [3, 6, 9, 12])
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

    // Routine templates
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

    // Create admin users
    const admins = [
      { name: 'Nando', dni: '11111111', password: process.env.SEED_ADMIN_PASSWORD_1 },
    ];

    for (const admin of admins) {
      if (!admin.password) {
        console.error(`SEED_ADMIN_PASSWORD for ${admin.name} is not set`);
        throw new Error(`Missing SEED_ADMIN_PASSWORD for ${admin.name}`);
      }
      if (admin.password.length > 72) {
        console.error(`Password for ${admin.name} exceeds 72 bytes (bcrypt limit)`);
        throw new Error(`Password too long for ${admin.name}`);
      }
      const hashedPwd = await bcrypt.hash(admin.password, 12);

      const user = await tx.user.create({
        data: {
          name: admin.name,
          username: admin.dni,
          email: null,
          dni: admin.dni,
          emailVerified: false,
          role: Role.ADMIN,
          banned: false,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          accountId: admin.dni,
           providerId: 'credential', // Must be 'credential' for better-auth username plugin
          providerType: 'credential',
          password: hashedPwd,
        },
      });

      console.log(`Admin ${admin.name} created with DNI: ${admin.dni}`);

      // Create 10 routines for this admin using user.id as FK
      for (let i = 0; i < routineTemplates.length; i++) {
        const template = routineTemplates[i];

        // Create routine with the admin as creator
        const rutina = await tx.rutina.create({
          data: {
            nombre: `${template.nombre} - ${admin.name}`,
            tipo: template.tipo,
            descripcion: template.descripcion,
            creadorId: user.id,
          },
        });

        // Create initial ownership record (creation, not transfer)
        await tx.ownershipTransfer.create({
          data: {
            rutinaId: rutina.id,
            fromUserId: null,
            toUserId: user.id,
          },
        });

        // Create 1-2 days per routine
        const numDias = i < 5 ? 2 : 1;

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

      console.log(`Created 10 routines for ${admin.name}`);
    }

    // Seed Trainer users
    const trainers = [
      { name: 'Leo', dni: '22222222', password: process.env.SEED_TRAINER_PASSWORD_1 },
      { name: 'Santi', dni: '33333333', password: process.env.SEED_TRAINER_PASSWORD_2 },
      { name: 'Facu', dni: '44444444', password: process.env.SEED_TRAINER_PASSWORD_3 },
    ];

    for (const trainer of trainers) {
      if (!trainer.password) {
        console.error(`SEED_TRAINER_PASSWORD for ${trainer.name} is not set`);
        throw new Error(`Missing SEED_TRAINER_PASSWORD for ${trainer.name}`);
      }
      if (trainer.password.length > 72) {
        console.error(`Password for ${trainer.name} exceeds 72 bytes (bcrypt limit)`);
        throw new Error(`Password too long for ${trainer.name}`);
      }
      const hashedPwd = await bcrypt.hash(trainer.password, 12);

      const user = await tx.user.create({
        data: {
          name: trainer.name,
          username: trainer.dni,
          email: null,
          dni: trainer.dni,
          emailVerified: false,
          role: Role.TRAINER,
          banned: false,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          accountId: trainer.dni,
          providerId: 'credential',
          providerType: 'credential',
          password: hashedPwd,
        },
      });

      console.log(`Trainer ${trainer.name} created with DNI: ${trainer.dni}`);

      // Create 5 routines for this trainer
      const trainerTemplates = routineTemplates.slice(0, 5);
      for (let i = 0; i < trainerTemplates.length; i++) {
        const template = trainerTemplates[i];

        const rutina = await tx.rutina.create({
          data: {
            nombre: `${template.nombre} - ${trainer.name}`,
            tipo: template.tipo,
            descripcion: template.descripcion,
            creadorId: user.id,
          },
        });

        await tx.ownershipTransfer.create({
          data: {
            rutinaId: rutina.id,
            fromUserId: null,
            toUserId: user.id,
          },
        });

        // Create 2 days per routine
        for (let d = 1; d <= 2; d++) {
          const ejerciciosData = [
            { nombre: 'Press de Banca', formato: '4x10', orden: 1 },
            { nombre: 'Sentadillas', formato: '4x12', orden: 2 },
            { nombre: 'Peso Muerto', formato: '3x8', orden: 3 },
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

      console.log(`Created 5 routines for ${trainer.name}`);
    }

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
