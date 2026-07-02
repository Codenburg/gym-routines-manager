import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cached tenant-scoped read of a gym price for server-side consumers.
 *
 * - 60s TTL safety net
 * - tagged "gym-config" so `revalidateTag("gym-config")` in
 *   `actions/gym.ts:updateGymField` (and `updateGymPrice`) purges the
 *   cache immediately on save.
 *
 * Returns `null` (not `0`) when the gym row is missing, so callers can
 * distinguish "unconfigured" from "free". The admin dashboard's
 * `GymPriceEditor` treats `null` as "no initial price".
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 */
async function readGymPrice(organizationId: string, cacheKey: string): Promise<number | null> {
  return unstable_cache(
    async (orgId: string) => {
      try {
        const gym = await prisma.gym.findUnique({
          where: { id: orgId },
          select: { price: true },
        });
        return gym ? Number(gym.price) : null;
      } catch (error) {
        console.error("[getGymPrice] Failed to fetch gym price:", error);
        return null;
      }
    },
    [cacheKey],
    { tags: ["gym-config", `gym:${organizationId}:config`], revalidate: 60 }
  )(organizationId);
}

// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getGymPrice(organizationId: string): Promise<number | null> {
  return readGymPrice(organizationId, "gym-price");
}

/**
 * Cached tenant-scoped read of a gym price.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @returns The tenant gym price, or null when unavailable.
 */
export async function getGymPriceForTenant(organizationId: string): Promise<number | null> {
  return readGymPrice(organizationId, "gym-price-for-tenant");
}
