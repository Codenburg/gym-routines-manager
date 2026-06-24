/**
 * Unit tests for `showUndoableToast` from `src/lib/toast.ts`.
 *
 * Strict TDD — Phase B RED. These tests are written BEFORE the
 * implementation module exists. Each test references production code
 * (`showUndoableToast`) that is NOT yet exported, so the test file
 * fails to load until T-004 (GREEN) creates the module.
 *
 * Contract (from design #289 §5 + tasks #290 T-004):
 *   - Renders a sonner toast with `unstyled: true`, an "Deshacer"
 *     action button, and a `description` slot used for the progress
 *     bar element.
 *   - Default `duration` is 5000ms.
 *   - Clicking "Deshacer" calls `sonnerToast.dismiss(id)` AND
 *     `onUndo()`; `onAutoDismiss` is NOT called.
 *   - On auto-dismiss (5s expiry or manual close, NOT undo), the
 *     `onAutoDismiss` callback fires exactly once.
 *   - Returns the toast id (string | number) for external dismissal.
 *
 * 2nd polish pass additions (Fix 1 — toast deduplication):
 *   - `showSuccess` defaults to `id: 'gym-save'` so rapid re-saves
 *     REPLACE the previous toast instead of stacking.
 *   - `showError` and `showInfo` have NO default id (stack so each
 *     is visible).
 *   - Callers can override the id via the `options` arg.
 *
 * Mocking strategy: `vi.mock("sonner")` replaces the toast singleton
 * with `vi.fn()` stubs. The wrapper's `sonnerToast.dismiss(id)` call
 * inside `action.onClick` is what makes the `wasUndone` flag flip work
 * (per design D13) — this test captures the contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Mock sonner — declared BEFORE importing the wrapper
// ============================================================

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockInfo = vi.fn();
const mockDismiss = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockSuccess(...args),
    error: (...args: unknown[]) => mockError(...args),
    info: (...args: unknown[]) => mockInfo(...args),
    dismiss: (...args: unknown[]) => mockDismiss(...args),
  },
}));

// ============================================================
// Import AFTER mocks
// ============================================================

import {
  showSuccess,
  showError,
  showInfo,
  showUndoableToast,
} from "@/lib/toast";

// ============================================================
// Tests
// ============================================================

describe("showUndoableToast — API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation: returns a stable id.
    mockSuccess.mockReturnValue("toast-1");
    mockDismiss.mockReturnValue(undefined);
  });

  it("renders toast with unstyled:true + Deshacer action + 5000ms duration", () => {
    const onUndo = vi.fn();
    showUndoableToast({ message: "Dirección eliminada", onUndo });

    expect(mockSuccess).toHaveBeenCalledTimes(1);
    const [message, opts] = mockSuccess.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(message).toBe("Dirección eliminada");
    expect(opts.unstyled).toBe(true);
    expect(opts.duration).toBe(5000);

    // The action label is "Deshacer" (Spanish, matches the rest of the app)
    const action = opts.action as { label: string; onClick: () => void };
    expect(action.label).toBe("Deshacer");
    expect(typeof action.onClick).toBe("function");
  });

  it("returns the toast id (string | number) for external dismissal", () => {
    mockSuccess.mockReturnValue(42);
    const id = showUndoableToast({ message: "test", onUndo: vi.fn() });
    expect(id).toBe(42);
  });

  it("clicking 'Deshacer' dismisses the toast AND fires onUndo (NOT onAutoDismiss)", () => {
    const onUndo = vi.fn();
    const onAutoDismiss = vi.fn();

    showUndoableToast({
      message: "Instagram eliminado",
      onUndo,
      onAutoDismiss,
    });

    const opts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    const action = opts.action as { onClick: () => void };

    // Simulate user clicking Deshacer.
    action.onClick();

    expect(mockDismiss).toHaveBeenCalledWith("toast-1");
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onAutoDismiss).not.toHaveBeenCalled();
  });

  it("fires onAutoDismiss exactly once when the toast auto-closes (5s expiry)", () => {
    const onUndo = vi.fn();
    const onAutoDismiss = vi.fn();

    showUndoableToast({
      message: "Mapa eliminado",
      onUndo,
      onAutoDismiss,
    });

    const opts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    const onDismiss = opts.onDismiss as () => void;

    // Simulate sonner's auto-close path (5s timer expiry).
    onDismiss();

    expect(onAutoDismiss).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it("defaults the id to 'gym-undo' so undo toasts REPLACE each other", () => {
    // Fix 1 — 2nd polish pass. Two undo toasts triggered in quick
    // succession must share the same id so sonner replaces the
    // first with the second instead of stacking.
    showUndoableToast({ message: "first", onUndo: vi.fn() });
    showUndoableToast({ message: "second", onUndo: vi.fn() });

    const firstOpts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    const secondOpts = mockSuccess.mock.calls[1][1] as Record<string, unknown>;

    expect(firstOpts.id).toBe("gym-undo");
    expect(secondOpts.id).toBe("gym-undo");
  });

  it("allows overriding the undo toast id via the `id` option", () => {
    showUndoableToast({
      message: "test",
      onUndo: vi.fn(),
      id: "custom-undo-id",
    });

    const opts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    expect(opts.id).toBe("custom-undo-id");
  });
});

// ============================================================
// Fix 1 — showSuccess / showError / showInfo dedup behavior
// ============================================================

describe("showSuccess — toast deduplication (Fix 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSuccess.mockReturnValue("toast-1");
  });

  it("defaults the id to 'gym-save' so rapid re-saves REPLACE the previous toast", () => {
    // Trigger two saves in quick succession. Both must share the
    // same id ('gym-save') so sonner atomically replaces the first
    // toast with the second instead of stacking two toasts.
    showSuccess("first save");
    showSuccess("second save");

    expect(mockSuccess).toHaveBeenCalledTimes(2);
    const firstOpts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    const secondOpts = mockSuccess.mock.calls[1][1] as Record<string, unknown>;

    expect(firstOpts.id).toBe("gym-save");
    expect(secondOpts.id).toBe("gym-save");
  });

  it("allows overriding the id via the options arg", () => {
    showSuccess("save direccion", { id: "gym-save-direccion" });

    const opts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    expect(opts.id).toBe("gym-save-direccion");
  });

  it("applies the success variant classNames (bg-success) + unstyled", () => {
    showSuccess("test");

    const opts = mockSuccess.mock.calls[0][1] as Record<string, unknown>;
    expect(opts.unstyled).toBe(true);
    const toastClasses = (opts.classNames as Record<string, string>).toast;
    expect(toastClasses).toMatch(/bg-success/);
    expect(toastClasses).toMatch(/rounded-lg/);
  });
});

describe("showError defaults to id 'gym-error' (rapid errors replace); showInfo has no default id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError.mockReturnValue("err-1");
    mockInfo.mockReturnValue("info-1");
  });

  it("showError defaults to id 'gym-error' so rapid errors REPLACE instead of stack", () => {
    showError("first error");
    showError("second error");

    const firstOpts = mockError.mock.calls[0][1] as Record<string, unknown>;
    const secondOpts = mockError.mock.calls[1][1] as Record<string, unknown>;

    expect(firstOpts.id).toBe("gym-error");
    expect(secondOpts.id).toBe("gym-error");
  });

  it("showInfo does NOT default to an id (info messages stack)", () => {
    showInfo("first info");
    showInfo("second info");

    const firstOpts = mockInfo.mock.calls[0][1] as Record<string, unknown>;
    const secondOpts = mockInfo.mock.calls[1][1] as Record<string, unknown>;

    expect(firstOpts.id).toBeUndefined();
    expect(secondOpts.id).toBeUndefined();
  });

  it("showError / showInfo accept an explicit id via options (overrides the default)", () => {
    showError("err", { id: "custom-err" });
    showInfo("info", { id: "custom-info" });

    const errOpts = mockError.mock.calls[0][1] as Record<string, unknown>;
    const infoOpts = mockInfo.mock.calls[0][1] as Record<string, unknown>;

    expect(errOpts.id).toBe("custom-err");
    expect(infoOpts.id).toBe("custom-info");
  });
});
