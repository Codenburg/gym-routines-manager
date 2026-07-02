import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

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
 * Always scopes by active organization and optionally filters by ownerId
 * (creadorId) for trainer-specific views.
 * Does NOT include filtering logic - simple query for list view.
 */
async function fetchRutinasListFromDb(organizationId?: string, ownerId?: string): Promise<Rutina[]> {
  if (!organizationId) {
    return [];
  }

  const where = ownerId ? { organizationId, creadorId: ownerId } : { organizationId };
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
 * @param organizationId - Active organization id. Missing org fails closed.
 * @param ownerId - Optional filter by creadorId (for trainer view).
 *                   ADMIN: omit ownerId to get all org rutinas.
 *                   TRAINER: provide session.user.id to get only their org rutinas.
 *
 * Migrated to Next.js 16 `use cache` + `cacheTag` + `cacheLife`.
 * `organizationId` and `ownerId` are part of the function signature so they
 * become part of the auto-generated cache key (different org/owner = different cache entry).
 */
// Migrated from `use cache` to `unstable_cache` — see openspec/changes/fix-use-cache-prisma-rsc-errors/.
export async function getRutinas(organizationId?: string, ownerId?: string) {
  return unstable_cache(
    async (orgId: string | undefined, oid: string | undefined) => fetchRutinasListFromDb(orgId, oid),
    ["rutinas-list"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )(organizationId, ownerId);
}

// Cache tag for manual revalidation
const RUTINAS_CACHE_TAG = "rutinas";

/**
 * Cached tenant-scoped public routine list.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @param ownerId - Optional owner filter.
 * @returns Routines owned by the tenant.
 */
export async function getRutinasForTenant(organizationId: string, ownerId?: string) {
  return unstable_cache(
    async (orgId: string, oid: string | undefined) => fetchRutinasListFromDb(orgId, oid),
    ["rutinas-list-for-tenant"],
    { tags: [RUTINAS_CACHE_TAG, `${RUTINAS_CACHE_TAG}:${organizationId}`], revalidate: 60 }
  )(organizationId, ownerId);
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
    throw error;
  }
}

async function fetchRutinaByIdForOrg(
  id: string,
  organizationId?: string,
  ownerId?: string
): Promise<RutinaDetail | null> {
  if (!organizationId) {
    return null;
  }

  const rutina = await prisma.rutina.findFirst({
    where: ownerId ? { id, organizationId, creadorId: ownerId } : { id, organizationId },
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
      orden: 0,
      ejercicios: dia.ejercicios.map((ej) => ({
        id: ej.id,
        nombre: ej.nombre,
        series: ej.series,
        repes: ej.repes,
        orden: 0,
      })),
    })),
  };
}

export async function getCachedRutinaById(id: string): Promise<RutinaDetail | null> {
  return unstable_cache(
    async (rutinaId: string) => fetchRutinaById(rutinaId),
    ["rutina-by-id"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )(id);
}

export async function getCachedRutinaByIdForOrg(
  id: string,
  organizationId?: string,
  ownerId?: string
): Promise<RutinaDetail | null> {
  return unstable_cache(
    async (rutinaId: string, orgId: string | undefined, oid: string | undefined) =>
      fetchRutinaByIdForOrg(rutinaId, orgId, oid),
    ["rutina-by-id-for-org"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )(id, organizationId, ownerId);
}

/**
 * Cached tenant-scoped public routine detail reader.
 *
 * @param id - Routine id from the canonical public route.
 * @param organizationId - Resolved public tenant organization id.
 * @returns The routine only when it belongs to the tenant; otherwise null.
 */
export async function getCachedRutinaByIdForTenant(
  id: string,
  organizationId: string
): Promise<RutinaDetail | null> {
  return unstable_cache(
    async (rutinaId: string, orgId: string) => fetchRutinaByIdForOrg(rutinaId, orgId),
    ["rutina-by-id-for-tenant"],
    { tags: [RUTINAS_CACHE_TAG, `${RUTINAS_CACHE_TAG}:${organizationId}`], revalidate: 60 }
  )(id, organizationId);
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
export async function getStats(organizationId: string, ownerId?: string): Promise<RutinasStats> {
  return unstable_cache(
    async (orgId: string, oid: string | undefined) => {
      const rutinaWhere = oid ? { organizationId: orgId, creadorId: oid } : { organizationId: orgId };

      const [rutinasCount, diasCount, ejerciciosCount] = await Promise.all([
        prisma.rutina.count({ where: rutinaWhere }),
        prisma.dia.count({ where: { rutina: rutinaWhere } }),
        prisma.ejercicio.count({ where: { dia: { rutina: rutinaWhere } } }),
      ]);

      return { rutinasCount, diasCount, ejerciciosCount };
    },
    ["rutinas-stats"],
    { tags: [RUTINAS_CACHE_TAG], revalidate: 60 }
  )(organizationId, ownerId);
}

/**
 * Cached tenant-scoped public routine stats.
 *
 * @param organizationId - Resolved public tenant organization id.
 * @param ownerId - Optional owner filter.
 * @returns Routine stats scoped to the tenant.
 */
export async function getStatsForTenant(
  organizationId: string,
  ownerId?: string
): Promise<RutinasStats> {
  return unstable_cache(
    async (orgId: string, oid: string | undefined) => {
      const rutinaWhere = oid ? { organizationId: orgId, creadorId: oid } : { organizationId: orgId };

      const [rutinasCount, diasCount, ejerciciosCount] = await Promise.all([
        prisma.rutina.count({ where: rutinaWhere }),
        prisma.dia.count({ where: { rutina: rutinaWhere } }),
        prisma.ejercicio.count({ where: { dia: { rutina: rutinaWhere } } }),
      ]);

      return { rutinasCount, diasCount, ejerciciosCount };
    },
    ["rutinas-stats-for-tenant"],
    { tags: [RUTINAS_CACHE_TAG, `${RUTINAS_CACHE_TAG}:${organizationId}`], revalidate: 60 }
  )(organizationId, ownerId);
}
