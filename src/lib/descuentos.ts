import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cached tenant-scoped read of DescuentosDuracion for server-side consumers.
 *
 * - 60s TTL safety net
 * - tagged "descuentos-duracion". A companion commit
 *   (revalidateTag for descuentos-duracion mutations) wires the
 *   `actions/descuentos-duracion.ts` mutations to call
 *   `revalidateTag("descuentos-duracion")` alongside the existing
 *   `revalidatePath` calls, so saves purge the cache immediately.
 *
 * The admin panel and the public informacion page both consume the same
 * tenant-filtered list. Order is `meses: "asc"` so shorter durations
 * come first.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 */
async function readDescuentos(organizationId: string, cacheKey: string) {
  return unstable_cache(
    async (orgId: string) => {
      try {
        return await prisma.descuentoDuracion.findMany({
          where: { gymId: orgId },
          orderBy: { meses: "asc" },
        });
      } catch (error) {
        console.error("[getDescuentos] Failed to fetch descuentos:", error);
        return [];
      }
    },
    [cacheKey],
    { tags: ["descuentos-duracion", `descuentos-duracion:${organizationId}`], revalidate: 60 }
  )(organizationId);
}

// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getDescuentos(organizationId: string) {
  return readDescuentos(organizationId, "descuentos-duracion");
}

/**
 * Cached tenant-scoped read of duration discounts.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @returns Duration discounts owned by the tenant.
 */
export async function getDescuentosForTenant(organizationId: string) {
  return readDescuentos(organizationId, "descuentos-duracion-for-tenant");
}
