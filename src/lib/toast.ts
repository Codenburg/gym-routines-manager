/**
 * Centralized toast wrappers for the gymflow admin app.
 *
 * This module owns ALL toast styling for the app:
 *   - `Toaster` in `src/app/layout.tsx` is configured `unstyled={true}`
 *     so the wrappers re-render each card with Tailwind tokens (instead
 *     of sonner's default colors).
 *   - All 67 existing call sites across 16 files import from this
 *     module instead of `sonner` directly. This is the design #289
 *     §D12 decision — pure functions, no 'use client', no hooks.
 *
 * The module exports:
 *   - `showSuccess(message)` — green/positive feedback (saves).
 *   - `showError(message)` — red/destructive feedback (errors).
 *   - `showInfo(message)` — blue/neutral info.
 *   - `showUndoableToast({ message, onUndo, durationMs, onAutoDismiss })` —
 *     a 5s toast with an "Deshacer" action button and a CSS keyframe
 *     progress bar. Used by `clearGymDisplayField` in
 *     `src/components/admin/GymConfigManager.tsx`.
 *
 * Why no `'use client'` directive: every function here is a plain
 * `sonnerToast.success(...)` call wrapped in a Tailwind classNames
 * block. Sonner's Toaster is the only client boundary needed (it's
 * already a Client Component from the `sonner` package). Importing
 * this module from a Server Component is fine because the functions
 * are only called from event handlers (which are client-side).
 */

import { createElement } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * Tailwind class tokens applied to every toast card.
 *
 * The `group-[.toaster]:` prefix targets the parent `<ol>` element
 * sonner renders at the toast position — sonner's CSS is namespaced
 * under `.toaster` so this is the documented override pattern. The
 * `bg-*` / `text-*` / `border-*` tokens map to the design system's
 * `--color-success` / `--color-destructive` / `--color-info` CSS
 * variables defined in `src/app/globals.css` (already exposed as
 * Tailwind colors via the `@theme inline` block).
 */
const TOAST_CLASSES = {
  base: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
  success:
    "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success/20",
  error:
    "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive/20",
  info: "group-[.toaster]:bg-info group-[.toaster]:text-info-foreground group-[.toaster]:border-info/20",
} as const;

/**
 * Show a success toast (green). Returns the toast id for external
 * dismissal.
 */
export function showSuccess(message: string): string | number {
  return sonnerToast.success(message, {
    unstyled: true,
    classNames: { toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.success}` },
  });
}

/**
 * Show an error toast (red/destructive).
 */
export function showError(message: string): string | number {
  return sonnerToast.error(message, {
    unstyled: true,
    classNames: { toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.error}` },
  });
}

/**
 * Show an info toast (blue/neutral).
 */
export function showInfo(message: string): string | number {
  return sonnerToast.info(message, {
    unstyled: true,
    classNames: { toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.info}` },
  });
}

export type UndoableToastOptions = {
  /** Toast message (already localized, e.g. "Dirección eliminada"). */
  message: string;
  /**
   * Invoked when the user clicks the "Deshacer" action button BEFORE
   * the auto-dismiss fires. The caller is responsible for the restore
   * logic (e.g. re-firing `updateGymField` with the captured value).
   */
  onUndo: () => void | Promise<void>;
  /** Auto-dismiss window. Default: 5000ms. */
  durationMs?: number;
  /**
   * Invoked when the toast auto-dismisses WITHOUT the user clicking
   * "Deshacer" — i.e. on `durationMs` expiry OR on manual close. On
   * undo, this is NOT called (the `wasUndone` flag guards it).
   *
   * Used by `FieldSubForm.handleClear` to schedule a deferred
   * `router.refresh()` (D3) — the input stays visually populated
   * during the undo window and only re-renders empty after the
   * refresh lands.
   */
  onAutoDismiss?: () => void;
};

/**
 * Render an undoable toast with a 5s CSS-keyframe progress bar.
 *
 * Implementation notes (design #289 §D13):
 *   - `unstyled: true` matches the Toaster-level config — this wrapper
 *     owns the styling. We add `relative` so the absolute-positioned
 *     `.undo-progress-bar` child (in the `description` slot) anchors
 *     to the card.
 *   - `description` slot hosts a `<div className="undo-progress-bar">`
 *     with inline `style` setting the `--undo-duration` CSS variable.
 *     The keyframe `undoBar` (defined in `src/app/globals.css`) consumes
 *     that variable.
 *   - Sonner's `onDismiss` fires on EVERY dismiss path — auto-close,
 *     manual close, AND action.onClick. To distinguish "user clicked
 *     Deshacer" from "toast was closed normally", we flip a
 *     `wasUndone` flag inside `action.onClick` BEFORE calling
 *     `sonnerToast.dismiss(id)`. By the time `onDismiss` runs, the
 *     flag is set, and `onAutoDismiss` is skipped.
 *
 * Returns the toast id so callers can dismiss externally (e.g. on
 * navigation away).
 */
export function showUndoableToast({
  message,
  onUndo,
  durationMs = 5000,
  onAutoDismiss,
}: UndoableToastOptions): string | number {
  // Closure-scoped flag. Survives across the synchronous
  // dismiss → onDismiss sequence inside the same task.
  let wasUndone = false;

  const id = sonnerToast.success(message, {
    unstyled: true,
    duration: durationMs,
    classNames: {
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.success} relative`,
    },
    action: {
      label: "Deshacer",
      onClick: () => {
        wasUndone = true;
        sonnerToast.dismiss(id);
        void onUndo();
      },
    },
    description: createElement("div", {
      className: "undo-progress-bar",
      style: { ["--undo-duration" as string]: `${durationMs}ms` },
      "data-testid": "undo-toast-progress",
    }),
    onDismiss: () => {
      if (!wasUndone) {
        onAutoDismiss?.();
      }
    },
  });
  return id;
}