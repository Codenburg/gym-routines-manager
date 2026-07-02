import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, unstableCacheMock } = vi.hoisted(() => ({
  prismaMock: {
    gym: {
      findUnique: vi.fn(),
    },
    promocion: {
      findMany: vi.fn(),
    },
    descuentoDuracion: {
      findMany: vi.fn(),
    },
    feriado: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    rutina: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
  unstableCacheMock: vi.fn((callback: (...args: unknown[]) => unknown) => callback),
}));

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

describe("public tenant readers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads gym price from the resolved tenant gym id with tenant cache tags", async () => {
    const { getGymPrice, getGymPriceForTenant } = await import("@/lib/gym-price");
    prismaMock.gym.findUnique.mockResolvedValue({ price: 25000 });

    await expect(getGymPrice("org_1")).resolves.toBe(25000);
    await expect(getGymPriceForTenant("org_1")).resolves.toBe(25000);

    expect(prismaMock.gym.findUnique).toHaveBeenCalledWith({
      where: { id: "org_1" },
      select: { price: true },
    });
    expect(unstableCacheMock).toHaveBeenLastCalledWith(
      expect.any(Function),
      ["gym-price-for-tenant"],
      { tags: ["gym-config", "gym:org_1:config"], revalidate: 60 }
    );
  });

  it("uses only a neutral fallback for missing tenant gym names", async () => {
    const { resolveGymNameForTenant } = await import("@/lib/gym-display");

    expect(resolveGymNameForTenant(null)).toBe("Gimnasio");
    expect(resolveGymNameForTenant("   ")).toBe("Gimnasio");
    expect(resolveGymNameForTenant("Iron Gym")).toBe("Iron Gym");
  });

  it("filters public information readers by tenant gym id", async () => {
    const { getPromocionesActivasForTenant } = await import("@/lib/promociones");
    const { getDescuentos, getDescuentosForTenant } = await import("@/lib/descuentos");
    const { getFeriadosForTenant, getLatestFeriadoDateForTenant } = await import("@/lib/feriados");
    prismaMock.promocion.findMany.mockResolvedValue([]);
    prismaMock.descuentoDuracion.findMany.mockResolvedValue([]);
    prismaMock.feriado.findMany.mockResolvedValue([]);
    prismaMock.feriado.findFirst.mockResolvedValue({ createdAt: new Date("2026-06-30T12:00:00.000Z") });

    await getPromocionesActivasForTenant("org_1");
    await getDescuentos("org_1");
    await getDescuentosForTenant("org_1");
    await getFeriadosForTenant("org_1");
    await expect(getLatestFeriadoDateForTenant("org_1")).resolves.toBe("2026-06-30T12:00:00.000Z");

    expect(prismaMock.promocion.findMany).toHaveBeenCalledWith({
      where: { gymId: "org_1", activo: true },
      orderBy: { createdAt: "desc" },
    });
    expect(prismaMock.descuentoDuracion.findMany).toHaveBeenCalledWith({
      where: { gymId: "org_1" },
      orderBy: { meses: "asc" },
    });
    expect(prismaMock.feriado.findMany).toHaveBeenCalledWith({
      where: { gymId: "org_1" },
      orderBy: { fecha: "asc" },
    });
    expect(prismaMock.feriado.findFirst).toHaveBeenCalledWith({
      where: { gymId: "org_1" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
  });

  it("fails closed for cross-tenant routine detail ids", async () => {
    const { getCachedRutinaByIdForTenant } = await import("@/lib/rutinas");
    prismaMock.rutina.findFirst.mockResolvedValue(null);

    await expect(getCachedRutinaByIdForTenant("routine_1", "org_2")).resolves.toBeNull();

    expect(prismaMock.rutina.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "routine_1", organizationId: "org_2" },
      })
    );
  });

  it("filters paginated public routines and trainer counts by tenant organization id", async () => {
    const { getRoutinesPaginatedForTenant, getTrainerCountsForTenant } = await import(
      "@/services/routines/pagination"
    );
    prismaMock.rutina.findMany.mockResolvedValue([]);
    prismaMock.rutina.count.mockResolvedValue(0);
    prismaMock.rutina.groupBy.mockResolvedValue([]);

    await expect(
      getRoutinesPaginatedForTenant("org_1", {
        page: 1,
        pageSize: 12,
        search: "legs",
        trainers: [],
      })
    ).resolves.toEqual({ data: [], total: 0 });
    await expect(getTrainerCountsForTenant("org_1", "legs")).resolves.toEqual([]);

    expect(prismaMock.rutina.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org_1",
          nombre: { contains: "legs", mode: "insensitive" },
        },
      })
    );
    expect(prismaMock.rutina.count).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        nombre: { contains: "legs", mode: "insensitive" },
      },
    });
    expect(prismaMock.rutina.groupBy).toHaveBeenCalledWith({
      by: ["creadorId"],
      where: {
        organizationId: "org_1",
        nombre: { contains: "legs", mode: "insensitive" },
      },
      _count: { id: true },
    });
  });
});
