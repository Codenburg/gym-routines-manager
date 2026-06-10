import { Suspense } from "react";
import { SearchSection } from "@/components/search/search-section";
import { RoutineList } from "@/components/routines/routine-list";
import { RoutineListSkeleton } from "@/components/routines/routine-card-skeleton";
import { TrainerPillsClient } from "@/components/search/trainer-pills-client";
import { BottomBar } from "@/components/layout/bottom-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRoutinesPaginated, getTrainerCounts, PAGE_SIZE } from "@/services/routines/pagination";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getGymConfigForServer } from "@/app/actions/gym";
import { resolveGymName } from "@/lib/gym-display";

interface SearchParams {
  page?: string;
  search?: string;
  trainers?: string;
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  // Normalize inputs in page component (per design decision)
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search || "";
  const trainers = params.trainers
    ? String(params.trainers).split(",").filter(Boolean)
    : [];

  // Lightweight query - streams immediately
  const trainerCounts = await getTrainerCounts(search);

  // Resolve gym name via the same DB → env → "Gimnasio" chain used by
  // the root metadata. Wrapped in try/catch so a DB outage falls through
  // to the env/chain default instead of failing the page render.
  let gymName: string;
  try {
    const gym = await getGymConfigForServer();
    gymName = resolveGymName(gym?.nombre);
  } catch {
    gymName = resolveGymName(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl pb-16 lg:pb-0">
        <div className="mb-12">
          {/* Header with title and theme toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground uppercase">
                {gymName}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 lg:hidden">by Codenburg</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Search + Cards Container - mobile-first flex layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Trainer Pills - desktop only */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TrainerPillsClient trainers={trainerCounts} />
            </aside>

            {/* Search + Cards */}
            <div className="flex-1">
              {/* Search Section - aligned with cards */}
              <div className="mb-6">
                <SearchSection
                  defaultValue={search}
                  trainers={trainerCounts}
                />
              </div>

              {/* Cards Grid - streaming with skeleton fallback */}
              <div>
                <Suspense fallback={<RoutineListSkeleton count={6} />}>
                  <RoutineListRSC
                    page={page}
                    search={search}
                    trainers={trainers}
                  />
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

async function RoutineListRSC({
  page,
  search,
  trainers,
}: {
  page: number;
  search: string;
  trainers: string[];
}) {
  const { data, total, error } = await getRoutinesPaginated({
    page,
    pageSize: PAGE_SIZE,
    search,
    trainers,
  });

  // Error state - DB or network failure
  if (error) {
    return <ErrorState message={error} />;
  }

  // Empty state - no data available
  if (data.length === 0) {
    return <EmptyState />;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <RoutineList rutinas={data} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        search={search}
        trainers={trainers}
      />
    </>
  );
}
