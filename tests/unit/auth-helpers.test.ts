/**
 * Unit tests for the multi-tenant role helpers in src/lib/auth.ts.
 *
 * This is a SAFETY NET for the critical authorization layer — it directly
 * exercises resolveMemberRole / isAdmin / isTrainer / hasRole /
 * getActiveMemberRole against mocked (session + Member) data and verifies
 * the fail-closed behavior in every edge case:
 *
 *   - session with activeOrganizationId set + admin/trainer member exists → role returned
 *   - session with activeOrganizationId set + member/unsupported role → null
 *   - session with activeOrganizationId set + member DOES NOT exist
 *     (org deleted, user removed from org) → null (fail-closed)
 *   - session WITHOUT activeOrganizationId (super-admin Tomás) → null
 *   - Prisma throws → null (no exception propagated)
 *   - getSession throws → null (no exception propagated)
 *   - no session cookie → null
 *
 * HISTORY: This test file was created because the activeOrganizationId
 * bug was caught at integration-test time (curl login + admin page test),
 * not at unit-test time — there were no unit tests for the helpers
 * themselves. This file ensures the same class of bug is caught earlier
 * next time.
 *
 * Mocking pattern: we mock `@/lib/prisma` to intercept the prisma.member
 * lookup that resolveMemberRole performs, and use `vi.spyOn(auth.api,
 * 'getSession')` to control the session state per-test. The helpers in
 * `@/lib/auth` are imported AS-IS so we test the real implementation
 * (not a reimplementation).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Mocks — declared BEFORE importing the auth module
// ============================================================

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Prisma mock — vi.hoisted so the const can be referenced inside the
// hoisted vi.mock factory below.
const { mockMemberFindUnique } = vi.hoisted(() => ({
  mockMemberFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    member: {
      findUnique: (...args: unknown[]) => mockMemberFindUnique(...args),
    },
  },
}));

// ============================================================
// Import AFTER mocks are registered
// ============================================================

import { auth } from "@/lib/auth";
import {
  isAdmin,
  isTrainer,
  isAdminOrTrainer,
  hasRole,
  getActiveMemberRole,
} from "@/lib/auth";

const HDR = new Headers();

// Spy on auth.api.getSession — this is the only way to control session
// state while still testing the REAL resolveMemberRole implementation
// (which uses `auth.api.getSession` internally).
function setSession(
  result: ReturnType<typeof auth.api.getSession> extends Promise<infer T>
    ? T
    : never
) {
  return vi.spyOn(auth.api, "getSession").mockResolvedValue(result as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth helpers — no session", () => {
  beforeEach(() => {
    setSession(null as any);
  });

  it("isAdmin returns false when no session", async () => {
    expect(await isAdmin(HDR)).toBe(false);
  });

  it("isTrainer returns false when no session", async () => {
    expect(await isTrainer(HDR)).toBe(false);
  });

  it("isAdminOrTrainer returns false when no session", async () => {
    expect(await isAdminOrTrainer(HDR)).toBe(false);
  });

  it("hasRole returns false when no session", async () => {
    expect(await hasRole(HDR, "admin")).toBe(false);
    expect(await hasRole(HDR, "trainer")).toBe(false);
  });

  it("getActiveMemberRole returns null when no session", async () => {
    expect(await getActiveMemberRole(HDR)).toBeNull();
  });

  it("does NOT call prisma.member.findUnique when no session", async () => {
    await isAdmin(HDR);
    expect(mockMemberFindUnique).not.toHaveBeenCalled();
  });
});

describe("auth helpers — session without activeOrganizationId (super-admin Tomás)", () => {
  beforeEach(() => {
    setSession({
      session: { activeOrganizationId: null },
      user: { id: "tomas-id" },
    } as any);
  });

  it("isAdmin returns false (fail-closed)", async () => {
    expect(await isAdmin(HDR)).toBe(false);
  });

  it("isTrainer returns false (fail-closed)", async () => {
    expect(await isTrainer(HDR)).toBe(false);
  });

  it("isAdminOrTrainer returns false (fail-closed — gates admin panel)", async () => {
    // Tomás super-admin must be blocked from admin panel routes even though
    // he has a valid session, because he has no Member entry in any org.
    expect(await isAdminOrTrainer(HDR)).toBe(false);
  });

  it("getActiveMemberRole returns null (fail-closed)", async () => {
    expect(await getActiveMemberRole(HDR)).toBeNull();
  });

  it("does NOT call prisma.member.findUnique (no active org to query)", async () => {
    await isAdminOrTrainer(HDR);
    expect(mockMemberFindUnique).not.toHaveBeenCalled();
  });
});

describe("auth helpers — session with activeOrganizationId + member exists", () => {
  beforeEach(() => {
    setSession({
      session: { activeOrganizationId: "gym" },
      user: { id: "nando-id" },
    } as any);
  });

  it("returns 'admin' for Nando (Member.role = admin)", async () => {
    mockMemberFindUnique.mockResolvedValue({ role: "admin" });
    expect(await getActiveMemberRole(HDR)).toBe("admin");
    expect(await isAdmin(HDR)).toBe(true);
    expect(await isTrainer(HDR)).toBe(false);
    expect(await isAdminOrTrainer(HDR)).toBe(true);
    expect(await hasRole(HDR, "admin")).toBe(true);
    expect(await hasRole(HDR, "trainer")).toBe(false);
  });

  it("returns 'trainer' for Leo (Member.role = trainer)", async () => {
    mockMemberFindUnique.mockResolvedValue({ role: "trainer" });
    expect(await getActiveMemberRole(HDR)).toBe("trainer");
    expect(await isAdmin(HDR)).toBe(false);
    expect(await isTrainer(HDR)).toBe(true);
    expect(await isAdminOrTrainer(HDR)).toBe(true);
    expect(await hasRole(HDR, "trainer")).toBe(true);
    expect(await hasRole(HDR, "admin")).toBe(false);
  });

  it("queries prisma.member.findUnique with the right composite key", async () => {
    mockMemberFindUnique.mockResolvedValue({ role: "admin" });
    await isAdmin(HDR);
    expect(mockMemberFindUnique).toHaveBeenCalledWith({
      where: {
        userId_organizationId: {
          userId: "nando-id",
          organizationId: "gym",
        },
      },
      select: { role: true },
    });
  });
});

describe("auth helpers — session with activeOrganizationId + member has no product role", () => {
  beforeEach(() => {
    setSession({
      session: { activeOrganizationId: "gym" },
      user: { id: "viewer-id" },
    } as any);
  });

  it("fails closed for legacy Member.role = member", async () => {
    mockMemberFindUnique.mockResolvedValue({ role: "member" });

    expect(await getActiveMemberRole(HDR)).toBeNull();
    expect(await isAdmin(HDR)).toBe(false);
    expect(await isTrainer(HDR)).toBe(false);
    expect(await isAdminOrTrainer(HDR)).toBe(false);
    expect(await hasRole(HDR, "member")).toBe(false);
  });

  it("fails closed for unsupported Member.role values", async () => {
    mockMemberFindUnique.mockResolvedValue({ role: "owner" });

    expect(await getActiveMemberRole(HDR)).toBeNull();
    expect(await isAdminOrTrainer(HDR)).toBe(false);
    expect(await hasRole(HDR, "owner")).toBe(false);
  });
});

describe("auth helpers — session with activeOrganizationId but member DOES NOT exist (race / org deleted / user removed)", () => {
  beforeEach(() => {
    setSession({
      session: { activeOrganizationId: "deleted-org" },
      user: { id: "ghost-user-id" },
    } as any);
    mockMemberFindUnique.mockResolvedValue(null);
  });

  it("getActiveMemberRole returns null (fail-closed)", async () => {
    expect(await getActiveMemberRole(HDR)).toBeNull();
  });

  it("isAdmin returns false (fail-closed)", async () => {
    expect(await isAdmin(HDR)).toBe(false);
  });

  it("isTrainer returns false (fail-closed)", async () => {
    expect(await isTrainer(HDR)).toBe(false);
  });

  it("isAdminOrTrainer returns false — gates admin panel even with valid-looking session", async () => {
    // The most dangerous case: session exists, session has
    // activeOrganizationId, but the user is no longer a member. Proxy.ts
    // and admin layout MUST NOT grant access here.
    expect(await isAdminOrTrainer(HDR)).toBe(false);
  });

  it("hasRole returns false for any role", async () => {
    expect(await hasRole(HDR, "admin")).toBe(false);
    expect(await hasRole(HDR, "trainer")).toBe(false);
    expect(await hasRole(HDR, "member")).toBe(false);
  });
});

describe("auth helpers — Prisma throws (DB outage, network error)", () => {
  beforeEach(() => {
    setSession({
      session: { activeOrganizationId: "gym" },
      user: { id: "nando-id" },
    } as any);
    mockMemberFindUnique.mockRejectedValue(new Error("DB connection lost"));
  });

  it("getActiveMemberRole returns null (does NOT propagate exception)", async () => {
    expect(await getActiveMemberRole(HDR)).toBeNull();
  });

  it("isAdmin returns false (does NOT propagate exception)", async () => {
    expect(await isAdmin(HDR)).toBe(false);
  });

  it("isTrainer returns false (does NOT propagate exception)", async () => {
    expect(await isTrainer(HDR)).toBe(false);
  });

  it("isAdminOrTrainer returns false — admin gate stays fail-closed on DB outage", async () => {
    expect(await isAdminOrTrainer(HDR)).toBe(false);
  });

  it("hasRole returns false (does NOT propagate exception)", async () => {
    expect(await hasRole(HDR, "admin")).toBe(false);
  });
});

describe("auth helpers — auth.api.getSession itself throws", () => {
  beforeEach(() => {
    vi.spyOn(auth.api, "getSession").mockRejectedValue(
      new Error("Invalid session token"),
    );
  });

  it("isAdmin returns false (does NOT propagate)", async () => {
    expect(await isAdmin(HDR)).toBe(false);
  });

  it("isAdminOrTrainer returns false (does NOT propagate)", async () => {
    expect(await isAdminOrTrainer(HDR)).toBe(false);
  });

  it("getActiveMemberRole returns null (does NOT propagate)", async () => {
    expect(await getActiveMemberRole(HDR)).toBeNull();
  });

  it("does NOT call prisma.member.findUnique when getSession throws", async () => {
    await isAdminOrTrainer(HDR);
    expect(mockMemberFindUnique).not.toHaveBeenCalled();
  });
});
