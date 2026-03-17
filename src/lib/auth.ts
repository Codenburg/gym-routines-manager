import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { username } from "better-auth/plugins";
import bcrypt from "bcrypt";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Validar DNI como username (7-8 dígitos)
    emailValidator: (email: string) => {
      // Por ahora aceptamos cualquier email válido
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  // Plugin de username para iniciar sesión con DNI
  plugins: [
    username(),
    admin()
  ],
  user: {
    additionalFields: {
      admin: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
