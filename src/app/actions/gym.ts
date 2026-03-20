"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
 * Update gym price
 */
export async function updateGymPrice(price: number): Promise<{
  success: boolean;
  message: string;
  data?: { price: number };
}> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }

  // Validate price
  if (typeof price !== "number" || price <= 0) {
    return { success: false, message: "El precio debe ser un número positivo" };
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
      data: { price },
    });

    // Revalidate paths
    revalidatePath("/api/gym");
    revalidatePath("/informacion");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Precio actualizado exitosamente",
      data: { price: Number(gym.price) },
    };
  } catch (error) {
    console.error("Error updating gym price:", error);
    return { success: false, message: "Error al actualizar el precio" };
  }
}
