import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cached read of all Feriados for server-side consumers
 * (admin panel, public feriados page, public informacion page,
 * home-page "new feriado" notification badge).
 *
 * - **30s TTL** (NOT 60s) — the home page uses the latest feriado date
 *   to render a "new" badge for recently-added holidays. A 30s staleness
 *   window keeps the badge UX correct: a user who adds a feriado and
 *   returns to the home page within 30s will see it marked new; after
 *   30s the cache repopulates from DB. The 60s default used by sibling
 *   readers would be too coarse for this signal. See proposal § "Tech
 *   Debt Inventory" — the 30s TTL is INTENTIONAL and was preserved
 *   across the `unstable_cache` → `use cache` migration.
 *
 * - tagged "feriados". A companion commit (revalidateTag for feriados
 *   mutations) wires `actions/feriados.ts` mutations to call
 *   `revalidateTag("feriados")` alongside the existing `revalidatePath`
 *   calls, so saves purge the cache immediately.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getFeriados() {
  return unstable_cache(
    async () => {
      try {
        return await prisma.feriado.findMany({
          orderBy: { fecha: "asc" },
        });
      } catch (error) {
        console.error("[getFeriados] Failed to fetch feriados:", error);
        return [];
      }
    },
    ["feriados"],
    { tags: ["feriados"], revalidate: 30 }
  )();
}

/**
 * Cached tenant-scoped read of public feriados.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @returns Feriados owned by the tenant.
 */
export async function getFeriadosForTenant(organizationId: string) {
  return unstable_cache(
    async (orgId: string) => {
      try {
        return await prisma.feriado.findMany({
          where: { gymId: orgId },
          orderBy: { fecha: "asc" },
        });
      } catch (error) {
        console.error("[getFeriadosForTenant] Failed to fetch feriados:", error);
        return [];
      }
    },
    ["feriados-for-tenant"],
    { tags: ["feriados", `feriados:${organizationId}`], revalidate: 30 }
  )(organizationId);
}

/**
 * Cached tenant-scoped latest feriado creation date for notification badges.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @returns Latest tenant feriado creation date as ISO string, or null.
 */
export async function getLatestFeriadoDateForTenant(
  organizationId: string
): Promise<string | null> {
  return unstable_cache(
    async (orgId: string) => {
      try {
        const latest = await prisma.feriado.findFirst({
          where: { gymId: orgId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        return latest ? latest.createdAt.toISOString() : null;
      } catch (error) {
        console.error("[getLatestFeriadoDateForTenant] Failed to fetch latest feriado:", error);
        return null;
      }
    },
    ["latest-feriado-date-for-tenant"],
    { tags: ["feriados", `feriados:${organizationId}`], revalidate: 30 }
  )(organizationId);
}
