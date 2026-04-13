"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createPromocionSchema, updatePromocionSchema, type FormState, type PromocionFormState } from "@/lib/schemas";

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

/**
 * Get all Promociones (for admin)
 */
export async function getPromociones(): Promise<PromocionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  try {
    const promociones = await prisma.promocion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: promociones };
  } catch (error) {
    console.error("Error fetching promociones:", error);
    return { success: false, errors: { _form: ["Error al obtener las promociones"] } };
  }
}

/**
 * Get all active Promociones (for public display)
 */
export async function getPromocionesActivas(): Promise<{ promociones: Array<{ id: string; titulo: string; descripcion: string; precio: string; activo: boolean; createdAt: Date }> }> {
  try {
    const promociones = await prisma.promocion.findMany({
      where: { activo: true },
      orderBy: { createdAt: "desc" },
    });
    return { promociones };
  } catch (error) {
    console.error("Error fetching active promociones:", error);
    return { promociones: [] };
  }
}

/**
 * Create a new Promocion
 */
export async function createPromocion(
  prevState: PromocionFormState,
  formData: FormData
): Promise<PromocionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  const rawData = {
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    precio: formData.get("precio"),
    activo: formData.get("activo") === "true",
  };

  const parsed = createPromocionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const promocion = await prisma.promocion.create({
      data: { ...parsed.data, gymId: "gym" },
    });

    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { success: true, data: promocion };
  } catch (error) {
    console.error("Error creating promocion:", error);
    return { success: false, errors: { _form: ["Error al crear la promoción"] } };
  }
}

/**
 * Update an existing Promocion
 */
export async function updatePromocion(
  id: string,
  prevState: PromocionFormState,
  formData: FormData
): Promise<PromocionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  const rawData = {
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    precio: formData.get("precio"),
    activo: formData.get("activo") === "true",
  };

  const parsed = updatePromocionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const promocion = await prisma.promocion.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { success: true, data: promocion };
  } catch (error) {
    console.error("Error updating promocion:", error);
    return { success: false, errors: { _form: ["Error al actualizar la promoción"] } };
  }
}

/**
 * Delete a Promocion
 */
export async function deletePromocion(
  id: string
): Promise<PromocionFormState> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, errors: { _form: [authCheck.message || "No autorizado"] } };
  }

  try {
    await prisma.promocion.delete({ where: { id } });

    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { success: true };
  } catch (error) {
    console.error("Error deleting promocion:", error);
    return { success: false, errors: { _form: ["Error al eliminar la promoción"] } };
  }
}