import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || '';
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!urlMatch) {
  console.error('Invalid DATABASE_URL format');
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
  await prisma.rutina.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user con username (DNI)
  const adminDni = '12345678';
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      username: adminDni,
      email: null,
      dni: adminDni,
      emailVerified: false,
      admin: true,
      role: 'admin',
      banned: false,
    },
  });

  // Create admin account
  await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: 'credential',
      providerType: 'credential',
      password: hashedPassword,
    },
  });

  console.log('Admin user created with DNI:', adminDni);
  
  // Create sample routines...
  const dia1 = await prisma.dia.create({
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
          { nombre: 'Press de banca', series: '3x12', orden: 1 },
          { nombre: 'Dominadas', series: '3x10', orden: 2 },
          { nombre: 'Press inclinado', series: '3x12', orden: 3 },
        ],
      },
    },
    include: { rutina: true },
  });

  await prisma.dia.create({
    data: {
      nombre: 'Día 2',
      musculosEnfocados: 'Piernas',
      orden: 2,
      rutinaId: dia1.rutina.id,
      ejercicios: {
        create: [
          { nombre: 'Sentadilla', series: '4x8', orden: 1 },
          { nombre: 'Peso muerto', series: '3x8', orden: 2 },
          { nombre: 'Prensa', series: '3x12', orden: 3 },
        ],
      },
    },
  });

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
