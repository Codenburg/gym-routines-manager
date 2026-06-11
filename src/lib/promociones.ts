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
 * Note: uses `unstable_cache` (Next 15.x). The migration path to
 * `use cache` + `cacheTag` + `cacheLife` is documented in the design
 * and will be applied when `cacheComponents: true` is enabled in
 * next.config.ts.
 */
export const getPromociones = unstable_cache(
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
);
