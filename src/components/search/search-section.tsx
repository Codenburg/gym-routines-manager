"use client";

import { Info, Calendar } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { TrainerFilterDrawer } from "@/components/search/trainer-filter-drawer";
import { useFeriadosNotification } from "@/hooks/use-feriados-notification";
import { buildPublicHref } from "@/lib/tenants/href";
import { useOrgSlug } from "@/hooks/use-org-slug";

interface Trainer {
  nombre: string;
  count: number;
}

interface SearchSectionProps {
  defaultValue?: string;
  trainers?: Trainer[];
  latestFeriadoDate?: string | null;
}

export function SearchSection({ defaultValue, trainers, latestFeriadoDate = null }: SearchSectionProps) {
  const orgSlug = useOrgSlug();
  const { hasNew } = useFeriadosNotification(latestFeriadoDate, orgSlug);
  const informacionHref = orgSlug ? buildPublicHref(orgSlug, "/informacion") : null;
  const feriadosHref = orgSlug ? buildPublicHref(orgSlug, "/feriados") : null;

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
          {informacionHref && (
            <Link
              href={informacionHref}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Información"
            >
              <Info className="h-4 w-4 text-foreground" />
            </Link>
          )}
          {feriadosHref && (
            <Link
              href={feriadosHref}
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
          )}
        </div>
      </div>
    </>
  );
}
