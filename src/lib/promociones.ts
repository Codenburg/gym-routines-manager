import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cached read of all Promociones for server-side consumers
 * (admin panel, public informacion page).
 *
 * - 60s TTL safety net
 * - tagged "promociones" so `revalidateTag("promociones")` in
 *   `actions/promociones.ts` purges the cache immediately on save.
 *
 * The admin panel currently shows ALL promociones (active and inactive);
 * the public informacion page in Slice 3 will filter `activo === true`
 * client-side from this same reader (or split into a separate
 * `getPromocionesActivasPublic` reader — TBD at Slice 3).
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getPromociones() {
  return unstable_cache(
    async () => {
      try {
        return await prisma.promocion.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("[getPromociones] Failed to fetch promociones:", error);
        return [];
      }
    },
    ["promociones"],
    { tags: ["promociones"], revalidate: 60 }
  )();
}

/**
 * Cached tenant-scoped read of promociones for public/server consumers.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @returns Promociones owned by the tenant.
 */
export async function getPromocionesForTenant(organizationId: string) {
  return unstable_cache(
    async (orgId: string) => {
      try {
        return await prisma.promocion.findMany({
          where: { gymId: orgId },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("[getPromocionesForTenant] Failed to fetch promociones:", error);
        return [];
      }
    },
    ["promociones-for-tenant"],
    { tags: ["promociones", `promociones:${organizationId}`], revalidate: 60 }
  )(organizationId);
}

/**
 * Cached tenant-scoped read of active promociones for the public information page.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @returns Active promociones owned by the tenant.
 */
export async function getPromocionesActivasForTenant(organizationId: string) {
  return unstable_cache(
    async (orgId: string) => {
      try {
        return await prisma.promocion.findMany({
          where: { gymId: orgId, activo: true },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("[getPromocionesActivasForTenant] Failed to fetch promociones:", error);
        return [];
      }
    },
    ["promociones-activas-for-tenant"],
    { tags: ["promociones", `promociones:${organizationId}`], revalidate: 60 }
  )(organizationId);
}
