'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Shared toast card width. Sonner's default is 356px. Exported so
 * `TOAST_CLASSES.base` (the classNames for sonner-style toasts in
 * src/lib/toast.ts) and this custom-component toast agree on the
 * exact same width class — preventing the previous visual bug where
 * the custom undo toast rendered narrower than the save toasts.
 */
export const TOAST_WIDTH = 'w-[356px]';

type ToastWithProgressProps = {
  message: string;
  /** Total duration in ms. Sonner's toast.duration MUST match this value. */
  duration?: number;
  /** When provided, renders a "Deshacer" action button. */
  onUndo?: () => void;
  /** Called once when the progress bar reaches 100% naturally (NOT on undo). */
  onComplete?: () => void;
};

/**
 * Custom sonner toast rendered via `toast.custom()`. Owns its own
 * progress state via `requestAnimationFrame`, decoupled from CSS
 * keyframes — the previous CSS-based approaches (::before + width
 * animation, box-shadow inset, linear-gradient background) all failed
 * to render reliably given `unstyled: true` + Tailwind layer order +
 * sonner 2.0.7's DOM structure. JS-driven progress sidesteps all that.
 *
 * Pause-on-hover matches sonner's default behaviour: when the user
 * hovers the toast, sonner pauses its dismiss timer AND we pause the
 * progress bar. On mouseleave, both resume from the same accumulated
 * time so the bar reaches 100% in the exact same instant the toast
 * disappears.
 *
 * Implementation: `accumulatedMs` is the monotonic time the bar has
 * spent visible (excluding pauses); `resumeStart` is the
 * `performance.now()` timestamp of the most recent resume, or null
 * when paused. Total elapsed = accumulatedMs + (resumeStart
 *   ? now - resumeStart : 0).
 */
export function ToastWithProgress({
  message,
  duration = 5000,
  onUndo,
  onComplete,
}: ToastWithProgressProps) {
  const [progress, setProgress] = useState(0);
  const accumulatedMsRef = useRef(0);
  const resumeStartRef = useRef<number | null>(performance.now());
  const rafRef = useRef<number | null>(null);
  // Keep onComplete stable across renders without retriggering the effect.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const tick = (now: number) => {
      if (resumeStartRef.current === null) return; // paused
      const elapsed =
        accumulatedMsRef.current + (now - (resumeStartRef.current ?? now));
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // Intentionally NO `isHovered` here. Pause/resume is handled by the
    // event handlers below, which mutate refs without re-mounting the
    // effect (which is what caused the bar to reset to 0 on every
    // hover-out in the previous implementation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // Pause on mouseenter — bank the in-flight time and stop the RAF.
  const handleMouseEnter = () => {
    if (resumeStartRef.current === null) return;
    accumulatedMsRef.current += performance.now() - resumeStartRef.current;
    resumeStartRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Resume on mouseleave — start a fresh RAF from the accumulated time.
  const handleMouseLeave = () => {
    if (resumeStartRef.current !== null) return; // already running
    resumeStartRef.current = performance.now();
    const tick = (now: number) => {
      if (resumeStartRef.current === null) return;
      const elapsed =
        accumulatedMsRef.current + (now - resumeStartRef.current);
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div
      className={`${TOAST_WIDTH} min-h-[64px] flex items-center justify-center gap-2 px-4 py-3 pr-20 rounded-lg border shadow-lg !bg-success !text-success-foreground !border-success/20 relative overflow-hidden`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CheckCircle2 className="shrink-0 w-5 h-5" />
      <span className="leading-tight text-center text-sm font-semibold max-w-full">
        {message}
      </span>
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="absolute top-2 right-2 text-sm font-medium hover:underline"
        >
          Deshacer
        </button>
      )}
      <div
        className="absolute bottom-0 left-0 h-[3px] bg-success-foreground"
        style={{ width: `${progress}%` }}
        data-testid="undo-toast-progress"
      />
    </div>
  );
}