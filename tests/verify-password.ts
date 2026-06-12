import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || '';
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!urlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;
const pool = new Pool({ user, password, host, port: parseInt(port, 10), database });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyPasswords() {
  // Get all accounts with their users
  const accounts = await prisma.account.findMany({
    where: { providerId: 'username' },
    include: { user: true }
  });

  for (const account of accounts) {
    console.log(`\nAccount: ${account.accountId}`);
    console.log(`User: ${account.user.name} (DNI: ${account.user.dni})`);
    console.log(`Stored hash: ${account.password?.substring(0, 30)}...`);
    
    // Try to verify the password
    const testPassword = account.user.name === 'Nando' ? 'nando123' 
                       : account.user.name === 'Leo' ? 'leo123'
                       : 'santi123';
    
    const isValid = await bcrypt.compare(testPassword, account.password || '');
    console.log(`Testing password "${testPassword}": ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);
  }

  await prisma.$disconnect();
}

verifyPasswords();
