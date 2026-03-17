"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "./search-input";
import { ActiveFilters } from "./active-filters";
import { useUnifiedSearch } from "@/hooks/use-unified-search";

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const searchParams = useSearchParams();
  const {
    query,
    setQuery,
    activeFilters,
    removeFilter,
    clearFilters,
  } = useUnifiedSearch();

  // Initialize from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl && searchFromUrl !== query) {
      setQuery(searchFromUrl);
    }
  }, [searchParams, query, setQuery]);

  return (
    <div className="w-full">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar rutinas..."
      />
      <ActiveFilters
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={clearFilters}
      />
    </div>
  );
}
