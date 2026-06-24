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
 *   - `relative` so the absolute-positioned `.undo-progress-bar`
 *     (in the description slot) anchors to the card edges
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
    // .undo-progress-bar (description slot) and the sonner close
    // button (top-right, when enabled) anchor to the card.
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
 * Show a success toast (green). Returns the toast id for external
 * dismissal.
 */
export function showSuccess(message: string): string | number {
  return sonnerToast.success(message, {
    unstyled: true,
    classNames: {
      ...BASE_CLASSNAMES,
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.success}`,
    },
  });
}

/**
 * Show an error toast (red/destructive).
 */
export function showError(message: string): string | number {
  return sonnerToast.error(message, {
    unstyled: true,
    classNames: {
      ...BASE_CLASSNAMES,
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.error}`,
    },
  });
}

/**
 * Show an info toast (blue/neutral).
 */
export function showInfo(message: string): string | number {
  return sonnerToast.info(message, {
    unstyled: true,
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
 *     owns the styling. `relative` is part of `TOAST_CLASSES.base` so
 *     the absolute-positioned `.undo-progress-bar` child (in the
 *     `description` slot) anchors to the card.
 *   - `description` slot hosts a `<div className="undo-progress-bar">`
 *     with inline `style` setting the `--undo-duration` CSS variable.
 *     The keyframe `undoBar` (defined in `src/app/globals.css`) consumes
 *     that variable.
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
  onAutoDismiss,
}: UndoableToastOptions): string | number {
  // Closure-scoped flag. Survives across the synchronous
  // dismiss → onDismiss sequence inside the same task.
  let wasUndone = false;

  const id = sonnerToast.success(message, {
    unstyled: true,
    duration: durationMs,
    classNames: {
      ...BASE_CLASSNAMES,
      toast: `${TOAST_CLASSES.base} ${TOAST_CLASSES.success}`,
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
  return id;
}
