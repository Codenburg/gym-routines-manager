import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";

const RUTINAS_CACHE_TAG = "rutinas";
export const PAGE_SIZE = 12;

/**
 * Pagination params for getRoutinesPaginated
 * Note: trainers is an array of trainer names (from URL)
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  trainers?: string[];
}

/**
 * Trainer count with ID and name - UI-friendly format
 */
export interface TrainerCount {
  trainerId: string;
  nombre: string;
  count: number;
}

/**
 * Result structure from paginated routine query
 */
export interface PaginationResult {
  data: Array<{
    id: string;
    nombre: string;
    tipo: string;
    descripcion: string | null;
    creadorId: string;
    diasCount: number;
    createdAt: string;
    updatedAt: string;
    creadorUser: {
      id: string;
      name: string;
    };
  }>;
  total: number;
  error?: string;
}

/**
 * Lightweight query for trainer counts only (used outside Suspense).
 * Cached with the same tag so invalidation stays in sync.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 * `search` is passed as a function argument (not a runtime API call),
 * so Next.js can derive a stable cache key from the args.
 */
export async function getTrainerCounts(search: string): Promise<TrainerCount[]> {
  "use cache";
  cacheTag(RUTINAS_CACHE_TAG);
  cacheLife({ revalidate: 30 });

  try {
    const where: Record<string, unknown> = {};
    if (search.trim()) {
      where.nombre = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const [trainerCountsRaw] = await Promise.all([
      prisma.rutina.groupBy({
        by: ["creadorId"],
        where,
        _count: { id: true },
      }),
    ]);

    const groupedTrainerIds = trainerCountsRaw.map((t) => t.creadorId);
    const trainersMap = new Map<string, string>();

    if (groupedTrainerIds.length > 0) {
      const trainersData = await prisma.user.findMany({
        where: { id: { in: groupedTrainerIds } },
        select: { id: true, name: true },
      });
      trainersData.forEach((t) => trainersMap.set(t.id, t.name));
    }

    return trainerCountsRaw.map((t) => ({
      trainerId: t.creadorId,
      nombre: trainersMap.get(t.creadorId) || "Unknown",
      count: t._count.id,
    }));
  } catch (error) {
    console.error("[getTrainerCounts] Failed to fetch:", error);
    return [];
  }
}

/**
 * Get routines with pagination, total count, and trainer counts.
 * All three queries share the same WHERE filter for consistency.
 * Trainer counts include names resolved from User table.
 *
 * IMPORTANT: trainers param accepts trainer NAMES (not IDs) since that's what the URL stores.
 * The service resolves names to IDs internally for database queries.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 * The full params object becomes the cache key automatically, so
 * different page/search/trainers combos produce different cache entries.
 * Invalidated automatically when any `revalidateTag("rutinas")` is called.
 */
export async function getRoutinesPaginated(
  params: PaginationParams
): Promise<PaginationResult> {
  "use cache";
  cacheTag(RUTINAS_CACHE_TAG);
  cacheLife({ revalidate: 30 });

  const { page, pageSize, search, trainers } = params;

  // Resolve trainer names to IDs if provided
  let trainerIds: string[] | undefined;
  if (trainers && trainers.length > 0) {
    const trainerUsers = await prisma.user.findMany({
      where: {
        name: {
          in: trainers,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    trainerIds = trainerUsers.map((u) => u.id);
  }

  // Build WHERE clause for data query (includes all filters)
  const where: Record<string, unknown> = {};

  // Search filter on nombre
  if (search?.trim()) {
    where.nombre = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  // Trainer filter on creadorId (the FK field) using resolved IDs
  if (trainerIds && trainerIds.length > 0) {
    where.creadorId = {
      in: trainerIds,
    };
  }

  try {
    // Query 1: findMany with pagination
    const data = await prisma.rutina.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        tipo: true,
        descripcion: true,
        creadorId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { dias: true },
        },
        creadorUser: {
          select: { id: true, name: true },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: "desc" },
    });

    // Transform data with ISO strings (cache-safe)
    const transformedData = data.map((rutina) => ({
      id: rutina.id,
      nombre: rutina.nombre,
      tipo: rutina.tipo,
      descripcion: rutina.descripcion,
      creadorId: rutina.creadorId,
      diasCount: rutina._count.dias,
      createdAt: rutina.createdAt.toISOString(),
      updatedAt: rutina.updatedAt.toISOString(),
      creadorUser: rutina.creadorUser,
    }));

    // Query 2: count with same where (no take/skip)
    const total = await prisma.rutina.count({ where });

    // Trainer counts are fetched separately via getTrainerCounts
    // (avoiding duplicated groupBy + user lookup)
    return { data: transformedData, total };
  } catch (error) {
    return {
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
