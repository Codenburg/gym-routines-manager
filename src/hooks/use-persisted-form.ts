"use client";

import { useCallback, useEffect, useRef } from "react";
import { useForm, UseFormReturn, useWatch, type UseFormProps } from "react-hook-form";
import { useRouter } from "next/navigation";

interface UsePersistedFormOptions<T> {
  storageKey: string;
  version: number;
  debounceMs?: number;
  onSuccess?: (data: T) => void | Promise<void>;
}

interface PersistedFormData<T> {
  version: number;
  data: T;
  savedAt: number;
}

const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Hook that wraps useForm with automatic localStorage persistence.
 * - Restores data on mount (if version matches)
 * - Persists changes with debounce
 * - Exposes clear() to delete persisted data
 * - Handles parse errors gracefully
 */
export function usePersistedForm<T extends Record<string, unknown>>(
  options: UsePersistedFormOptions<T> &
    UseFormProps<T> & {
      onSuccess?: (data: T) => void | Promise<void>;
    }
): UseFormReturn<T> & { clear: () => void } {
  const {
    storageKey,
    version,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onSuccess,
    ...formProps
  } = options;

  const router = useRouter();
  const form = useForm<T>(formProps);
  const { reset, getValues, handleSubmit } = form;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoredRef = useRef(false);

  // Get the full form values (not just watched fields)
  const allValues = useWatch({ control: form.control }) as T;

  // Restore data from localStorage on mount
  useEffect(() => {
    if (isRestoredRef.current) return;
    isRestoredRef.current = true;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      const parsed: PersistedFormData<T> = JSON.parse(stored);

      // Check version compatibility
      if (parsed.version !== version) {
        // Version mismatch - clear stale data
        localStorage.removeItem(storageKey);
        return;
      }

      // Restore form data
      if (parsed.data && typeof parsed.data === "object") {
        reset(parsed.data);
      }
    } catch {
      // Parse error - clear corrupted data silently
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors
      }
    }
  }, [storageKey, version, reset]);

  // Persist form changes with debounce
  useEffect(() => {
    if (!isRestoredRef.current) return; // Don't persist before first restore

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const currentValues = getValues();
        const persistData: PersistedFormData<T> = {
          version,
          data: currentValues,
          savedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(persistData));
      } catch {
        // Storage full or unavailable - fail silently
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [allValues, storageKey, version, debounceMs, getValues]);

  // Clear persisted data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  return {
    ...form,
    clear,
  };
}

/**
 * Simplified version without router dependency for forms that don't need navigation
 */
export function usePersistedFormSimple<T extends Record<string, unknown>>(
  options: Omit<UsePersistedFormOptions<T>, "onSuccess"> &
    UseFormProps<T>
): UseFormReturn<T> & { clear: () => void } {
  const {
    storageKey,
    version,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    ...formProps
  } = options;

  const form = useForm<T>(formProps);
  const { reset, getValues } = form;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoredRef = useRef(false);

  // Get the full form values
  const allValues = useWatch({ control: form.control }) as T;

  // Restore data from localStorage on mount
  useEffect(() => {
    if (isRestoredRef.current) return;
    isRestoredRef.current = true;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      const parsed: PersistedFormData<T> = JSON.parse(stored);

      if (parsed.version !== version) {
        localStorage.removeItem(storageKey);
        return;
      }

      if (parsed.data && typeof parsed.data === "object") {
        reset(parsed.data);
      }
    } catch {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [storageKey, version, reset]);

  // Persist form changes with debounce
  useEffect(() => {
    if (!isRestoredRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const currentValues = getValues();
        const persistData: PersistedFormData<T> = {
          version,
          data: currentValues,
          savedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(persistData));
      } catch {
        // Fail silently
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [allValues, storageKey, version, debounceMs, getValues]);

  // Clear persisted data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  return {
    ...form,
    clear,
  };
}
