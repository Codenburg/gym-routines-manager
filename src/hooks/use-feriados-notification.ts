"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "feriados_last_seen_at";

function getStorageKey(orgSlug: string | null | undefined): string | null {
  const trimmed = orgSlug?.trim();
  if (!trimmed) return null;
  return `${STORAGE_KEY_PREFIX}:${trimmed}`;
}

interface UseFeriadosNotificationReturn {
  hasNew: boolean;
  markAsSeen: () => void;
  latestFeriadoDate: string | null;
}

/**
 * Hook that encapsulates notification badge logic for Feriados.
 * 
 * Evaluates on mount: compares latestFeriadoDate (from server) against
 * lastSeen (from localStorage) to determine if badge should show.
 * 
 * Logic:
 * - First visit (no lastSeen): auto-save baseline, hasNew = false
 * - Returning visit: hasNew = latestFeriadoDate > lastSeen
 * - markAsSeen(): persists latestFeriadoDate to localStorage
 * 
 * Re-evaluation triggers:
 * - On mount when the server-provided latest date changes
 */
export function useFeriadosNotification(
  initialLatestFeriadoDate?: string | null,
  orgSlug?: string | null
): UseFeriadosNotificationReturn {
  const [hasNew, setHasNew] = useState(false);
  const [latestFeriadoDate, setLatestFeriadoDate] = useState<string | null>(
    initialLatestFeriadoDate ?? null
  );

  function markAsSeen() {
    const storageKey = getStorageKey(orgSlug);
    if (latestFeriadoDate && storageKey) {
      localStorage.setItem(storageKey, latestFeriadoDate);
      setHasNew(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    function checkForNew() {
      try {
        const storageKey = getStorageKey(orgSlug);
        const lastSeen = storageKey ? localStorage.getItem(storageKey) : null;
        const latest = initialLatestFeriadoDate ?? null;

        if (cancelled) return;

        setLatestFeriadoDate(latest);

        if (!storageKey) {
          setHasNew(false);
        } else if (!lastSeen && latest) {
          // First visit: auto-save baseline, hasNew = false
          localStorage.setItem(storageKey, latest);
          setHasNew(false);
        } else if (!lastSeen && !latest) {
          setHasNew(false);
        } else if (lastSeen && latest) {
          // ISO 8601 strings sort lexicographically = chronologically
          setHasNew(latest > lastSeen);
        } else {
          setHasNew(false);
        }
      } catch {
        if (cancelled) return;
        // FAIL-SAFE: on any error, don't show badge
        setHasNew(false);
      }
    }

    checkForNew();

    return () => {
      cancelled = true;
    };
  }, [initialLatestFeriadoDate, orgSlug]);

  return { hasNew, markAsSeen, latestFeriadoDate };
}
