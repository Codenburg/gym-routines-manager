import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || '';
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!urlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;
const dbName = database.split('?')[0];

const pool = new Pool({ user, password, host, port: parseInt(port, 10), database: dbName });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAccounts() {
  const accounts = await prisma.account.findMany({
    include: { user: true }
  });
  
  console.log('Accounts in database:');
  for (const account of accounts) {
    console.log({
      id: account.id,
      userId: account.userId,
      accountId: account.accountId,
      providerId: account.providerId,
      providerType: account.providerType,
      hasPassword: !!account.password,
      userName: account.user?.name,
      userUsername: account.user?.username,
      userDni: account.user?.dni,
    });
  }
  
  await prisma.$disconnect();
}

checkAccounts();
