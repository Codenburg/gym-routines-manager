/**
 * Unit tests for the `clearGymDisplayField` server action.
 *
 * Strict TDD — Phase A RED. These tests are written BEFORE the
 * implementation. Each test references production code that does NOT
 * exist yet (`clearGymDisplayField` is exported from
 * `src/app/actions/gym.ts`), so the test file fails to load until T-002
 * (GREEN) implements the action.
 *
 * Contract (from design #289 §5 + tasks #290 T-002):
 *   - ADMIN-only via `verifyAdmin(headers)` — same pattern as
 *     `updateGymField` (lines 245-247).
 *   - 4-element literal union field: 'direccion' | 'mapsEmbedUrl'
 *     | 'socialInstagram' | 'socialWhatsapp'.
 *   - On success: writes `null` via `prisma.gym.update` +
 *     `revalidateTag('gym-config', 'max')` + 3 `revalidatePath` calls.
 *   - Returns `{ success: true }` on success or
 *     `{ success: false, message: string }` on auth / validation / DB error.
 *
 * Test inventory (8 tests):
 *   1-4. ADMIN + each of the 4 fields → prisma write + revalidates.
 *   5.   Invalid field discriminant → no prisma call + failure message.
 *   6.   Non-ADMIN session → no prisma call + failure.
 *   7.   Prisma throws → failure message.
 *   8.   On success → revalidateTag + 3 revalidatePath calls fire.
 *
 * Mocking strategy: mirrors `tests/feriados-null-guard.test.ts` —
 * `vi.mock(...)` for `next/headers`, `next/cache`, `@/lib/auth`,
 * `@/lib/prisma`. The mocks are declared BEFORE the import of the
 * action module (Vitest hoists `vi.mock` calls).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Mocks — declared BEFORE importing the action module
// ============================================================

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockUpdateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  updateTag: (...args: unknown[]) => mockUpdateTag(...args),
}));

const mockGetSession = vi.fn();
const mockIsAdmin = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}));

const mockGymUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  default: {
    gym: {
      update: (...args: unknown[]) => mockGymUpdate(...args),
    },
  },
}));

// ============================================================
// Import AFTER mocks are registered
// ============================================================

// `clearGymDisplayField` does not exist yet — this import WILL fail
// at module-load time during T-001 (RED). T-002 (GREEN) implements it.
import { clearGymDisplayField } from "@/app/actions/gym";

// ============================================================
// Tests
// ============================================================

describe("clearGymDisplayField — ADMIN + valid field", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      session: { activeOrganizationId: "gym" },
      user: { id: "admin-1" },
    });
    mockIsAdmin.mockResolvedValue(true);
    mockGymUpdate.mockResolvedValue({});
  });

  it("clears 'direccion' to null", async () => {
    const result = await clearGymDisplayField("direccion");

    expect(result.success).toBe(true);
    expect(mockGymUpdate).toHaveBeenCalledTimes(1);
    expect(mockGymUpdate).toHaveBeenCalledWith({
      where: { id: "gym" },
      data: { direccion: null },
    });
  });

  it("clears 'mapsEmbedUrl' to null", async () => {
    const result = await clearGymDisplayField("mapsEmbedUrl");

    expect(result.success).toBe(true);
    expect(mockGymUpdate).toHaveBeenCalledWith({
      where: { id: "gym" },
      data: { mapsEmbedUrl: null },
    });
  });

  it("clears 'socialInstagram' to null", async () => {
    const result = await clearGymDisplayField("socialInstagram");

    expect(result.success).toBe(true);
    expect(mockGymUpdate).toHaveBeenCalledWith({
      where: { id: "gym" },
      data: { socialInstagram: null },
    });
  });

  it("clears 'socialWhatsapp' to null", async () => {
    const result = await clearGymDisplayField("socialWhatsapp");

    expect(result.success).toBe(true);
    expect(mockGymUpdate).toHaveBeenCalledWith({
      where: { id: "gym" },
      data: { socialWhatsapp: null },
    });
  });
});

describe("clearGymDisplayField — auth + validation guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid field discriminant (no prisma call)", async () => {
    mockGetSession.mockResolvedValue({
      session: { activeOrganizationId: "gym" },
      user: { id: "admin-1" },
    });
    mockIsAdmin.mockResolvedValue(true);

    // Force-cast to satisfy TS — the runtime guard is what we're testing.
    const result = await clearGymDisplayField(
      "notARealField" as unknown as Parameters<typeof clearGymDisplayField>[0],
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("Campo no vaciable");
    }
    expect(mockGymUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-ADMIN session (no prisma call)", async () => {
    mockIsAdmin.mockResolvedValue(false);

    const result = await clearGymDisplayField("direccion");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("No tienes permisos de administrador");
    }
    expect(mockGymUpdate).not.toHaveBeenCalled();
  });
});

describe("clearGymDisplayField — error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      session: { activeOrganizationId: "gym" },
      user: { id: "admin-1" },
    });
    mockIsAdmin.mockResolvedValue(true);
  });

  it("returns failure when prisma throws", async () => {
    mockGymUpdate.mockRejectedValue(new Error("DB connection lost"));

    const result = await clearGymDisplayField("direccion");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("Error al eliminar el campo");
    }
    expect(mockGymUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("clearGymDisplayField — cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      session: { activeOrganizationId: "gym" },
      user: { id: "admin-1" },
    });
    mockIsAdmin.mockResolvedValue(true);
    mockGymUpdate.mockResolvedValue({});
  });

  it("fires updateTag('gym-config') on success (read-your-own-writes)", async () => {
    const result = await clearGymDisplayField("direccion");

    expect(result.success).toBe(true);
    expect(mockUpdateTag).toHaveBeenCalledWith("gym-config");
    expect(mockUpdateTag).toHaveBeenCalledWith("gym:gym:config");
    // Next.js 16 prefers updateTag over revalidateTag in Server Actions
    // for read-your-own-writes semantics: the next reader sees the
    // just-written null value immediately, regardless of the previous
    // cache lifetime. This pairs with the explicit router.refresh()
    // in handleClear (Fix 3 of the 2nd polish pass) which re-fetches
    // the RSC tree so the input visually clears in parallel with the
    // toast appearing.
    // Intentionally NOT calling revalidatePath from the server action:
    // Next.js 16 auto-revalidates the current route synchronously when
    // revalidatePath is called from a server action, which would
    // bypass the explicit router.refresh() in handleClear.
  });
});
