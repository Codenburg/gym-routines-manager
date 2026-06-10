"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  type FormState,
  type GymDisplay,
  type GymField,
  gymFieldSchema,
} from "@/lib/schemas";

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
 *
 * Uncached, fresh read. Prefer `getGymConfigForServer` for hot paths.
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
 * Cached read of the Gym singleton for server-side consumers
 * (root metadata, public pages, admin layout).
 *
 * - 60s TTL safety net
 * - tagged "gym-config" so `revalidateTag("gym-config")` in
 *   `updateGymField` purges the cache immediately on save
 *
 * Note: uses `unstable_cache` (Next 15.x). The migration path to
 * `use cache` + `cacheTag` is documented in the design and will be
 * applied when `cacheComponents: true` is enabled in next.config.ts.
 */
export const getGymConfigForServer = unstable_cache(
  async () => {
    try {
      return await prisma.gym.findUnique({ where: { id: "gym" } });
    } catch (error) {
      console.error("Error fetching cached gym config:", error);
      return null;
    }
  },
  ["gym-config"],
  { tags: ["gym-config"], revalidate: 60 }
);

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

/**
 * Update a single Gym display field (admin only).
 *
 * Per-field (not bulk) so partial saves do not overwrite siblings with
 * empty strings. The discriminated union `gymFieldSchema` in schemas.ts
 * picks the right validator per discriminant:
 *   - string fields: trim + min(1) + max(N)
 *   - URL fields: z.string().url() + max(N)
 *
 * On success, the action:
 *   1. Updates the singleton Gym row with `[field]: value`.
 *   2. `revalidateTag("gym-config")` — purges the cached reader used by
 *      generateMetadata and the public pages.
 *   3. `revalidatePath` for `/`, `/informacion`, `/admin` — forces a
 *      fresh render of every page that consumes the gym config.
 *
 * Returns FormState<{ field, value }> so the calling form can resync
 * inputs and trigger a success toast.
 */
export async function updateGymField(
  prevState: FormState<{ field: GymField; value: string }>,
  formData: FormData
): Promise<FormState<{ field: GymField; value: string }>> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message || "No autorizado" };
  }

  const parsed = gymFieldSchema.safeParse({
    field: formData.get("field"),
    value: formData.get("value"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const existing = await prisma.gym.findUnique({ where: { id: "gym" } });
    if (!existing) {
      return { success: false, message: "Configuración del gym no encontrada" };
    }

    await prisma.gym.update({
      where: { id: "gym" },
      data: { [parsed.data.field]: parsed.data.value },
    });

    // Next 16 revalidateTag requires a profile arg; the existing project
    // pattern (src/lib/rutinas.ts) is to cast to `any` and call with one
    // arg. Follow the same idiom to keep the call site uniform.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)("gym-config");
    revalidatePath("/");
    revalidatePath("/informacion");
    revalidatePath("/admin");

    return {
      success: true,
      data: { field: parsed.data.field, value: parsed.data.value },
      message: "Configuración actualizada",
    };
  } catch (error) {
    console.error("[updateGymField] failed", error);
    return {
      success: false,
      message: "Error al guardar la configuración",
    };
  }
}

// re-export the public display type so consumers don't need to import from
// @/lib/schemas separately. Keeping the export here matches the existing
// pattern (the file already exports getGymConfig for public reads).
export type { GymDisplay };
