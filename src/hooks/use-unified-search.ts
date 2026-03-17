"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ActiveFilter,
  UnifiedSearchResult,
} from "@/types/search";

const DEBOUNCE_DELAY = 300;

interface UseUnifiedSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  results: UnifiedSearchResult | null;
  isLoading: boolean;
  trainerFilters: string[];
  toggleTrainerFilter: (name: string) => void;
  clearTrainerFilters: () => void;
  activeFilters: ActiveFilter[];
  removeFilter: (filter: ActiveFilter) => void;
  clearFilters: () => void;
}

export function useUnifiedSearch(): UseUnifiedSearchReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [query, setQueryState] = useState(searchParams.get("search") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trainerFilters, setTrainerFilters] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  // Initialize trainer filters from URL
  useEffect(() => {
    const trainersParam = searchParams.get("trainers");
    if (trainersParam) {
      const trainers = trainersParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      setTrainerFilters(trainers);

      // Build active filters from trainers
      const filters: ActiveFilter[] = trainers.map((trainer) => ({
        type: "entrenador",
        value: trainer,
        label: `Entrenador: ${trainer}`,
      }));
      setActiveFilters(filters);
    } else {
      // Backwards compatibility: check old 'creador' param
      const creador = searchParams.get("creador");
      if (creador) {
        setTrainerFilters([creador]);
        setActiveFilters([
          {
            type: "entrenador",
            value: creador,
            label: `Entrenador: ${creador}`,
          },
        ]);
      } else {
        setTrainerFilters([]);
        setActiveFilters([]);
      }
    }
  }, [searchParams]);

  // Debounce query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fetch autocomplete results (only if we still need them for other purposes)
  useEffect(() => {
    // Note: Autocomplete is being removed, but we keep this for potential future use
    // or until we fully remove the SearchAutocomplete component
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search/unified?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Sync query with URL (main search, not autocomplete)
  // Use shallow routing to avoid re-rendering server components
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Only update if values actually changed from URL
      const currentSearch = params.get("search") || "";
      const currentTrainers = params.get("trainers") || "";
      
      const newSearch = query.trim() || "";
      const newTrainers = trainerFilters.join(",");
      
      // Skip if nothing changed
      if (currentSearch === newSearch && currentTrainers === newTrainers) {
        return;
      }
      
      if (newSearch) {
        params.set("search", newSearch);
      } else {
        params.delete("search");
      }
      // Remove old 'creador' param if we have trainers
      if (trainerFilters.length > 0) {
        params.delete("creador");
        params.set("trainers", newTrainers);
      } else {
        params.delete("creador");
        params.delete("trainers");
      }
      
      // Use replace with shallow to avoid server re-render
      router.replace(`?${params.toString()}`, { scroll: false });
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [query, searchParams, router, trainerFilters]);

  // Set query and update URL
  const setQuery = useCallback((value: string) => {
    setQueryState(value);
  }, []);

  // Toggle trainer filter
  const toggleTrainerFilter = useCallback((name: string) => {
    setTrainerFilters((prev) => {
      const newFilters = prev.includes(name)
        ? prev.filter((t) => t !== name)
        : [...prev, name];

      // Update active filters
      const filters: ActiveFilter[] = newFilters.map((trainer) => ({
        type: "entrenador",
        value: trainer,
        label: `Entrenador: ${trainer}`,
      }));
      setActiveFilters(filters);

      return newFilters;
    });
  }, []);

  // Clear all trainer filters
  const clearTrainerFilters = useCallback(() => {
    setTrainerFilters([]);
    setActiveFilters([]);
  }, []);

  // Remove filter (for active filter chips)
  const removeFilter = useCallback((filter: ActiveFilter) => {
    if (filter.type === "entrenador") {
      setTrainerFilters((prev) => {
        const newFilters = prev.filter((t) => t !== filter.value);
        const filters: ActiveFilter[] = newFilters.map((trainer) => ({
          type: "entrenador",
          value: trainer,
          label: `Entrenador: ${trainer}`,
        }));
        setActiveFilters(filters);
        return newFilters;
      });
    }
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setTrainerFilters([]);
    setActiveFilters([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("creador");
    params.delete("trainers");
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    trainerFilters,
    toggleTrainerFilter,
    clearTrainerFilters,
    activeFilters,
    removeFilter,
    clearFilters,
  };
}
