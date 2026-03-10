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

  // Create routines
  const rutina1 = await prisma.rutina.create({
    data: {
      nombre: 'Full Body',
      tipo: 'Fuerza',
      descripcion: 'Rutina completa para trabajar todo el cuerpo',
      dias: {
        create: [
          { nombre: 'Día 1', musculosEnfocados: 'Pecho, Espalda', orden: 1 },
          { nombre: 'Día 2', musculosEnfocados: 'Piernas', orden: 2 },
          { nombre: 'Día 3', musculosEnfocados: 'Hombros, Brazos', orden: 3 },
          { nombre: 'Día 4', musculosEnfocados: 'Pecho, Espalda', orden: 4 },
          { nombre: 'Día 5', musculosEnfocados: 'Piernas', orden: 5 },
        ],
      },
    },
  });

  const rutina2 = await prisma.rutina.create({
    data: {
      nombre: 'Upper Body',
      tipo: 'Hipertrofia',
      dias: {
        create: [
          { nombre: 'Día 1', musculosEnfocados: 'Pecho', orden: 1 },
          { nombre: 'Día 2', musculosEnfocados: 'Espalda', orden: 2 },
          { nombre: 'Día 3', musculosEnfocados: 'Hombros', orden: 3 },
          { nombre: 'Día 4', musculosEnfocados: 'Brazos', orden: 4 },
        ],
      },
    },
  });

  const rutina3 = await prisma.rutina.create({
    data: {
      nombre: 'Leg Day',
      tipo: 'Fuerza',
      descripcion: 'Rutina enfocada en piernas',
      dias: {
        create: [
          { nombre: 'Día 1', musculosEnfocados: 'Cuádriceps, Isquiotibiales', orden: 1 },
        ],
      },
    },
  });

  const rutina4 = await prisma.rutina.create({
    data: {
      nombre: 'Push Pull Legs',
      tipo: 'Hipertrofia',
      descripcion: 'Rutina dividida en push, pull y legs',
      dias: {
        create: [
          { nombre: 'Push', musculosEnfocados: 'Pecho, Hombros, Tríceps', orden: 1 },
          { nombre: 'Pull', musculosEnfocados: 'Espalda, Bíceps', orden: 2 },
          { nombre: 'Legs', musculosEnfocados: 'Piernas', orden: 3 },
          { nombre: 'Push', musculosEnfocados: 'Pecho, Hombros, Tríceps', orden: 4 },
          { nombre: 'Pull', musculosEnfocados: 'Espalda, Bíceps', orden: 5 },
          { nombre: 'Legs', musculosEnfocados: 'Piernas', orden: 6 },
        ],
      },
    },
  });

  console.log('Seeding complete!');
  console.log(`Created ${await prisma.rutina.count()} rutinas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
