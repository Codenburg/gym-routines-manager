import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { DataResult, ok, err } from "@/lib/data-result";

/**
 * Creator user (from FK relation)
 * Only includes id and name - minimal payload
 */
export interface CreadorUser {
  id: string;
  name: string;
}

export interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  // Required FK to User.id
  creadorId: string;
  creadorUser: CreadorUser;
  diasCount: number;
  dias?: Dia[];
}

export interface Dia {
  id: string;
  musculosEnfocados: string[] | null;
  ejercicios: Ejercicio[];
}

export interface Ejercicio {
  id: string;
  nombre: string;
  series: number | null;
  repes: number | null;
}

export interface RutinaDetail {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  // Required FK to User.id
  creadorId: string;
  creadorUser: CreadorUser;
  createdAt: Date;
  updatedAt: Date;
  dias: DiaDetail[];
}

export interface DiaDetail {
  id: string;
  musculosEnfocados: string[] | null;
  orden: number;
  ejercicios: EjercicioDetail[];
}

export interface EjercicioDetail {
  id: string;
  nombre: string;
  series: number | null;
  repes: number | null;
  orden: number;
}

export interface Trainer {
  nombre: string;
  count: number;
}

/**
 * Extract trainers with their routine counts from ALL rutinas (unfiltered).
 * Uses creadorUser.name for reliable creator identification.
 */
function extractTrainers(rutinas: { creadorUser: CreadorUser | null }[]): Trainer[] {
  const trainerMap = new Map<string, number>();

  for (const rutina of rutinas) {
    if (rutina.creadorUser?.name) {
      const current = trainerMap.get(rutina.creadorUser.name) || 0;
      trainerMap.set(rutina.creadorUser.name, current + 1);
    }
  }

  return Array.from(trainerMap.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Result structure that separates filtered rutinas from stable trainer list.
 */
interface RutinasYTrainersResult {
  rutinas: Rutina[];
  trainers: Trainer[];
}

/**
 * Fetch simple list of rutinas for admin dashboard.
 * Does NOT include filtering logic - simple query for list view.
 */
async function fetchRutinasListFromDb(): Promise<Rutina[]> {
  const rutinas = await prisma.rutina.findMany({
    select: {
      id: true,
      nombre: true,
      tipo: true,
      descripcion: true,
      creadorId: true,
      creadorUser: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      dias: {
        select: {
          id: true,
          musculosEnfocados: true,
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

  return rutinas.map((rutina) => ({
    ...rutina,
    diasCount: rutina.dias.length,
  }));
}

/**
 * Get cached rutinas for admin dashboard.
 * This is the SINGLE source of truth for reading rutinas (admin view).
 */
export async function getRutinas() {
  return unstable_cache(
    () => fetchRutinasListFromDb(),
    ["rutinas"],
    {
      revalidate: 60,
      tags: [RUTINAS_CACHE_TAG],
    }
  )();
}

// Cache tag for manual revalidation
const RUTINAS_CACHE_TAG = "rutinas";

/**
 * Get filtered rutinas and trainers for homepage.
 * Derives exclusively from getRutinas() — no direct Prisma access.
 * Trainers are extracted from ALL rutinas so filter chips never disappear.
 */
export async function getFilteredRutinas(search?: string, trainers?: string) {
  const allRutinas = await getRutinas();

  // Extract trainers from ALL rutinas (unfiltered) — chips must always show all options
  const trainersData = extractTrainers(allRutinas);

  // Parse trainer filter
  let trainersList: string[] = [];
  if (trainers && trainers.trim().length > 0) {
    trainersList = trainers
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // Apply filters in memory
  const filteredRutinas = allRutinas.filter((rutina) => {
    // Search filter
    if (search && search.trim().length > 0) {
      const searchLower = search.trim().toLowerCase();
      if (!rutina.nombre.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Trainer filter
    if (trainersList.length > 0) {
      const rutinaTrainer = rutina.creadorUser?.name || "";
      if (!trainersList.some((t) => rutinaTrainer.toLowerCase().includes(t.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

  return {
    rutinas: filteredRutinas,
    trainers: trainersData,
  };
}

async function fetchRutinaById(id: string): Promise<RutinaDetail | null> {
  try {
    const rutina = await prisma.rutina.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        descripcion: true,
        creadorId: true,
        creadorUser: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        dias: {
          select: {
            id: true,
            musculosEnfocados: true,
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
    });

    if (!rutina) {
      return null;
    }

    return {
      id: rutina.id,
      nombre: rutina.nombre,
      tipo: rutina.tipo,
      descripcion: rutina.descripcion,
      creadorId: rutina.creadorId,
      creadorUser: rutina.creadorUser,
      createdAt: rutina.createdAt,
      updatedAt: rutina.updatedAt,
      dias: rutina.dias.map((dia) => ({
        id: dia.id,
        musculosEnfocados: dia.musculosEnfocados,
        orden: 0, // orden not selected from DB
        ejercicios: dia.ejercicios.map((ej) => ({
          id: ej.id,
          nombre: ej.nombre,
          series: ej.series,
          repes: ej.repes,
          orden: 0, // orden not selected
        })),
      })),
    };
  } catch (error) {
    console.error("[fetchRutinaById] DB query failed:", error);
    throw error;
  }
}

export async function getCachedRutinaById(id: string): Promise<RutinaDetail | null> {
  return unstable_cache(
    () => fetchRutinaById(id),
    ["rutina", id],
    {
      revalidate: 60,
      tags: [RUTINAS_CACHE_TAG],
    }
  )();
}

/**
 * Revalidate rutinas cache. Call this after creating/updating/deleting routines.
 */
export async function revalidateRutinasCache(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (revalidateTag as any)(RUTINAS_CACHE_TAG);
}

/**
 * Stats structure for dashboard
 */
export interface RutinasStats {
  rutinasCount: number;
  diasCount: number;
  ejerciciosCount: number;
}

/**
 * Get cached stats for admin dashboard.
 * Uses unstable_cache for automatic invalidation via revalidateTag("rutinas").
 */
async function fetchStatsFromDb(): Promise<RutinasStats> {
  const [rutinasCount, diasCount, ejerciciosCount] = await Promise.all([
    prisma.rutina.count(),
    prisma.dia.count(),
    prisma.ejercicio.count(),
  ]);

  return { rutinasCount, diasCount, ejerciciosCount };
}

export const getStats = unstable_cache(
  async () => fetchStatsFromDb(),
  ["rutinas-stats"],
  {
    revalidate: 60,
    tags: [RUTINAS_CACHE_TAG],
  }
);
