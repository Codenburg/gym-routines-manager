"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rutinaSchema, rutinaUpdateSchema, idSchema, type FormState } from "@/lib/schemas";

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(headers: Headers): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    const user = session.user as { admin?: boolean } | undefined;
    if (!user?.admin) {
      return { authorized: false, message: "No tienes permisos de administrador" };
    }
    return { authorized: true };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

/**
 * Create a new Rutina
 */
export async function createRutina(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = rutinaSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const rutina = await prisma.rutina.create({
      data: parsed.data,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");

    return {
      success: true,
      data: { id: rutina.id },
      message: "Rutina creada exitosamente",
    };
  } catch (error) {
    console.error("Error creating rutina:", error);
    return {
      success: false,
      message: "Error al crear la rutina",
    };
  }
}

/**
 * Update an existing Rutina
 */
export async function updateRutina(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  const id = formData.get("id") as string;

  // Validate UUID format
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) {
    return {
      success: false,
      message: "ID de rutina inválido",
    };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = rutinaUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const rutina = await prisma.rutina.update({
      where: { id: idParsed.data },
      data: parsed.data,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");
    revalidatePath(`/admin/rutinas/${idParsed.data}`);

    return {
      success: true,
      data: { id: rutina.id },
      message: "Rutina actualizada exitosamente",
    };
  } catch (error) {
    console.error("Error updating rutina:", error);
    return {
      success: false,
      message: "Error al actualizar la rutina",
    };
  }
}

/**
 * Delete a Rutina
 */
export async function deleteRutina(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  const id = formData.get("id") as string;

  // Validate UUID format
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return {
      success: false,
      message: "ID de rutina inválido",
    };
  }

  try {
    await prisma.rutina.delete({
      where: { id: parsed.data },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");

    return {
      success: true,
      message: "Rutina eliminada exitosamente",
    };
  } catch (error) {
    console.error("Error deleting rutina:", error);
    return {
      success: false,
      message: "Error al eliminar la rutina",
    };
  }
}

/**
 * Get all Rutinas (for server components)
 */
export async function getRutinas() {
  try {
    const rutinas = await prisma.rutina.findMany({
      include: {
        dias: {
          include: {
            ejercicios: true,
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rutinas.map((rutina) => ({
      ...rutina,
      diasCount: rutina.dias.length,
    }));
  } catch (error) {
    console.error("Error fetching rutinas:", error);
    return [];
  }
}

/**
 * Get a single Rutina by ID
 */
export async function getRutina(id: string) {
  try {
    const rutina = await prisma.rutina.findUnique({
      where: { id },
      include: {
        dias: {
          include: {
            ejercicios: {
              orderBy: { orden: "asc" },
            },
          },
          orderBy: { orden: "asc" },
        },
      },
    });

    return rutina;
  } catch (error) {
    console.error("Error fetching rutina:", error);
    return null;
  }
}
