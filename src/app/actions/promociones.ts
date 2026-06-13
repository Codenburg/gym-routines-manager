"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GYM_SINGLETON_ID } from "@/lib/gym-constants";
import {
  createPromocionSchema,
  updatePromocionContentSchema,
  updatePromocionPrecioSchema,
  togglePromocionActivoSchema,
  type ActionResult,
  type PromocionFormState,
} from "@/lib/schemas";

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(hdrs: Headers): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: hdrs });
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
export async function getPromocionesActivas(): Promise<{
  promociones: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    activo: boolean;
    createdAt: Date;
  }>;
}> {
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
      data: { ...parsed.data, gymId: GYM_SINGLETON_ID },
    });

    // Next 16 revalidateTag requires a profile arg; the existing project
    // pattern (src/lib/rutinas.ts, src/app/actions/gym.ts) is to cast to
    // `any` and call with one arg. Follow the same idiom to keep the
    // call site uniform.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("promociones");
    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { success: true, data: promocion };
  } catch (error) {
    console.error("Error creating promocion:", error);
    return { success: false, errors: { _form: ["Error al crear la promoción"] } };
  }
}

/**
 * Update promocion content (titulo, descripcion only) - atomic
 */
export async function updatePromocionContent(
  data: { id: string; titulo: string; descripcion?: string }
): Promise<ActionResult<{ id: string; titulo: string; descripcion: string; precio: number; activo: boolean }>> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { data: null, error: { code: "UNAUTHORIZED", message: authCheck.message || "No autorizado" } };
  }

  const parsed = updatePromocionContentSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation error";
    return { data: null, error: { code: "VALIDATION_ERROR", message: firstError } };
  }

  try {
    const promocion = await prisma.promocion.update({
      where: { id: parsed.data.id },
      data: {
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("promociones");
    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { data: promocion, error: null };
  } catch (error) {
    console.error("Error updating promocion content:", error);
    return { data: null, error: { code: "UPDATE_ERROR", message: "Error al actualizar el contenido de la promoción" } };
  }
}

/**
 * Update promocion precio only - atomic
 */
export async function updatePromocionPrecio(
  data: { id: string; precio: number }
): Promise<ActionResult<{ id: string; titulo: string; descripcion: string; precio: number; activo: boolean }>> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { data: null, error: { code: "UNAUTHORIZED", message: authCheck.message || "No autorizado" } };
  }

  const parsed = updatePromocionPrecioSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation error";
    return { data: null, error: { code: "VALIDATION_ERROR", message: firstError } };
  }

  try {
    const promocion = await prisma.promocion.update({
      where: { id: parsed.data.id },
      data: {
        precio: parsed.data.precio,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("promociones");
    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { data: promocion, error: null };
  } catch (error) {
    console.error("Error updating promocion precio:", error);
    return { data: null, error: { code: "UPDATE_ERROR", message: "Error al actualizar el precio de la promoción" } };
  }
}

/**
 * Toggle promocion activo status - synchronous (no optimistic UI)
 * Only mutates the activo field
 */
export async function togglePromocionActivo(
  data: { id: string; activo: boolean }
): Promise<ActionResult<{ id: string; titulo: string; descripcion: string; precio: number; activo: boolean }>> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { data: null, error: { code: "UNAUTHORIZED", message: authCheck.message || "No autorizado" } };
  }

  const parsed = togglePromocionActivoSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation error";
    return { data: null, error: { code: "VALIDATION_ERROR", message: firstError } };
  }

  try {
    const promocion = await prisma.promocion.update({
      where: { id: parsed.data.id },
      data: {
        activo: parsed.data.activo,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("promociones");
    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { data: promocion, error: null };
  } catch (error) {
    console.error("Error toggling promocion activo:", error);
    return { data: null, error: { code: "UPDATE_ERROR", message: "Error al cambiar el estado de la promoción" } };
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("promociones");
    revalidatePath("/admin/promociones");
    revalidatePath("/precios");

    return { success: true };
  } catch (error) {
    console.error("Error deleting promocion:", error);
    return { success: false, errors: { _form: ["Error al eliminar la promoción"] } };
  }
}
