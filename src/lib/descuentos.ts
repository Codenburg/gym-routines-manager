import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cached read of all DescuentosDuracion for server-side consumers
 * (admin panel, public informacion page).
 *
 * - 60s TTL safety net
 * - tagged "descuentos-duracion". A companion commit
 *   (revalidateTag for descuentos-duracion mutations) wires the
 *   `actions/descuentos-duracion.ts` mutations to call
 *   `revalidateTag("descuentos-duracion")` alongside the existing
 *   `revalidatePath` calls, so saves purge the cache immediately.
 *
 * The admin panel and the public informacion page both consume the same
 * unfiltered list (no active/inactive flag on this entity). Order is
 * `meses: "asc"` so shorter durations come first.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 */
export async function getDescuentos() {
  "use cache";
  cacheTag("descuentos-duracion");
  cacheLife({ revalidate: 60 });

  try {
    return await prisma.descuentoDuracion.findMany({
      orderBy: { meses: "asc" },
    });
  } catch (error) {
    console.error("[getDescuentos] Failed to fetch descuentos:", error);
    return [];
  }
}
