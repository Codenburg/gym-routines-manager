import { Suspense } from "react";
import Link from "next/link";
import { Info, Calendar } from "lucide-react";
import { SearchSection } from "@/components/search/search-section";
import { RoutineList } from "@/components/routines/routine-list";
import { RoutineListSkeleton } from "@/components/routines/routine-card-skeleton";
import { TrainerSidebarClient } from "@/components/search/trainer-sidebar-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCachedRutinas } from "@/lib/rutinas";
import type { DataResult } from "@/lib/data-result";

interface SearchParams {
  search?: string;
  trainers?: string;
}

interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creador: string | null;
  diasCount: number;
}

interface Trainer {
  nombre: string;
  count: number;
}

/**
 * Extract trainers with their routine counts from the rutinas data.
 * This ensures the sidebar counts are consistent with the displayed routines.
 */
function extractTrainers(rutinas: Rutina[]): Trainer[] {
  const trainerMap = new Map<string, number>();

  for (const rutina of rutinas) {
    if (rutina.creador) {
      trainerMap.set(rutina.creador, (trainerMap.get(rutina.creador) || 0) + 1);
    }
  }

  return Array.from(trainerMap.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search = params?.search;
  const trainers = params?.trainers;

  // Use cached function - avoids repeated DB queries within revalidation period
  const rutinasResult: DataResult<Rutina[]> = await getCachedRutinas(search, trainers);

  // Derive trainers from rutinas data - single source of truth
  const trainersData = extractTrainers(rutinasResult.data);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl">
        <div className="mb-12">
          {/* Header with title and top buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
                Rutinas Champion Gym
              </h1>
              <p className="text-muted-foreground text-lg">Explora las mejores rutinas de entrenamiento</p>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <nav className="flex gap-2 sm:hidden">
                <Link
                  href="/informacion"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
                >
                  <Info className="w-4 h-4" />
                  Información
                </Link>
                <Link
                  href="/feriados"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  Feriados
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>

          {/* Search + Cards Container - all aligned */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Trainer Sidebar - uses same error state as routines */}
            <TrainerSidebarClient
              trainers={trainersData}
              hasError={rutinasResult.error}
            />

            {/* Search + Cards */}
            <div className="flex-1">
              {/* Search Section - aligned with cards */}
              <div className="mb-6">
                <SearchSection defaultValue={search ?? ""} />
              </div>

              {/* Cards Grid - streaming with skeleton fallback */}
              <Suspense fallback={<RoutineListSkeleton count={6} />}>
                <RoutineListWrapper rutinasResult={rutinasResult} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

async function RoutineListWrapper({ rutinasResult }: { rutinasResult: DataResult<Rutina[]> }) {
  return <RoutineList rutinas={rutinasResult.data} showError={rutinasResult.error} />;
}
