import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Parse the DATABASE_URL to get individual connection parameters
const databaseUrl = process.env.DATABASE_URL || '';
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!urlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;
const dbName = database.split('?')[0]; // Remove query params

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
  await prisma.rutina.deleteMany();

  // ========================================
  // Rutina 1: Full Body (5 días)
  // ========================================
  
  // Create admin user for testing
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@championgym.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@championgym.com',
      emailVerified: true,
    },
  });

  // Create admin account with password
  await prisma.account.upsert({
    where: {
      providerId_providerType_accountId: {
        providerId: 'champion-admin',
        providerType: 'email',
        accountId: adminUser.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: 'champion-admin',
      providerType: 'email',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIqJ4J.Wfy', // password: admin123
    },
  });

  console.log('Admin user created:', adminUser.email);
  
  // Día 1: Pecho y Espalda
  const dia1Rutina1 = await prisma.dia.create({
    data: {
      nombre: 'Día 1',
      musculosEnfocados: 'Pecho, Espalda',
      orden: 1,
      rutina: {
        create: {
          nombre: 'Full Body',
          tipo: 'Fuerza',
          descripcion: 'Rutina completa para trabajar todo el cuerpo',
        },
      },
      ejercicios: {
        create: [
          { nombre: 'Press de banca', series: '3x12 - 1x10', orden: 1 },
          { nombre: 'Dominadas', series: '3x10', orden: 2 },
          { nombre: 'Press inclinado', series: '3x12', orden: 3 },
          { nombre: 'Remo con barra', series: '3x10', orden: 4 },
          { nombre: 'Pullover', series: '3x12', orden: 5 },
        ],
      },
    },
    include: { rutina: true },
  });

  // Día 2: Piernas
  const dia2Rutina1 = await prisma.dia.create({
    data: {
      nombre: 'Día 2',
      musculosEnfocados: 'Piernas',
      orden: 2,
      rutinaId: dia1Rutina1.rutina.id,
      ejercicios: {
        create: [
          { nombre: 'Sentadilla', series: '4x8 - 1x6', orden: 1 },
          { nombre: 'Peso muerto', series: '3x8', orden: 2 },
          { nombre: 'Prensa', series: '3x12', orden: 3 },
          { nombre: 'Curl de femoral', series: '3x12', orden: 4 },
          { nombre: 'Extensión de cuádriceps', series: '3x12', orden: 5 },
          { nombre: 'Pantorrillas', series: '4x15', orden: 6 },
        ],
      },
    },
  });

  // Día 3: Hombros y Brazos
  const dia3Rutina1 = await prisma.dia.create({
    data: {
      nombre: 'Día 3',
      musculosEnfocados: 'Hombros, Brazos',
      orden: 3,
      rutinaId: dia1Rutina1.rutina.id,
      ejercicios: {
        create: [
          { nombre: 'Press militar', series: '3x10 - 1x8', orden: 1 },
          { nombre: 'Elevaciones laterales', series: '3x15', orden: 2 },
          { nombre: 'Face pulls', series: '3x15', orden: 3 },
          { nombre: 'Curl de bíceps', series: '3x12', orden: 4 },
          { nombre: 'Press de tríceps', series: '3x12', orden: 5 },
          { nombre: 'Curl de martillo', series: '3x12', orden: 6 },
        ],
      },
    },
  });

  // Día 4: Pecho y Espalda (repetición)
  const dia4Rutina1 = await prisma.dia.create({
    data: {
      nombre: 'Día 4',
      musculosEnfocados: 'Pecho, Espalda',
      orden: 4,
      rutinaId: dia1Rutina1.rutina.id,
      ejercicios: {
        create: [
          { nombre: 'Press de banca', series: '3x10 - 1x8', orden: 1 },
          { nombre: 'Jalón al pecho', series: '3x10', orden: 2 },
          { nombre: 'Cruces con mancuernas', series: '3x12', orden: 3 },
          { nombre: 'Remo unilateral', series: '3x10', orden: 4 },
          { nombre: 'Press dip', series: '3x10', orden: 5 },
        ],
      },
    },
  });

  // Día 5: Piernas (repetición)
  const dia5Rutina1 = await prisma.dia.create({
    data: {
      nombre: 'Día 5',
      musculosEnfocados: 'Piernas',
      orden: 5,
      rutinaId: dia1Rutina1.rutina.id,
      ejercicios: {
        create: [
          { nombre: 'Sentadilla frontal', series: '3x10', orden: 1 },
          { nombre: 'Zancadas', series: '3x10', orden: 2 },
          { nombre: 'Peso muerto rumano', series: '3x10', orden: 3 },
          { nombre: 'Sentadilla búlgara', series: '3x10', orden: 4 },
          { nombre: 'Elevación de talones', series: '4x15', orden: 5 },
        ],
      },
    },
  });

  // ========================================
  // Rutina 2: Upper Body (4 días)
  // ========================================

  const rutina2 = await prisma.rutina.create({
    data: {
      nombre: 'Upper Body',
      tipo: 'Hipertrofia',
      dias: {
        create: [
          {
            nombre: 'Día 1',
            musculosEnfocados: 'Pecho',
            orden: 1,
            ejercicios: {
              create: [
                { nombre: 'Press de banca', series: '4x10 - 1x8', orden: 1 },
                { nombre: 'Press inclinado', series: '3x10', orden: 2 },
                { nombre: 'Fondos', series: '3x10', orden: 3 },
                { nombre: 'Peck deck', series: '3x12', orden: 4 },
                { nombre: 'Cruces polea', series: '3x12', orden: 5 },
              ],
            },
          },
          {
            nombre: 'Día 2',
            musculosEnfocados: 'Espalda',
            orden: 2,
            ejercicios: {
              create: [
                { nombre: 'Dominadas', series: '4x10', orden: 1 },
                { nombre: 'Remo con barra', series: '3x10', orden: 2 },
                { nombre: 'Jalón al pecho', series: '3x10', orden: 3 },
                { nombre: 'Remo con mancuerna', series: '3x10', orden: 4 },
                { nombre: 'Pull over', series: '3x12', orden: 5 },
              ],
            },
          },
          {
            nombre: 'Día 3',
            musculosEnfocados: 'Hombros',
            orden: 3,
            ejercicios: {
              create: [
                { nombre: 'Press militar', series: '4x10', orden: 1 },
                { nombre: 'Press Arnold', series: '3x10', orden: 2 },
                { nombre: 'Elevaciones laterales', series: '4x12', orden: 3 },
                { nombre: 'Elevaciones posteriores', series: '3x12', orden: 4 },
                { nombre: 'Face pulls', series: '3x15', orden: 5 },
              ],
            },
          },
          {
            nombre: 'Día 4',
            musculosEnfocados: 'Brazos',
            orden: 4,
            ejercicios: {
              create: [
                { nombre: 'Curl de bíceps barra', series: '3x10 - 1x8', orden: 1 },
                { nombre: 'Curl martillo', series: '3x10', orden: 2 },
                { nombre: 'Press de tríceps', series: '3x10', orden: 3 },
                { nombre: 'Patada de tríceps', series: '3x12', orden: 4 },
                { nombre: 'Curl concentrado', series: '3x12', orden: 5 },
              ],
            },
          },
        ],
      },
    },
  });

  // ========================================
  // Rutina 3: Leg Day (1 día)
  // ========================================

  const rutina3 = await prisma.rutina.create({
    data: {
      nombre: 'Leg Day',
      tipo: 'Fuerza',
      descripcion: 'Rutina enfocada en piernas',
      dias: {
        create: [
          {
            nombre: 'Día 1',
            musculosEnfocados: 'Cuádriceps, Isquiotibiales',
            orden: 1,
            ejercicios: {
              create: [
                { nombre: 'Sentadilla', series: '5x5 - 1x3', orden: 1 },
                { nombre: 'Peso muerto', series: '3x5', orden: 2 },
                { nombre: 'Prensa', series: '3x12', orden: 3 },
                { nombre: 'Hack squat', series: '3x10', orden: 4 },
                { nombre: 'Curl de femoral', series: '3x12', orden: 5 },
                { nombre: 'Extensión cuádriceps', series: '3x12', orden: 6 },
                { nombre: 'Pantorrillas de pie', series: '4x15', orden: 7 },
                { nombre: 'Pantorrillas sentado', series: '4x15', orden: 8 },
              ],
            },
          },
        ],
      },
    },
  });

  // ========================================
  // Rutina 4: Push Pull Legs (6 días)
  // ========================================

  const rutina4 = await prisma.rutina.create({
    data: {
      nombre: 'Push Pull Legs',
      tipo: 'Hipertrofia',
      descripcion: 'Rutina dividida en push, pull y legs',
      dias: {
        create: [
          {
            nombre: 'Push',
            musculosEnfocados: 'Pecho, Hombros, Tríceps',
            orden: 1,
            ejercicios: {
              create: [
                { nombre: 'Press de banca', series: '4x10', orden: 1 },
                { nombre: 'Press militar', series: '3x10', orden: 2 },
                { nombre: 'Press inclinado', series: '3x10', orden: 3 },
                { nombre: 'Elevaciones laterales', series: '4x12', orden: 4 },
                { nombre: 'Fondos', series: '3x10', orden: 5 },
                { nombre: 'Press de tríceps', series: '3x12', orden: 6 },
              ],
            },
          },
          {
            nombre: 'Pull',
            musculosEnfocados: 'Espalda, Bíceps',
            orden: 2,
            ejercicios: {
              create: [
                { nombre: 'Dominadas', series: '4x10', orden: 1 },
                { nombre: 'Remo con barra', series: '3x10', orden: 2 },
                { nombre: 'Jalón al pecho', series: '3x10', orden: 3 },
                { nombre: 'Remo con mancuerna', series: '3x10', orden: 4 },
                { nombre: 'Curl de bíceps', series: '3x12', orden: 5 },
                { nombre: 'Curl martillo', series: '3x12', orden: 6 },
              ],
            },
          },
          {
            nombre: 'Legs',
            musculosEnfocados: 'Piernas',
            orden: 3,
            ejercicios: {
              create: [
                { nombre: 'Sentadilla', series: '4x10', orden: 1 },
                { nombre: 'Peso muerto rumano', series: '3x10', orden: 2 },
                { nombre: 'Prensa', series: '3x12', orden: 3 },
                { nombre: 'Zancadas', series: '3x10', orden: 4 },
                { nombre: 'Curl femoral', series: '3x12', orden: 5 },
                { nombre: 'Pantorrillas', series: '4x15', orden: 6 },
              ],
            },
          },
          {
            nombre: 'Push',
            musculosEnfocados: 'Pecho, Hombros, Tríceps',
            orden: 4,
            ejercicios: {
              create: [
                { nombre: 'Press de banca', series: '4x8 - 1x6', orden: 1 },
                { nombre: 'Press Arnold', series: '3x10', orden: 2 },
                { nombre: 'Peck deck', series: '3x12', orden: 3 },
                { nombre: 'Elevaciones laterales', series: '4x12', orden: 4 },
                { nombre: 'Press dip', series: '3x8', orden: 5 },
                { nombre: 'Patada tríceps', series: '3x12', orden: 6 },
              ],
            },
          },
          {
            nombre: 'Pull',
            musculosEnfocados: 'Espalda, Bíceps',
            orden: 5,
            ejercicios: {
              create: [
                { nombre: 'Jalón al pecho', series: '4x10', orden: 1 },
                { nombre: 'Remo T', series: '3x10', orden: 2 },
                { nombre: 'Remo unilateral', series: '3x10', orden: 3 },
                { nombre: 'Face pulls', series: '3x15', orden: 4 },
                { nombre: 'Curl concentrado', series: '3x12', orden: 5 },
                { nombre: 'Curl predicador', series: '3x10', orden: 6 },
              ],
            },
          },
          {
            nombre: 'Legs',
            musculosEnfocados: 'Piernas',
            orden: 6,
            ejercicios: {
              create: [
                { nombre: 'Sentadilla frontal', series: '4x10', orden: 1 },
                { nombre: 'Peso muerto', series: '3x8', orden: 2 },
                { nombre: 'Hack squat', series: '3x10', orden: 3 },
                { nombre: 'Sentadilla búlgara', series: '3x10', orden: 4 },
                { nombre: 'Extensión cuádriceps', series: '3x12', orden: 5 },
                { nombre: 'Elevación talones', series: '4x15', orden: 6 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seeding complete!');
  console.log(`Created ${await prisma.rutina.count()} rutinas`);
  console.log(`Created ${await prisma.dia.count()} dias`);
  console.log(`Created ${await prisma.ejercicio.count()} ejercicios`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
