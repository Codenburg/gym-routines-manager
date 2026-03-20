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
  }

  // Create 10 routines for each admin
  const routineTemplates = [
    { nombre: 'Full Body', tipo: 'Fuerza', descripcion: 'Rutina completa para todo el cuerpo' },
    { nombre: 'Pecho y Tríceps', tipo: 'Fuerza', descripcion: 'Entrenamiento de empujes' },
    { nombre: 'Espalda y Bíceps', tipo: 'Fuerza', descripcion: 'Entrenamiento de tirones' },
    { nombre: 'Piernas', tipo: 'Fuerza', descripcion: 'Cuádriceps, isquiotibiales, gemelos' },
    { nombre: 'Hombros', tipo: 'Fuerza', descripcion: 'Deltoides y manguito rotador' },
    { nombre: 'Cardio HIIT', tipo: 'Cardio', descripcion: 'High intensity interval training' },
    { nombre: 'Core y Abdominales', tipo: 'Funcional', descripcion: 'Fuerza central' },
    { nombre: 'Full Body Ligero', tipo: 'Funcional', descripcion: 'Rutina accesible para todos' },
    { nombre: 'Potencia', tipo: 'Fuerza', descripcion: 'Ejercicios pliométricos' },
    { nombre: 'Resistencia', tipo: 'Cardio', descripcion: 'Endurance y stamina' },
  ];

  for (const admin of admins) {
    for (let i = 0; i < routineTemplates.length; i++) {
      const template = routineTemplates[i];
      
      // Create routine with the admin as creator
      const rutina = await prisma.rutina.create({
        data: {
          nombre: `${template.nombre} - ${admin.name}`,
          tipo: template.tipo,
          descripcion: template.descripcion,
          creador: admin.name,
        },
      });

      // Create 1-2 days per routine
      const numDias = i < 5 ? 2 : 1;
      
      for (let d = 1; d <= numDias; d++) {
        const ejercicios = [
          { nombre: 'Ejercicio 1', series: '3x10', orden: 1 },
          { nombre: 'Ejercicio 2', series: '3x12', orden: 2 },
          { nombre: 'Ejercicio 3', series: '4x8', orden: 3 },
        ];

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
