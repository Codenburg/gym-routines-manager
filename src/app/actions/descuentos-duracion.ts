"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createDescuentoDuracionSchema, updateDescuentoDuracionSchema, type FormState, type DescuentoDuracionFormState } from "@/lib/schemas";

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(hdrs: Headers): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: hdrs });
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

// P2002 is Prisma's unique constraint violation error code
const isUniqueConstraintError = (error: unknown): boolean => {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
};

/**
 * Get all DescuentosDuracion (for admin)
 */
export async function getDescuentosDuracion(): Promise<DescuentoDuracionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  try {
    const descuentos = await prisma.descuentoDuracion.findMany({
      orderBy: { meses: "asc" },
    });
    return { success: true, data: descuentos };
  } catch (error) {
    console.error("Error fetching descuentos:", error);
    return { success: false, errors: { _form: ["Error al obtener los descuentos"] } };
  }
}

/**
 * Get all DescuentosDuracion (for public display)
 */
export async function getDescuentosDuracionPublic(): Promise<{ descuentos: Array<{ id: number; meses: number; porcentaje: number; createdAt: Date }> }> {
  try {
    const descuentos = await prisma.descuentoDuracion.findMany({
      orderBy: { meses: "asc" },
    });
    return { descuentos };
  } catch (error) {
    console.error("Error fetching public descuentos:", error);
    return { descuentos: [] };
  }
}

/**
 * Create a new DescuentoDuracion
 */
export async function createDescuentoDuracion(
  prevState: DescuentoDuracionFormState,
  formData: FormData
): Promise<DescuentoDuracionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  const rawData = {
    meses: parseInt(formData.get("meses") as string, 10),
    porcentaje: parseInt(formData.get("porcentaje") as string, 10),
  };

  const parsed = createDescuentoDuracionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const descuento = await prisma.descuentoDuracion.create({
      data: { ...parsed.data, gymId: "gym" },
    });

    revalidatePath("/admin/descuentos");
    revalidatePath("/precios");

    return { success: true, data: descuento };
  } catch (error) {
    console.error("Error creating descuento:", error);

    if (isUniqueConstraintError(error)) {
      return { success: false, errors: { meses: ["Ya existe un descuento para esta duración"] } };
    }

    return { success: false, errors: { _form: ["Error al crear el descuento"] } };
  }
}

/**
 * Update an existing DescuentoDuracion
 */
export async function updateDescuentoDuracion(
  id: number,
  prevState: DescuentoDuracionFormState,
  formData: FormData
): Promise<DescuentoDuracionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  const rawData = {
    meses: parseInt(formData.get("meses") as string, 10),
    porcentaje: parseInt(formData.get("porcentaje") as string, 10),
  };

  const parsed = updateDescuentoDuracionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const descuento = await prisma.descuentoDuracion.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/admin/descuentos");
    revalidatePath("/precios");

    return { success: true, data: descuento };
  } catch (error) {
    console.error("Error updating descuento:", error);

    if (isUniqueConstraintError(error)) {
      return { success: false, errors: { meses: ["Ya existe un descuento para esta duración"] } };
    }

    return { success: false, errors: { _form: ["Error al actualizar el descuento"] } };
  }
}

/**
 * Delete a DescuentoDuracion
 */
export async function deleteDescuentoDuracion(
  id: number
): Promise<DescuentoDuracionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  try {
    await prisma.descuentoDuracion.delete({ where: { id } });

    revalidatePath("/admin/descuentos");
    revalidatePath("/precios");

    return { success: true };
  } catch (error) {
    console.error("Error deleting descuento:", error);
    return { success: false, errors: { _form: ["Error al eliminar el descuento"] } };
  }
}