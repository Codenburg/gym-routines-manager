"use client";

import { Info, Calendar } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { TrainerFilterDrawer } from "@/components/search/trainer-filter-drawer";
import { useFeriadosNotification } from "@/hooks/use-feriados-notification";

interface Trainer {
  nombre: string;
  count: number;
}

interface SearchSectionProps {
  defaultValue?: string;
  trainers?: Trainer[];
}

export function SearchSection({ defaultValue, trainers }: SearchSectionProps) {
  const { hasNew } = useFeriadosNotification();

  return (
    <>
      {/* Mobile layout (below lg): search + filter drawer */}
      <div className="flex items-center gap-3 lg:hidden">
        <SearchBar defaultValue={defaultValue} className="flex-1" />
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
            className="relative p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Feriados"
          >
            <Calendar className="h-4 w-4 text-foreground" />
            {hasNew && (
              <span className="absolute top-0.5 right-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-red-600 text-white text-[8px] font-bold shadow-md ring-1 ring-background">
                <span aria-hidden="true">!</span>
                <span className="sr-only">Nuevos feriados</span>
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
