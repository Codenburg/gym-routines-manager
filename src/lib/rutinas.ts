import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { DataResult, ok, err } from "@/lib/data-result";

export interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creador: string | null;
  diasCount: number;
  dias?: Dia[];
}

export interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  ejercicios: Ejercicio[];
}

export interface Ejercicio {
  id: string;
  nombre: string;
  series: string | null;
  repes: string | null;
}

export interface Trainer {
  nombre: string;
  count: number;
}

/**
 * Extract trainers with their routine counts from ALL rutinas (unfiltered).
 * This is the source of truth for the trainer sidebar chips.
 */
function extractTrainers(rutinas: Pick<Rutina, "creador">[]): Trainer[] {
  const trainerMap = new Map<string, number>();

  for (const rutina of rutinas) {
    if (rutina.creador) {
      trainerMap.set(rutina.creador, (trainerMap.get(rutina.creador) || 0) + 1);
    }
  }

  return Array.from(trainerMap.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Result structure that separates filtered rutinas from stable trainer list.
 * - rutinas: filtered routines based on search/trainers params
 * - trainers: ALL trainers derived from unfiltered data (stable source for chips)
 * - error: indicates if there was a database error
 */
interface RutinasYTrainersResult {
  rutinas: Rutina[];
  trainers: Trainer[];
  error: boolean;
}

/**
 * Fetch rutinas from database with caching.
 * Uses unstable_cache to avoid repeated DB queries within revalidation period.
 * 
 * IMPORTANT: Trainer list is always derived from ALL rutinas (unfiltered),
 * while filtered rutinas are used for display. This ensures chips never disappear.
 * 
 * @param search - Optional filter by routine name
 * @param trainers - Optional filter by creators (comma-separated)
 * @returns RutinasYTrainersResult with filtered rutinas and stable trainer list
 */
async function fetchRutinasFromDb(
  search?: string,
  trainers?: string
): Promise<RutinasYTrainersResult> {
  try {
    // Build WHERE clause for rutinas (filters apply here)
    const where: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      where.nombre = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Parse trainer filter (used in where clause for rutinas only)
    let trainersList: string[] = [];
    if (trainers && trainers.trim().length > 0) {
      trainersList = trainers
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    // CRITICAL: First query for ALL trainers (unfiltered) - this is the stable source
    // We need this BEFORE applying trainer filter so chips never disappear
    const allRutinasForTrainers = await prisma.rutina.findMany({
      select: { creador: true },
    });
    const trainersData = extractTrainers(allRutinasForTrainers);

    // Apply trainer filter to WHERE clause for rutinas query
    if (trainersList.length > 0) {
      where.creador = {
        in: trainersList,
        mode: "insensitive",
      };
    }

    // Second query: fetch filtered rutinas with dias and ejercicios
    const rutinas = await prisma.rutina.findMany({
      where,
      include: {
        dias: {
          include: {
            ejercicios: {
              select: {
                id: true,
                nombre: true,
                series: true,
                repes: true,
              },
              orderBy: { orden: "asc" },
            },
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      rutinas: rutinas.map((rutina) => ({
        id: rutina.id,
        nombre: rutina.nombre,
        tipo: rutina.tipo,
        descripcion: rutina.descripcion,
        creador: rutina.creador,
        diasCount: rutina.dias.length,
        dias: rutina.dias.map((dia) => ({
          id: dia.id,
          nombre: dia.nombre,
          musculosEnfocados: dia.musculosEnfocados,
          ejercicios: dia.ejercicios,
        })),
      })),
      trainers: trainersData,
      error: false,
    };
  } catch (error) {
    console.error("[getCachedRutinas] DB query failed:", error);
    return {
      rutinas: [],
      trainers: [],
      error: true,
    };
  }
}

// Cache tag for manual revalidation
const RUTINAS_CACHE_TAG = "rutinas";

/**
 * Get cached rutinas with optional filters.
 * Results are cached for 60 seconds to avoid repeated DB queries.
 * 
 * @param search - Optional filter by routine name (case-insensitive)
 * @param trainers - Optional filter by creators (comma-separated)
 */
export const getCachedRutinas = unstable_cache(
  fetchRutinasFromDb,
  ["rutinas"], // cache key parts
  {
    revalidate: 60, // seconds
    tags: [RUTINAS_CACHE_TAG],
  }
);

/**
 * Revalidate rutinas cache. Call this after creating/updating/deleting routines.
 */
export async function revalidateRutinasCache(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(RUTINAS_CACHE_TAG, "max");
}
