import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cached read of the Gym singleton's price field for server-side
 * consumers (admin dashboard, public pages).
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
export async function getGymPrice(): Promise<number | null> {
  "use cache";
  cacheTag("gym-config");
  cacheLife({ revalidate: 60 });

  try {
    const gym = await prisma.gym.findUnique({
      where: { id: "gym" },
      select: { price: true },
    });
    return gym ? Number(gym.price) : null;
  } catch (error) {
    console.error("[getGymPrice] Failed to fetch gym price:", error);
    return null;
  }
}
