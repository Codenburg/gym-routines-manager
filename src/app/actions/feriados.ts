"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { normalizeToDate, getToday } from "@/lib/dates";
import { createFeriadoSchema, updateFeriadoSchema, idSchema, type FormState } from "@/lib/schemas";

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(headers: Headers): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers });
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
  const parsed = createFeriadoSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  // Normalize fecha to YYYY-MM-DD (string, calendar date only)
  const normalizedFecha = normalizeToDate(parsed.data.fecha);

  // Block past dates at security layer
  const today = getToday();
  if (normalizedFecha < today) {
    return { success: false, message: "No se pueden crear feriados en fechas pasadas", statusCode: 400 };
  }

  // Pre-check for duplicate (UX optimization before DB constraint check)
  // Note: gymId defaults to "gym" since there's only one gym
  const existing = await prisma.feriado.findFirst({
    where: {
      gymId: "gym",
      fecha: normalizedFecha, // String comparison directly
    },
  });

  if (existing) {
    return {
      success: false,
      message: "Ya existe un feriado para esta fecha",
      statusCode: 409,
      code: "DUPLICATE",
    };
  }

  try {
    const feriado = await prisma.feriado.create({
      data: {
        ...parsed.data,
        fecha: normalizedFecha, // String directly, not Date
      },
    });

    revalidatePath("/admin/informacion");

    return {
      success: true,
      data: { id: feriado.id },
      message: "Feriado creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating feriado:", error);

    // Check for P2002 from race condition (pre-check passed but create failed)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return {
        success: false,
        message: "Ya existe un feriado para esta fecha",
        statusCode: 409,
        code: "DUPLICATE",
      };
    }

    return {
      success: false,
      message: "Error al crear el feriado",
    };
  }
}

/**
 * Update an existing Feriado
 */
export async function updateFeriado(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  // Get ID from formData
  const id = formData.get("id") as string;

  // Validate UUID format
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      message: "ID de feriado inválido",
    };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = updateFeriadoSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  // If fecha is being updated, normalize it
  let normalizedFecha: string | undefined;
  if (parsed.data.fecha) {
    normalizedFecha = normalizeToDate(parsed.data.fecha);
  }

  // Block past dates at security layer (only if fecha is being updated)
  const today = getToday();
  if (normalizedFecha && normalizedFecha < today) {
    return { success: false, message: "No se pueden crear feriados en fechas pasadas", statusCode: 400 };
  }

  // Pre-check for duplicate (excluding current record)
  // Note: gymId defaults to "gym" since there's only one gym
  if (normalizedFecha) {
    const existing = await prisma.feriado.findFirst({
      where: {
        gymId: "gym",
        fecha: normalizedFecha, // String comparison directly
        NOT: { id: parsedId.data },
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Ya existe un feriado para esta fecha",
        statusCode: 409,
        code: "DUPLICATE",
      };
    }
  }

  try {
    const updateData: { fecha?: string; todo_dia?: boolean; hora_inicio?: string | null; hora_fin?: string | null } = {
      ...parsed.data,
    };

    // Normalize fecha if provided (keep as string)
    if (normalizedFecha) {
      updateData.fecha = normalizedFecha;
    }

    const feriado = await prisma.feriado.update({
      where: { id: parsedId.data },
      data: updateData,
    });

    revalidatePath("/admin/informacion");

    return {
      success: true,
      data: { id: feriado.id },
      message: "Feriado actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error updating feriado:", error);

    // Check for P2002 from race condition
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return {
        success: false,
        message: "Ya existe un feriado para esta fecha",
        statusCode: 409,
        code: "DUPLICATE",
      };
    }

    return {
      success: false,
      message: "Error al actualizar el feriado",
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
