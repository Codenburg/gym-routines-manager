"use server";

import { revalidatePath, revalidateTag, unstable_cache, updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  type FormState,
  type GymField,
  type HorarioSemanal,
  gymFieldSchema,
  horarioSemanalSchema,
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
 * Uncached, fresh read. Prefer `getGymNameForServer` for hot paths.
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
 * Cached read of the Gym singleton's `nombre` field for server-side
 * consumers (root metadata, public pages, admin layout).
 *
 * Returns only the raw `dbName` (string | null). The full fallback
 * chain (`DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"`) is applied by the
 * `resolveGymName` utility that every caller wraps this in.
 *
 * Keeping the read narrow avoids leaking Prisma's `Decimal`,
 * `Date`, and `Prisma.JsonValue` instances into the cache output.
 * The RSC serializer cannot pass `Decimal` through the
 * Server-to-Client boundary, and the previous full-row reader
 * tripped the browser console with:
 *
 *   Only plain objects can be passed to Client Components from
 *   Server Components. Decimal objects are not supported.
 *
 * See GGA-FOLLOWUP-3.
 *
 * - 60s TTL safety net
 * - tagged "gym-config" so `revalidateTag("gym-config")` in
 *   `updateGymField` purges the cache immediately on save
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 * Requires `cacheComponents: true` in `next.config.ts` (Slice 2).
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getGymNameForServer(): Promise<string | null> {
  return unstable_cache(
    async () => {
      try {
        const gym = await prisma.gym.findUnique({
          where: { id: "gym" },
          select: { nombre: true },
        });
        return gym?.nombre ?? null;
      } catch (error) {
        console.error("Error fetching cached gym name:", error);
        return null;
      }
    },
    ["gym-name"],
    { tags: ["gym-config"], revalidate: 60 }
  )();
}

/**
 * Zod-narrowed snapshot of the gym display fields, ready to be passed
 * to client components. The raw `prisma.gym` row types `horarioJson`
 * as `Prisma.JsonValue` (loose), so we validate it against
 * `horarioSemanalSchema` at this read boundary. A corrupt / legacy row
 * collapses to `null` — the public `HoursSection` hides itself, the
 * admin `WeeklyScheduleEditor` falls back to the "all closed" default.
 *
 * Tied to the same `gym-config` tag as `getGymNameForServer`, so
 * `revalidateTag("gym-config")` (fired by `updateGymField`) purges
 * both readers in lockstep.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getGymDisplayForServer() {
  return unstable_cache(
    async () => {
      try {
        const gym = await prisma.gym.findUnique({ where: { id: "gym" } });
        if (!gym) return null;
        const horarioJsonParsed = horarioSemanalSchema.safeParse(gym.horarioJson);
        const horarioJson: HorarioSemanal | null = horarioJsonParsed.success
          ? horarioJsonParsed.data
          : null;
        return {
          nombre: gym.nombre,
          horarioJson,
          direccion: gym.direccion,
          mapsEmbedUrl: gym.mapsEmbedUrl,
          socialInstagram: gym.socialInstagram,
          socialWhatsapp: gym.socialWhatsapp,
        };
      } catch (error) {
        console.error("Error fetching cached gym display:", error);
        return null;
      }
    },
    ["gym-display"],
    { tags: ["gym-config"], revalidate: 60 }
  )();
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
      errors: z.flattenError(parsed.error).fieldErrors,
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

    revalidateTag("gym-config", "max");

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
 *   - horarioJson: a JSON-stringified HorarioSemanal object (or "null")
 *
 * On success, the action:
 *   1. Updates the singleton Gym row with `[field]: value`.
 *      For string fields, `value` is the literal string. For
 *      `horarioJson`, `value` is the parsed HorarioSemanal object
 *      (or null) — Prisma accepts a JSON object directly into a `Json?`
 *      column.
 *   2. `revalidateTag("gym-config")` — purges the cached reader used by
 *      generateMetadata and the public pages.
 *   3. `revalidatePath` for `/`, `/informacion`, `/admin` — forces a
 *      fresh render of every page that consumes the gym config.
 *
 * Returns FormState<{ field, value }> so the calling form can resync
 * inputs and trigger a success toast. The `value` is the post-parse
 * payload: a string for string/URL fields, a `HorarioSemanal` object
 * (or null) for `horarioJson`.
 */
export async function updateGymField(
  prevState: FormState<{ field: GymField; value: unknown }>,
  formData: FormData
): Promise<FormState<{ field: GymField; value: unknown }>> {
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
      errors: z.flattenError(parsed.error).fieldErrors,
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

    revalidateTag("gym-config", "max");
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

// Note: GymDisplay is defined and exported from @/lib/schemas. It was
// previously re-exported from this file for convenience, but a
// "use server" file can only export async functions — type-only
// re-exports break the Turbopack actions bundler the first time a
// Server Component route imports any function from this module.
// Consumers should import GymDisplay directly from @/lib/schemas.

/**
 * Clearable subset of `GymField` — the 4 nullable display fields that
 * can be reset to `null` from the admin UI. Excludes `nombre` (required,
 * never clearable per R2) and `horarioJson` (structured, cleared via its
 * own WeeklyScheduleEditor flow).
 *
 * Literal union + runtime guard (D6) — narrower than the full
 * discriminated union from `gymFieldSchema` and free of Zod bundle cost.
 */
const CLEARABLE_GYM_FIELDS = [
  "direccion",
  "mapsEmbedUrl",
  "socialInstagram",
  "socialWhatsapp",
] as const;

export type ClearableGymField = (typeof CLEARABLE_GYM_FIELDS)[number];

function isClearableGymField(v: unknown): v is ClearableGymField {
  return (
    typeof v === "string" &&
    (CLEARABLE_GYM_FIELDS as readonly string[]).includes(v)
  );
}

export type ClearGymFieldResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Clear a single optional gym display field to `null`.
 *
 * ADMIN-only — mirrors `updateGymField` (`src/app/actions/gym.ts:245-247`)
 * for the auth pattern: `verifyAdmin(headers)` returns
 * `{ authorized, message }`, and the action returns the message on
 * rejection (does NOT throw — server actions consumed by
 * `useTransition`/`useActionState` need a typed return).
 *
 * Bypasses `gymFieldSchema` (which enforces `min(1)` / `url()`) because
 * the schema's purpose is to reject empty URL submissions from the
 * Guardar form. The Vaciar button explicitly WANTS to write `null`,
 * which is the whole point of this action.
 *
 * On success:
 *   - `prisma.gym.update({ where: { id: "gym" }, data: { [field]: null } })`
 *   - `revalidateTag("gym-config", "max")` — purges the cached readers
 *     in `getGymNameForServer` and `getGymDisplayForServer`.
 *   - 3 `revalidatePath` calls: `/`, `/informacion`, `/admin/config`.
 *
 * On any thrown error (DB, validation, network): logs and returns
 * `{ success: false, message: "Error al eliminar el campo" }`. The
 * client (`FieldSubForm.handleClear`) reads the message and shows a
 * destructive toast via `showError`, preserving the input value
 * (REQ-7 — uncontrolled `key={displayedValue}` is not mutated).
 */
export async function clearGymDisplayField(
  field: ClearableGymField,
): Promise<ClearGymFieldResult> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message ?? "No autorizado" };
  }
  if (!isClearableGymField(field)) {
    return { success: false, message: "Campo no vaciable" };
  }
  try {
    await prisma.gym.update({
      where: { id: "gym" },
      data: { [field]: null },
    });
    // Invalidate the cached reader so the next read sees fresh data.
    // We only call revalidateTag — NOT revalidatePath.
    //
    // Why no revalidatePath: in Next.js 16, calling revalidatePath
    // from a server action auto-refreshes the CURRENT route
    // synchronously (verified empirically — the admin input re-mounts
    // empty within ~200ms after the server action returns, even
    // though our client never calls router.refresh()). That defeats
    // the D3 "delayed refresh" semantics: the user must see the OLD
    // value during the 5s undo window.
    //
    // updateTag gives read-your-own-writes semantics (Next.js 16
    // preferred over revalidateTag for Server Actions): the next
    // reader sees the just-written null value immediately, regardless
    // of the previous cache lifetime. This pairs with the explicit
    // router.refresh() in handleClear (Fix 3 of the 2nd polish pass)
    // which re-fetches the RSC tree so the input visually clears in
    // parallel with the toast appearing.
    updateTag("gym-config");
    return { success: true };
  } catch (err) {
    console.error("[clearGymDisplayField] failed", err);
    return { success: false, message: "Error al eliminar el campo" };
  }
}
