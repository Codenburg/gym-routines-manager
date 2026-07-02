import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPublicHref } from "@/lib/tenants/href";

const findUnique = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (callback: () => unknown) => callback,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    organization: {
      findUnique,
    },
  },
}));

describe("public tenant routing", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("builds canonical tenant hrefs", () => {
    expect(buildPublicHref("iron-gym")).toBe("/g/iron-gym");
    expect(buildPublicHref("iron-gym", "/feriados")).toBe("/g/iron-gym/feriados");
    expect(buildPublicHref("iron gym", "/rutinas/r1/")).toBe("/g/iron%20gym/rutinas/r1");
  });

  it("resolves a known public tenant by slug", async () => {
    const { resolvePublicTenant } = await import("@/lib/tenants/resolve");
    findUnique.mockResolvedValue({ id: "org_1", slug: "iron-gym" });

    await expect(resolvePublicTenant({ orgSlug: "Iron-Gym" })).resolves.toEqual({
      organizationId: "org_1",
      orgSlug: "iron-gym",
      source: "path",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: "iron-gym" },
      select: { id: true, slug: true },
    });
  });

  it("returns null for unknown slugs", async () => {
    const { resolvePublicTenant } = await import("@/lib/tenants/resolve");
    findUnique.mockResolvedValue(null);

    await expect(resolvePublicTenant({ orgSlug: "ghost" })).resolves.toBeNull();
  });
});
