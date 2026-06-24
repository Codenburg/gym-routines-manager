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
 *   - `showSuccess(message, options?)` — green/positive feedback (saves).
 *     Defaults to `id: 'gym-save'` so rapid re-saves REPLACE the
 *     previous toast instead of stacking.
 *   - `showError(message, options?)` — red/destructive feedback (errors).
 *     NO default id — errors stack so the user can see each one.
 *   - `showInfo(message, options?)` — blue/neutral info. NO default id.
 *   - `showUndoableToast({ message, onUndo, durationMs, id?, onAutoDismiss? })` —
 *     a 5s toast with an "Deshacer" action button and a CSS-keyframe
 *     progress bar. Defaults to `id: 'gym-undo'`.
 *
 * Why no `'use client'` directive: every function here is a plain
 * `sonnerToast.success(...)` call wrapped in a Tailwind classNames
 * block. Sonner's Toaster is the only client boundary needed (it's
 * already a Client Component from the `sonner` package). Importing
 * this module from a Server Component is fine because the functions
 * are only called from event handlers (which are client-side).
 */

import type { CSSProperties } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * Tailwind class tokens applied to every toast card.
 *
 * Sonner 2.0.7 uses `[data-sonner-toast]` and `[data-sonner-toaster]`
 * data attributes (NOT classes) for its selectors, AND with
 * `unstyled: true` the LI only carries the baseline
 * `[data-sonner-toast]` styles (absolute positioning, opacity
 * transition, `overflow-wrap: anywhere`, etc.) — sonner does NOT apply
 * padding/border/radius/width/layout because those are gated on
 * `[data-styled=true]` which `unstyled` opts out of. Variant colors
 * from richColors ARE still applied via the
 * `[data-rich-colors=true][data-sonner-toast][data-type=success]`
 * selector (3 attribute selectors → specificity 0,3,0), so we use
 * `!` (Tailwind's `!important` prefix) on our bg/text/border classes
 * (specificity 0,1,0 → 0,1,0 with `!important` which beats anything
 * without `!important`).
 *
 * The classNames split mirrors sonner's element tree:
 *   toast (the card <li>) ── title ── description ── actionButton
 *      └── icon
 *
 * Layout / typography targets the sonner styled default:
 *   - `w-[356px]` fixed width (sonner default)
 *   - `min-h-[64px]` minimum height (icon + padding)
 *   - `p-4` 16px padding (sonner default)
 *   - `flex items-start gap-3` row layout (icon / content / action)
 *   - `rounded-lg` 8px border-radius (matches `--radius-md` = 0.5rem)
 *   - `border border-border` 1px subtle border
 *   - `shadow-lg` Tailwind's lg shadow stack
 *   - `relative` so the absolute-positioned `.toast-with-undo::before`
 *     pseudo-element (the progress bar, Fix 2 of the 2nd polish pass)
 *     anchors to the card's bottom edge
 *
 * The previous wrapper used `group-[.toaster]:flex ...` prefix on
 * every class — that selector is WRONG because sonner 2.0.7 doesn't
 * put `.toaster` as a class on the OL (only `data-sonner-toaster`),
 * so the selector matched nothing and the toast came out as a
 * square, borderless, unstyled card with sonner's rich colors on top.
 */
const TOAST_CLASSES = {
  // Base card — layout + neutral colors. Variant classNames layer
  // on top via the per-variant keys below.
  base: [
    // Group for nested selectors (sonner uses :hover .group)
    "group",
    // Position — needs `relative` so the absolute-positioned
    // `.toast-with-undo::before` progress bar (Fix 2 in the 2nd
    // polish pass) anchors to the card's bottom edge. Also needed
    // for the sonner close button (top-right, when enabled).
    "relative",
    // Layout — flex row, icon / content / action, vertical-aligned to top
    "flex items-start gap-3",
    // Spacing — sonner default 16px padding, 356px width, 64px min-height
    "p-4 w-[356px] min-h-[64px]",
    // Visual — 8px radius, 1px border, lg shadow
    "rounded-lg border shadow-lg",
    // Neutral colors (overridden by variant classes below)
    "!bg-background !text-foreground !border-border",
  ].join(" "),
  // Title — the main message
  title: "text-sm font-semibold",
  // Description — secondary text or progress bar slot. `opacity-80`
  // matches sonner's default `[data-styled=true] [data-description]`
  // treatment (slightly faded relative to title).
  description: "text-sm opacity-80 mt-1",
  // Action button — the "Deshacer" button. Pushed right with
  // `ml-auto`, vertically centered with `self-center`.
  actionButton:
    "text-sm font-medium hover:underline ml-auto self-center",
  // Icon — variant-colored (inherits the card text color, which
  // for variants is white/light).
  icon: "size-5",
  // Variant: success (richColors) — vibrant green bg, white text
  success:
    "!bg-success !text-success-foreground !border-success/20",
  // Variant: error / destructive (richColors) — vibrant red bg, white text
  error:
    "!bg-destructive !text-destructive-foreground !border-destructive/20",
  // Variant: info (richColors) — vibrant blue bg, white text
  info:
    "!bg-info !text-info-foreground !border-info/20",
} as const;

/**
 * Per-slot classNames map shared by every wrapper. Bundles all
 * elements (toast / title / description / actionButton / icon).
 * The toast slot is overridden by each wrapper to layer on the
 * variant classNames.
 */
const BASE_CLASSNAMES = {
  title: TOAST_CLASSES.title,
  description: TOAST_CLASSES.description,
  actionButton: TOAST_CLASSES.actionButton,
  icon: TOAST_CLASSES.icon,
} as const;

/**
 * Per-call options accepted by the simple wrappers (showSuccess /
 * showError / showInfo). Only the `id` field is exposed because that's
 * the only knob callers need for toast deduplication.
 */
export type ToastOptions = {
  /**
   * Sonner uses `id` as the unique key for each toast — if a toast
   * with the same id is already visible, it's atomically replaced
   * instead of stacking. Default per wrapper is documented on each
   * export; pass an explicit `id` to override (e.g. a field-specific
   * save id if the user wants different save toasts per field).
   */
  id?: string;
};

/**
 * Show a success toast (green). Returns the toast id for external
 * dismissal.
 *
 * Default `id: 'gym-save'` so rapid re-saves (e.g. the user clicks
 * Guardar on two fields within 5s) REPLACE the previous success
 * toast instead of stacking — the user only needs to dismiss one.
 */
export function showSuccess(message: string, options?: ToastOptions): string | number {
  return sonnerToast.success(message, {
    unstyled: true,
    id: options?.id ?? "gym-save",
    classNames: {
      ...BASE_CLASSNAMES,
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.success}`,
    },
  });
}

/**
 * Show an error toast (red/destructive). Default `id: 'gym-error'`
 * so rapid errors (e.g. two failed clicks in a row) REPLACE the
 * previous error toast instead of stacking — the user only sees
 * the latest failure.
 */
export function showError(message: string, options?: ToastOptions): string | number {
  return sonnerToast.error(message, {
    unstyled: true,
    id: options?.id ?? "gym-error",
    classNames: {
      ...BASE_CLASSNAMES,
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.error}`,
    },
  });
}

