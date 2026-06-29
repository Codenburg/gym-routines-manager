"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { getActiveMemberAuthContext } from "@/lib/auth";
import { type FormState } from "@/lib/schemas";
import { createTrainerSchema, updateTrainerSchema } from "@/lib/schemas/trainers";

/**
 * Helper function to verify admin access
 */
type AdminAuthCheck =
  | { authorized: true; activeOrganizationId: string }
  | { authorized: false; message: string };

async function verifyAdmin(
  headersList: Headers
): Promise<AdminAuthCheck> {
  try {
    const authContext = await getActiveMemberAuthContext(headersList);
    if (!authContext) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    if (authContext.role !== "admin") {
      return { authorized: false, message: "No tienes permisos de administrador" };
    }
    return { authorized: true, activeOrganizationId: authContext.activeOrganizationId };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

// Zod schemas moved to @/lib/schemas/trainers

// ======================
// Server Actions
// ======================

/**
 * Get all trainers in the active organization.
 */
export async function getTrainers(): Promise<
  Array<{
    id: string;
    username: string | null;
    name: string;
    createdAt: Date;
  }>
> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return [];
  }
  const { activeOrganizationId } = authCheck;

  try {
    const trainerMemberships = await prisma.member.findMany({
      where: {
        organizationId: activeOrganizationId,
        role: "trainer",
        user: { deletedAt: null },
      },
      select: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return trainerMemberships.map(({ user }) => user);
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
  const { activeOrganizationId } = authCheck;

  const rawData = {
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
  };

  const parsed = createTrainerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors,
      message: "Error de validación",
    };
  }

  const { username, name, password } = parsed.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { dni: username }],
        deletedAt: null,
      },
      select: { id: true, username: true, name: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.member.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: activeOrganizationId,
          },
        },
        select: { role: true },
      });

      if (existingMembership?.role === "trainer") {
        return {
          success: false,
          errors: { username: ["Este DNI ya está registrado como entrenador"] },
          message: "El entrenador ya existe",
        };
      }

      if (existingMembership) {
        return {
          success: false,
          errors: { username: ["Este usuario ya pertenece a la organización"] },
          message: "El usuario ya pertenece a la organización",
        };
      }

      await prisma.member.create({
        data: {
          userId: existingUser.id,
          organizationId: activeOrganizationId,
          role: "trainer",
        },
      });

      revalidatePath("/admin/trainers");
      revalidateTag("users", "max");

      return {
        success: true,
        data: { id: existingUser.id, username: existingUser.username || "", name: existingUser.name },
        message: "Entrenador creado exitosamente",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const trainer = await prisma.$transaction(async (tx) => {
      const createdTrainer = await tx.user.create({
        data: {
          username,
          dni: username,
          name,
        },
      });

      await tx.account.create({
        data: {
          userId: createdTrainer.id,
          accountId: username,
          providerId: "credential",
          providerType: "credential",
          password: hashedPassword,
        },
      });

      await tx.member.create({
        data: {
          userId: createdTrainer.id,
          organizationId: activeOrganizationId,
          role: "trainer",
        },
      });

      return createdTrainer;
    });

    revalidatePath("/admin/trainers");

    // Invalidate the "users" cache tag — currently the trainers list
    // read (getTrainers in this file) is NOT cached, but the tag
    // wires the invalidation for any future cached reader that
    // subscribes to user data (e.g. a cached getUsers reader).
    revalidateTag("users", "max");

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
  const { activeOrganizationId } = authCheck;

  const parsed = updateTrainerSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = Object.values(z.flattenError(parsed.error).fieldErrors)[0]?.[0] || "Error de validación";
    return { success: false, message: firstError };
  }

  const trainerMembership = await prisma.member.findFirst({
    where: {
      userId: id,
      organizationId: activeOrganizationId,
      role: "trainer",
      user: { deletedAt: null },
    },
    select: { userId: true },
  });

  if (!trainerMembership) {
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

    revalidateTag("users", "max");

    return { success: true, message: "Entrenador actualizado exitosamente" };
  } catch (error) {
    console.error("Error updating trainer:", error);
    return { success: false, message: "Error al actualizar el entrenador" };
  }
}

/**
 * Remove the trainer membership from the active organization.
 * This preserves the user and any routine ownership.
 */
export async function deleteTrainer(
  id: string
): Promise<{ success: boolean; message: string }> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }
  const { activeOrganizationId } = authCheck;

  const trainerMembership = await prisma.member.findFirst({
    where: {
      userId: id,
      organizationId: activeOrganizationId,
      role: "trainer",
      user: { deletedAt: null },
    },
    select: { id: true },
  });

  if (!trainerMembership) {
    return { success: false, message: "Entrenador no encontrado" };
  }

  try {
    await prisma.member.delete({
      where: { id: trainerMembership.id },
    });

    revalidatePath("/admin/trainers");

    revalidateTag("users", "max");

    return { success: true, message: "Entrenador eliminado exitosamente" };
  } catch (error) {
    console.error("Error deleting trainer:", error);
    return { success: false, message: "Error al eliminar el entrenador" };
  }
}
