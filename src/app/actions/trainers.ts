"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { type FormState } from "@/lib/schemas";
import { createTrainerSchema, updateTrainerSchema, type CreateTrainerInput, type UpdateTrainerInput } from "@/lib/schemas/trainers";
import type { Role } from "../../../generated/client";

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(
  headersList: Headers
): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: headersList });
    if (!session) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    if (session.user.role !== "ADMIN") {
      return { authorized: false, message: "No tienes permisos de administrador" };
    }
    return { authorized: true };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

/**
 * Helper function to verify admin or trainer access
 */
async function verifyAdminOrTrainer(
  headersList: Headers
): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: headersList });
    if (!session) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "TRAINER") {
      return { authorized: false, message: "No tienes permisos de administrador o entrenador" };
    }
    return { authorized: true };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

// Zod schemas moved to @/lib/schemas/trainers

// ======================
// Server Actions
// ======================

/**
 * Get all trainers (users with TRAINER role)
 */
export async function getTrainers(): Promise<
  Array<{
    id: string;
    username: string | null;
    name: string;
    createdAt: Date;
  }>
> {
  const authCheck = await verifyAdminOrTrainer(await headers());
  if (!authCheck.authorized) {
    return [];
  }

  try {
    const trainers = await prisma.user.findMany({
      where: {
        role: "TRAINER" as Role,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return trainers;
  } catch (error) {
    console.error("Error fetching trainers:", error);
    return [];
  }
}

/**
 * Create a new trainer
 */
export async function createTrainer(
  prevState: FormState<{ id: string; username: string; name: string }>,
  formData: FormData
): Promise<FormState<{ id: string; username: string; name: string }>> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }

  const rawData = {
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
  };

  const parsed = createTrainerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  const { username, name, password } = parsed.data;

  // Check if username already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { dni: username }],
      deletedAt: null,
    },
  });

  if (existing) {
    return {
      success: false,
      errors: { username: ["Este DNI ya está registrado"] },
      message: "El entrenador ya existe",
    };
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with TRAINER role
    const trainer = await prisma.user.create({
      data: {
        username,
        dni: username, // DNI is stored in dni field as well
        name,
        role: "TRAINER" as Role,
      },
    });

    // Create associated Account with credential provider
    await prisma.account.create({
      data: {
        userId: trainer.id,
        accountId: username,
        providerId: "credential",
        providerType: "credential",
        password: hashedPassword,
      },
    });

    revalidatePath("/admin/trainers");

    // Invalidate the "users" cache tag — currently the trainers list
    // read (getTrainers in this file) is NOT cached, but the tag
    // wires the invalidation for any future cached reader that
    // subscribes to user data (e.g. a cached getUsers reader).
    // Next 16 revalidateTag requires a profile arg; cast to `any`
    // to match the project pattern in src/lib/rutinas.ts.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("users");

    return {
      success: true,
      data: { id: trainer.id, username: trainer.username || "", name: trainer.name },
      message: "Entrenador creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating trainer:", error);
    return { success: false, message: "Error al crear el entrenador" };
  }
}

/**
 * Update a trainer's name and/or password
 */
export async function updateTrainer(
  id: string,
  data: { name?: string; password?: string }
): Promise<{ success: boolean; message: string }> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }

  const parsed = updateTrainerSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Error de validación";
    return { success: false, message: firstError };
  }

  // Find trainer and verify role
  const trainer = await prisma.user.findFirst({
    where: { id, role: "TRAINER" as Role, deletedAt: null },
  });

  if (!trainer) {
    return { success: false, message: "Entrenador no encontrado" };
  }

  try {
    // Hash password once if provided (empty string is treated as absent)
    const hashedPassword = parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 12)
      : null;

    // Update name if provided
    if (parsed.data.name) {
      await prisma.user.update({
        where: { id },
        data: { name: parsed.data.name },
      });
    }

    // Only update Account if password changed
    if (hashedPassword) {
      const account = await prisma.account.findFirst({
        where: {
          userId: id,
          providerId: "credential",
        },
      });

      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: { password: hashedPassword },
        });
      }
    }

    revalidatePath("/admin/trainers");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("users");

    return { success: true, message: "Entrenador actualizado exitosamente" };
  } catch (error) {
    console.error("Error updating trainer:", error);
    return { success: false, message: "Error al actualizar el entrenador" };
  }
}

/**
 * Soft delete a trainer (converts to USER role)
 * This preserves routine ownership (creadorId remains valid)
 */
export async function deleteTrainer(
  id: string
): Promise<{ success: boolean; message: string }> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }

  // Find trainer and verify role
  const trainer = await prisma.user.findFirst({
    where: { id, role: "TRAINER" as Role, deletedAt: null },
  });

  if (!trainer) {
    return { success: false, message: "Entrenador no encontrado" };
  }

  try {
    // Soft delete: set role to USER and set deletedAt
    await prisma.user.update({
      where: { id },
      data: {
        role: "USER" as Role,
        deletedAt: new Date(),
      },
    });

    revalidatePath("/admin/trainers");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("users");

    return { success: true, message: "Entrenador eliminado exitosamente" };
  } catch (error) {
    console.error("Error deleting trainer:", error);
    return { success: false, message: "Error al eliminar el entrenador" };
  }
}