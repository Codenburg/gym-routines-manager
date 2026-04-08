import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || '';
// Format: postgresql://user:password@host:port/database?schema=public
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!urlMatch) {
  console.error('Invalid DATABASE_URL format:', databaseUrl);
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;
const dbName = database.split('?')[0];

const pool = new Pool({
  user,
  password,
  host,
  port: parseInt(port, 10),
  database: dbName,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.ejercicio.deleteMany();
  await prisma.dia.deleteMany();
  await prisma.ownershipTransfer.deleteMany();
  await prisma.rutina.deleteMany();
  await prisma.feriado.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create/update singleton Gym config
  await prisma.gym.upsert({
    where: { id: 'gym' },
    update: {},
    create: {
      id: 'gym',
      price: 45000,
    },
  });

  console.log('Gym config created with price: $45.000');

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
    { name: 'Nando', dni: '11111111', password: 'nando123' },
    { name: 'Leo', dni: '22222222', password: 'leo123' },
    { name: 'Santi', dni: '33333333', password: 'santi123' },
  ];

  for (const admin of admins) {
    const hashedPwd = await bcrypt.hash(admin.password, 12);
    
    const user = await prisma.user.create({
      data: {
        name: admin.name,
        username: admin.dni,
        email: null,
        dni: admin.dni,
        emailVerified: false,
        admin: true,
        role: 'admin',
        banned: false,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: admin.dni, // Use DNI as accountId
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
      const rutina = await prisma.rutina.create({
        data: {
          nombre: `${template.nombre} - ${admin.name}`,
          tipo: template.tipo,
          descripcion: template.descripcion,
          creadorId: user.id,
        },
      });

      // Create initial ownership record (creation, not transfer)
      await prisma.ownershipTransfer.create({
        data: {
          rutinaId: rutina.id,
          fromUserId: null, // Creation, not a transfer
          toUserId: user.id,
        },
      });

      // Create 1-2 days per routine
      const numDias = i < 5 ? 2 : 1;
      
      for (let d = 1; d <= numDias; d++) {
        // Parse "3x10" format into separate series and repes
        const parseFormato = (formato: string) => {
          const match = formato.match(/^(\d+)x(\d+)$/);
          if (!match) return { series: null, repes: null };
          return { series: parseInt(match[1], 10), repes: parseInt(match[2], 10) };
        };

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

        await prisma.dia.create({
          data: {
            nombre: `Día ${d}`,
            musculosEnfocados: template.tipo,
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

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