/**
 * Show an info toast (blue/neutral). No default id — info messages
 * stack intentionally so each one is visible.
 */
export function showInfo(message: string, options?: ToastOptions): string | number {
  return sonnerToast.info(message, {
    unstyled: true,
    id: options?.id,
    classNames: {
      ...BASE_CLASSNAMES,
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.info}`,
    },
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
   * Sonner toast id. Default: `'gym-undo'`. Pass an explicit id to
   * override (e.g. field-specific undo id if multiple undo toasts
   * need to coexist — currently they all share `'gym-undo'` which
   * means clicking Vaciar on two fields in 5s replaces the first
   * undo toast with the second, which is the desired behavior).
   */
  id?: string;
  /**
   * Invoked when the toast auto-dismisses WITHOUT the user clicking
   * "Deshacer" — i.e. on `durationMs` expiry OR on manual close. On
   * undo, this is NOT called (the `wasUndone` flag guards it).
   *
   * Kept as a no-op-friendly optional field for backward compatibility
   * with the previous design (D3 — delayed `router.refresh()` from
   * the undo toast). The clear-gym-fields flow no longer needs it
   * because `router.refresh()` fires IMMEDIATELY on server success
   * (Fix 3 in the 2nd polish pass) instead of after the undo window.
   * Any future caller that wants the delayed semantics can still
   * pass it.
   */
  onAutoDismiss?: () => void;
};

/**
 * Render an undoable toast with a 5s CSS-keyframe progress bar.
 *
 * Implementation notes (design #289 §D13 + 2nd polish pass):
 *   - `unstyled: true` matches the Toaster-level config — this wrapper
 *     owns the styling.
 *   - **Progress bar approach (Fix 2, 2nd polish pass)**: instead of
 *     placing a `.undo-progress-bar` `<div>` inside the `description`
 *     slot (which caused bottom-corner overflow because `description`
 *     is NOT a direct child of the card `<li>` in sonner 2.0.7's DOM
 *     — it's nested inside `<div data-content>`), we now apply a
 *     `.toast-with-undo` class to the card itself. That class
 *     installs a `::before` pseudo-element (a direct CSS child of
 *     the card, inheriting its `border-bottom-*-radius`) that draws
 *     the bar and animates `clip-path` from `inset(0 100% 0 0)` to
 *     `inset(0 0 0 0)` — left-to-right fill that respects the card's
 *     border-radius automatically. Verified in node_modules/sonner
 *     DOM structure (`dist/index.js` ~line 798-806).
 *   - `style: { "--undo-duration": `${durationMs}ms` }` carries the
 *     animation duration as an inline CSS variable so the
 *     `@keyframes undoBar` references it.
 *   - `data-testid="undo-toast"` replaces the previous
 *     `data-testid="undo-toast-progress"` (which was on the now-gone
 *     `<div>` description-slot child). The pseudo-element isn't
 *     queryable; the testid is on the card itself.
 *   - Sonner 2.0.7 splits dismissal callbacks by path:
 *       - `onAutoClose`: fires on `duration` timer expiry.
 *       - `onDismiss`: fires ONLY on programmatic `dismiss(id)` /
 *         close-button / swipe-out (NOT on auto-close).
 *     We use BOTH, gated by the `wasUndone` flag set inside
 *     `action.onClick`. The flag flips BEFORE `sonnerToast.dismiss(id)`
 *     so by the time `onDismiss` runs for the undo path, the guard
 *     skips `onAutoDismiss`.
 *   - DEVNOTE: in earlier sonner versions, `onDismiss` covered all
 *     paths, but 2.0.x narrowed its scope. The dual-callback pattern
 *     is the documented migration for this version.
 *
 * Returns the toast id so callers can dismiss externally (e.g. on
 * navigation away).
 */
export function showUndoableToast({
  message,
  onUndo,
  durationMs = 5000,
  id = "gym-undo",
  onAutoDismiss,
}: UndoableToastOptions): string | number {
  // Closure-scoped flag. Survives across the synchronous
  // dismiss → onDismiss sequence inside the same task.
  let wasUndone = false;

  // Inline CSS variable on the toast card carries the animation
  // duration. `CSSProperties` cast is required because TS doesn't
  // know about custom properties as keys.
  const style: CSSProperties = {
    "--undo-duration": `${durationMs}ms`,
  } as CSSProperties;

  const toastId = sonnerToast.success(message, {
    unstyled: true,
    duration: durationMs,
    id,
    style,
    classNames: {
      ...BASE_CLASSNAMES,
      // `.toast-with-undo` installs the progress-bar pseudo-element
      // and its `clip-path` keyframe (see globals.css).
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.success} toast-with-undo`,
    },
    action: {
      label: "Deshacer",
      onClick: () => {
        wasUndone = true;
        sonnerToast.dismiss(toastId);
        void onUndo();
      },
    },
    onAutoClose: () => {
      // 5s timer expiry path. wasUndone guard is defensive — the
      // auto-close timer should never fire if the user already
      // undid, but cancel any pending refresh just in case.
      if (!wasUndone) {
        onAutoDismiss?.();
      }
    },
    onDismiss: () => {
      // Programmatic dismiss / close button / swipe-out. Covers the
      // manual close-button path (semantically: "commit the change").
      if (!wasUndone) {
        onAutoDismiss?.();
      }
    },
  });

  return toastId;
}