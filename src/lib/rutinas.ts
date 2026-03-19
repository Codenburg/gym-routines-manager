import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { DataResult, ok, err } from "@/lib/data-result";

interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creador: string | null;
  diasCount: number;
  dias?: Dia[];
}

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  ejercicios: Ejercicio[];
}

interface Ejercicio {
  id: string;
  nombre: string;
  series: string | null;
  repes: string | null;
}

/**
 * Fetch rutinas from database with caching.
 * Uses unstable_cache to avoid multiple DB queries within revalidation period.
 * 
 * @param search - Optional filter by routine name
 * @param trainers - Optional filter by creators (comma-separated)
 * @returns DataResult with cached rutinas array
 */
async function fetchRutinasFromDb(
  search?: string,
  trainers?: string
): Promise<DataResult<Rutina[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      where.nombre = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    if (trainers && trainers.trim().length > 0) {
      const trainersList = trainers
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (trainersList.length > 0) {
        where.creador = {
          in: trainersList,
          mode: "insensitive",
        };
      }
    }

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

    return ok(
      rutinas.map((rutina) => ({
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
      }))
    );
  } catch (error) {
    console.error("[getCachedRutinas] DB query failed:", error);
    return err([]);
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
  revalidateTag(RUTINAS_CACHE_TAG, "dynamic");
}
