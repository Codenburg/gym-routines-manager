import prisma from "@/lib/prisma";

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
    createdAt: Date;
    updatedAt: Date;
    creadorUser: {
      id: string;
      name: string;
    };
  }>;
  total: number;
  trainerCounts: TrainerCount[];
  error?: string;
}

/**
 * Get routines with pagination, total count, and trainer counts.
 * All three queries share the same WHERE filter for consistency.
 * Trainer counts include names resolved from User table.
 *
 * IMPORTANT: trainers param accepts trainer NAMES (not IDs) since that's what the URL stores.
 * The service resolves names to IDs internally for database queries.
 */
export async function getRoutinesPaginated(
  params: PaginationParams
): Promise<PaginationResult> {
  const { page, pageSize, search, trainers } = params;
  const skip = (page - 1) * pageSize;

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
  if (search && search.trim() !== "") {
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

  // Build WHERE clause for trainer counts - ONLY search filter (NO trainer filter)
  // This ensures all trainers show up in the filter UI regardless of selected trainers
  const whereForTrainerCounts: Record<string, unknown> = {};
  if (search && search.trim() !== "") {
    whereForTrainerCounts.nombre = {
      contains: search.trim(),
      mode: "insensitive",
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
          select: {
            dias: true,
          },
        },
        creadorUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: pageSize,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include diasCount
    const transformedData = data.map((rutina) => ({
      id: rutina.id,
      nombre: rutina.nombre,
      tipo: rutina.tipo,
      descripcion: rutina.descripcion,
      creadorId: rutina.creadorId,
      diasCount: rutina._count.dias,
      createdAt: rutina.createdAt,
      updatedAt: rutina.updatedAt,
      creadorUser: rutina.creadorUser,
    }));

    // Query 2: count with same where (no take/skip)
    const total = await prisma.rutina.count({ where });

    // Query 3: groupBy for trainer counts - uses whereForTrainerCounts (NO trainer filter)
    // This allows multi-select: all trainers show in UI regardless of active filter
    const trainerCountsRaw = await prisma.rutina.groupBy({
      by: ["creadorId"],
      where: whereForTrainerCounts,
      _count: {
        id: true,
      },
    });

    // Get unique trainer IDs from groupBy results
    const groupedTrainerIds = trainerCountsRaw.map((t) => t.creadorId);

    // Query 4: Fetch trainer names for all trainer IDs found
    const trainersMap = new Map<string, string>();
    if (groupedTrainerIds.length > 0) {
      const trainersData = await prisma.user.findMany({
        where: { id: { in: groupedTrainerIds } },
        select: { id: true, name: true },
      });
      trainersData.forEach((t) => trainersMap.set(t.id, t.name));
    }

    // Combine counts with names
    const trainerCounts: TrainerCount[] = trainerCountsRaw.map((t) => ({
      trainerId: t.creadorId,
      nombre: trainersMap.get(t.creadorId) || "Unknown",
      count: t._count.id,
    }));

    return {
      data: transformedData,
      total,
      trainerCounts,
    };
  } catch (error) {
    return {
      data: [],
      total: 0,
      trainerCounts: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
