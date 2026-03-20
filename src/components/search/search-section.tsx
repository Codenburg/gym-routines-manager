"use client";

import Link from "next/link";
import { Info, Calendar } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";

export function SearchSection({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="flex-1 max-w-3xl">
      {/* Search row with buttons */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar defaultValue={defaultValue} />
        </div>
        <nav className="hidden sm:flex gap-2 shrink-0">
          <Link
            href="/informacion"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            <Info className="w-4 h-4" />
            Información
          </Link>
          <Link
            href="/feriados"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            Feriados
          </Link>
        </nav>
      </div>
    </div>
  );
}
