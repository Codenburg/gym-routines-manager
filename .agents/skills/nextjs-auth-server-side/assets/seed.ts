// Seed Script - Create Admin Users
// Run: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const admins = [
    { name: "Admin 1", dni: "11111111", password: "admin123" },
    { name: "Admin 2", dni: "22222222", password: "admin123" },
  ];

  for (const admin of admins) {
    const hashedPwd = await bcrypt.hash(admin.password, 12);

    const user = await prisma.user.upsert({
      where: { dni: admin.dni },
      update: {},
      create: {
        name: admin.name,
        username: admin.dni,
        dni: admin.dni,
        admin: true,
        role: "admin",
      },
    });

    await prisma.account.upsert({
      where: {
        providerId_providerType_accountId: {
          providerId: "credential",
          providerType: "credential",
          accountId: admin.dni,
        },
      },
      update: { password: hashedPwd },
      create: {
        userId: user.id,
        accountId: admin.dni,
        providerId: "credential",
        providerType: "credential",
        password: hashedPwd,
      },
    });

    console.log(`Created admin: ${admin.dni} / ${admin.password}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
