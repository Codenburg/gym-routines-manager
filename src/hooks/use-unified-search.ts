"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ActiveFilter } from "@/types/search";

const DEBOUNCE_DELAY = 300;


export function useUnifiedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();


  const [inputValue, setInputValueState] = useState(searchParams.get("search") ?? "");
  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef = useRef(searchParams.toString());
  const inputValueRef = useRef(inputValue);


  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);


  const query = searchParams.get("search") ?? "";

  const trainerFilters = (() => {
    const trainersParam = searchParams.get("trainers");
    if (trainersParam) {
      return trainersParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .sort();
    }

    const creador = searchParams.get("creador");
    if (creador) {
      return [creador];
    }

    return [];
  })();

  const activeFilters: ActiveFilter[] = trainerFilters.map((trainer) => ({
    type: "entrenador" as const,
    value: trainer,
    label: `Entrenador: ${trainer}`,
  }));

  const buildParams = useCallback(
    (searchToSet: string, trainersToSet: string[]) => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchToSet.trim()) {
        params.set("search", searchToSet);
      } else {
        params.delete("search");
      }

      if (trainersToSet.length > 0) {
        params.delete("creador");

        params.set("trainers", [...trainersToSet].sort().join(","));
      } else {
        params.delete("creador");
        params.delete("trainers");
      }

      // Any change to search or trainers should reset to page 1.
      // Without this, applying a filter while on page 2 leaves the
      // user on page 2 with an empty result list (the filtered set
      // fits on page 1).
      params.delete("page");

      return params;
    },
    [searchParams]
  );


  const executeReplace = useCallback(
    (params: URLSearchParams): boolean => {
      const newUrl = params.toString();

      if (newUrl === prevUrlRef.current) {
        return false;
      }

      router.replace(`?${newUrl}`, { scroll: false });
      prevUrlRef.current = newUrl;
      return true;
    },
    [router]
  );

  const cancelDebounce = useCallback(() => {
    if (debounceTimeoutRef.current !== null) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancelDebounce();
    };
  }, [cancelDebounce]);


  useEffect(() => {
    const currentUrl = searchParams.toString();

    // No hubo navegación real si la URL es igual a la última que escribimos
    if (currentUrl === prevUrlRef.current) {
      return;
    }

    // Hubo navegación real: cancelar debounce y sincronizar
    cancelDebounce();

    const urlSearch = searchParams.get("search") ?? "";
    // eslint-disable-next-line
    setInputValueState(urlSearch);
    inputValueRef.current = urlSearch;
    prevUrlRef.current = currentUrl;
  }, [searchParams, cancelDebounce]);


  const setInputValue = useCallback(
    (value: string) => {
      // Update local state immediately for responsive UI
      setInputValueState(value);
      inputValueRef.current = value;

      // Cancel any pending debounce
      cancelDebounce();

      // Schedule new debounced URL update
      debounceTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;

        const params = buildParams(value, trainerFilters);
        executeReplace(params);
        debounceTimeoutRef.current = null;
      }, DEBOUNCE_DELAY);
    },
    [cancelDebounce, buildParams, trainerFilters, executeReplace]
  );

  const setQuery = setInputValue;

  const toggleTrainerFilter = useCallback(
    (name: string) => {
      cancelDebounce();

      const newFilters = trainerFilters.includes(name)
        ? trainerFilters.filter((t) => t !== name)
        : [...trainerFilters, name];

      const params = buildParams(query, newFilters);
      executeReplace(params);
    },
    [trainerFilters, query, buildParams, executeReplace, cancelDebounce]
  );

  const clearTrainerFilters = useCallback(() => {
    cancelDebounce();

    const params = buildParams(query, []);
    executeReplace(params);
  }, [query, buildParams, executeReplace, cancelDebounce]);

  const removeFilter = useCallback(
    (filter: ActiveFilter) => {
      if (filter.type === "entrenador") {
        cancelDebounce();

        const newFilters = trainerFilters.filter((t) => t !== filter.value);
        const params = buildParams(query, newFilters);
        executeReplace(params);
      }
    },
    [trainerFilters, query, buildParams, executeReplace, cancelDebounce]
  );

  const clearFilters = useCallback(() => {
    cancelDebounce();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("creador");
    params.delete("trainers");

    setInputValueState("");
    inputValueRef.current = "";
    executeReplace(params);
  }, [searchParams, executeReplace, cancelDebounce]);

  const clearInput = useCallback(() => {
    cancelDebounce();

    setInputValueState("");
    inputValueRef.current = "";

    const params = buildParams("", trainerFilters);
    executeReplace(params);
  }, [trainerFilters, buildParams, executeReplace, cancelDebounce]);

  return {
    inputValue,
    setInputValue,
    query,
    setQuery,
    clearInput,
    results: null,
    isLoading: false,
    trainerFilters,
    toggleTrainerFilter,
    clearTrainerFilters,
    activeFilters,
    removeFilter,
    clearFilters,
  };
}
