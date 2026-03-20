"use client";

import { X } from "lucide-react";
import type { ActiveFilter } from "@/types/search";

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (filter: ActiveFilter) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {filters.map((filter) => (
        <div
          key={`${filter.type}-${filter.value}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border/50 bg-background/80 text-muted-foreground rounded-md"
        >
          <span className="truncate max-w-[150px]">{filter.label}</span>
          <button
            onClick={() => onRemove(filter)}
            className="p-0.5 hover:bg-muted/50 rounded transition-colors"
            aria-label={`Remover filtro ${filter.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
