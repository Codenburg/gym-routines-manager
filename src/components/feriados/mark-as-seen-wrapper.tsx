"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY_PREFIX = "feriados_last_seen_at";

interface MarkAsSeenWrapperProps {
  children: React.ReactNode;
  latestFeriadoDate: string | null;
  orgSlug: string;
}

/**
 * Wrapper that persists latestFeriadoDate to localStorage on mount.
 * Called when user visits the Feriados page to clear the notification.
 * 
 * Receives latestFeriadoDate as prop from server (feriados/page.tsx)
 * so we don't depend on async hook state that may not be ready.
 * 
 * Uses a ref to prevent double invocation in React StrictMode.
 */
export function MarkAsSeenWrapper({ children, latestFeriadoDate, orgSlug }: MarkAsSeenWrapperProps) {
  const called = useRef(false);

  useEffect(() => {
    if (!called.current && latestFeriadoDate) {
      called.current = true;
      localStorage.setItem(`${STORAGE_KEY_PREFIX}:${orgSlug}`, latestFeriadoDate);
    }
  }, [latestFeriadoDate, orgSlug]);

  return <>{children}</>;
}
