"use client";

import { Info, Calendar } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { TrainerFilterDrawer } from "@/components/search/trainer-filter-drawer";

interface Trainer {
  nombre: string;
  count: number;
}

interface SearchSectionProps {
  defaultValue?: string;
  trainers?: Trainer[];
}

export function SearchSection({ defaultValue, trainers }: SearchSectionProps) {
  return (
    <>
      {/* Mobile layout (below lg): search + filter drawer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:hidden">
        <SearchBar defaultValue={defaultValue} className="w-full sm:flex-1 sm:max-w-md" />
        {trainers && trainers.length > 0 && (
          <TrainerFilterDrawer trainers={trainers} />
        )}
      </div>

      {/* Desktop layout (lg+): search + icon-only links */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex-1">
          <SearchBar defaultValue={defaultValue} className="w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/informacion"
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Información"
          >
            <Info className="h-4 w-4 text-foreground" />
          </Link>
          <Link
            href="/feriados"
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Feriados"
          >
            <Calendar className="h-4 w-4 text-foreground" />
          </Link>
        </div>
      </div>
    </>
  );
}
