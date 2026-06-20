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
 * Fetch simple list of rutinas for admin/trainer dashboard.
 * Optionally filters by ownerId (creadorId) for trainer-specific views.
 * Does NOT include filtering logic - simple query for list view.
 */
async function fetchRutinasListFromDb(ownerId?: string): Promise<Rutina[]> {
  const where = ownerId ? { creadorId: ownerId } : {};
  const rutinas = await prisma.rutina.findMany({
    where,
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
 * Get cached rutinas for admin/trainer dashboard.
 * This is the SINGLE source of truth for reading rutinas.
 *
 * @param ownerId - Optional filter by creadorId (for trainer view).
 *                   ADMIN: omit ownerId to get all rutinas.
 *                   TRAINER: provide session.user.id to get only their rutinas.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 * `ownerId` is part of the function signature so it becomes part of
 * the auto-generated cache key (different ownerId = different cache entry).
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getRutinas(ownerId?: string) {
  return unstable_cache(
    async (oid: string | undefined) => fetchRutinasListFromDb(oid),
    ["rutinas-list"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )(ownerId);
}

// Cache tag for manual revalidation
const RUTINAS_CACHE_TAG = "rutinas";

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
    throw error;
  }
}

export async function getCachedRutinaById(id: string): Promise<RutinaDetail | null> {
  return unstable_cache(
    async (rutinaId: string) => fetchRutinaById(rutinaId),
    ["rutina-by-id"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )(id);
}

/**
 * Revalidate rutinas cache. Call this after creating/updating/deleting routines.
 */
export async function revalidateRutinasCache(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(RUTINAS_CACHE_TAG, "max");
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
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 * Declared `cacheTag("rutinas")` so any rutina / dia / ejercicio mutation
 * that calls `revalidateTag("rutinas")` invalidates the stats too —
 * this is the reader that the v0.19.0 audit called out for its
 * dependency on a shared tag with the other rutinas readers.
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getStats(): Promise<RutinasStats> {
  return unstable_cache(
    async () => {
      const [rutinasCount, diasCount, ejerciciosCount] = await Promise.all([
        prisma.rutina.count(),
        prisma.dia.count(),
        prisma.ejercicio.count(),
      ]);

      return { rutinasCount, diasCount, ejerciciosCount };
    },
    ["rutinas-stats"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )();
}
