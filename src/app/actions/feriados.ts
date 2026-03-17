"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { feriadoSchema, idSchema, type FormState } from "@/lib/schemas";

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
 * Get all Feriados (for server components)
 */
export async function getFeriados() {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: "asc" },
    });
    return feriados;
  } catch (error) {
    console.error("Error fetching feriados:", error);
    return [];
  }
}

/**
 * Create a new Feriado
 */
export async function createFeriado(
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
  const parsed = feriadoSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const feriado = await prisma.feriado.create({
      data: parsed.data,
    });

    revalidatePath("/admin/informacion");

    return {
      success: true,
      data: { id: feriado.id },
      message: "Feriado creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating feriado:", error);
    return {
      success: false,
      message: "Error al crear el feriado",
    };
  }
}

/**
 * Delete a Feriado
 */
export async function deleteFeriado(
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
      message: "ID de feriado inválido",
    };
  }

  try {
    await prisma.feriado.delete({
      where: { id: parsed.data },
    });

    revalidatePath("/admin/informacion");

    return {
      success: true,
      message: "Feriado eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error deleting feriado:", error);
    return {
      success: false,
      message: "Error al eliminar el feriado",
    };
  }
}