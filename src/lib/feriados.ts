import { cacheTag, cacheLife } from "next/cache";
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
export async function getFeriados() {
  "use cache";
  cacheTag("feriados");
  cacheLife({ revalidate: 30 });

  try {
    return await prisma.feriado.findMany({
      orderBy: { fecha: "asc" },
    });
  } catch (error) {
    console.error("[getFeriados] Failed to fetch feriados:", error);
    return [];
  }
}
