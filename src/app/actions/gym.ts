"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { type FormState } from "@/lib/schemas";

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
 * Get Gym configuration (for server components)
 */
export async function getGymConfig() {
  try {
    const gym = await prisma.gym.findUnique({
      where: { id: "gym" },
    });
    return gym;
  } catch (error) {
    console.error("Error fetching gym config:", error);
    return null;
  }
}

/**
 * Zod schema for price validation
 * min: 1000 ARS, max: 500000 ARS, max 2 decimal places
 */
const priceSchema = z.object({
  price: z.coerce
    .number()
    .min(1, { message: "El precio debe ser positivo" })
    .min(1000, { message: "El precio mínimo es $1.000" })
    .max(500000, { message: "El precio máximo es $500.000" })
    .refine((v) => Number(v.toFixed(2)) === v, {
      message: "Máximo 2 decimales",
    }),
});

/**
 * Update gym price
 */
export async function updateGymPrice(
  prevState: FormState<{ price: number }>,
  formData: FormData
): Promise<FormState<{ price: number }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }

  // Validate price with Zod
  const rawPrice = formData.get("price");
  const parsed = priceSchema.safeParse({ price: rawPrice });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    // Check if gym exists
    const existing = await prisma.gym.findUnique({
      where: { id: "gym" },
    });

    if (!existing) {
      return { success: false, message: "Configuración del gym no encontrada" };
    }

    const gym = await prisma.gym.update({
      where: { id: "gym" },
      data: { price: parsed.data.price },
    });

    // Revalidate paths
    revalidatePath("/api/gym");
    revalidatePath("/informacion");
    revalidatePath("/admin");

    return {
      success: true,
      data: { price: Number(gym.price) },
      message: "Precio actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error updating gym price:", error);
    return { success: false, message: "Error al actualizar el precio" };
  }
}
