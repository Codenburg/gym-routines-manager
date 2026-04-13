import { Suspense } from "react";
import { SearchSection } from "@/components/search/search-section";
import { RoutineList } from "@/components/routines/routine-list";
import { RoutineListSkeleton } from "@/components/routines/routine-card-skeleton";
import { TrainerPillsClient } from "@/components/search/trainer-pills-client";
import { BottomBar } from "@/components/layout/bottom-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFilteredRutinas } from "@/lib/rutinas";

interface SearchParams {
  search?: string;
  trainers?: string;
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search = params?.search;
  const trainers = params?.trainers;

  // Use cached function - avoids repeated DB queries within revalidation period
  // If DB fails, result is null (not cached) so UI shows error state
  let result;
  try {
    result = await getFilteredRutinas(search, trainers);
  } catch {
    result = null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl pb-16 lg:pb-0">
        <div className="mb-12">
          {/* Header with title and theme toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 text-center">
              <h1 className="text-4xl sm:text-5xl font-black text-foreground" style={{ fontFamily: 'var(--font-bebas-neue), sans-serif' }}>
                Champion Gym
              </h1>
              <p className="text-xs text-muted-foreground mt-1 lg:hidden">by Codenburg</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Search + Cards Container - mobile-first flex layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Trainer Pills - desktop only */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TrainerPillsClient trainers={result?.trainers ?? null} />
            </aside>

            {/* Search + Cards */}
            <div className="flex-1">
              {/* Search Section - aligned with cards */}
              <div className="mb-6">
                <SearchSection
                  defaultValue={search ?? ""}
                  trainers={result?.trainers ?? undefined}
                />
              </div>

              {/* Cards Grid - streaming with skeleton fallback */}
              <div>
                <Suspense fallback={<RoutineListSkeleton count={6} />}>
                  <RoutineListWrapper result={result} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <BottomBar />
    </div>
  );
}

interface RoutineListWrapperProps {
  result: Awaited<ReturnType<typeof getFilteredRutinas>> | null;
}

async function RoutineListWrapper({ result }: RoutineListWrapperProps) {
  return <RoutineList rutinas={result?.rutinas ?? null} />;
}
