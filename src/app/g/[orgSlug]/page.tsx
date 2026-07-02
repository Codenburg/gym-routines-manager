import { Suspense } from "react";
import { BottomBar } from "@/components/layout/bottom-bar";
import { RoutineListSkeleton } from "@/components/routines/routine-card-skeleton";
import { RoutineList } from "@/components/routines/routine-list";
import { SearchSection } from "@/components/search/search-section";
import { TrainerPillsClient } from "@/components/search/trainer-pills-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getGymNameForServerForTenant } from "@/app/actions/gym";
import { resolveGymNameForTenant } from "@/lib/gym-display";
import { getLatestFeriadoDateForTenant } from "@/lib/feriados";
import { buildPublicHref } from "@/lib/tenants/href";
import { getPublicTenantContext } from "@/lib/tenants/resolve";
import {
  getRoutinesPaginatedForTenant,
  getTrainerCountsForTenant,
  PAGE_SIZE,
} from "@/services/routines/pagination";

interface PublicHomeRouteProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    trainers?: string;
  }>;
}

export default async function PublicTenantHomePage({
  params,
  searchParams,
}: PublicHomeRouteProps) {
  const [{ orgSlug }, query] = await Promise.all([params, searchParams]);
  const tenant = await getPublicTenantContext(orgSlug);
  const page = Math.max(1, Number(query.page) || 1);
  const search = query.search || "";
  const trainers = query.trainers ? String(query.trainers).split(",").filter(Boolean) : [];

  const [trainerCounts, dbName, latestFeriadoDate] = await Promise.all([
    getTrainerCountsForTenant(tenant.organizationId, search),
    getGymNameForServerForTenant(tenant.organizationId),
    getLatestFeriadoDateForTenant(tenant.organizationId),
  ]);
  const gymName = resolveGymNameForTenant(dbName);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl pb-16 lg:pb-0">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground uppercase">
                {gymName}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 lg:hidden">by Codenburg</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TrainerPillsClient trainers={trainerCounts} />
            </aside>

            <div className="flex-1">
              <div className="mb-6">
                <SearchSection
                  defaultValue={search}
                  trainers={trainerCounts}
                  latestFeriadoDate={latestFeriadoDate}
                />
              </div>

              <div>
                <Suspense fallback={<RoutineListSkeleton count={6} />}>
                  <RoutineListRSC
                    organizationId={tenant.organizationId}
                    orgSlug={tenant.orgSlug}
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

      <BottomBar latestFeriadoDate={latestFeriadoDate} />
    </div>
  );
}

async function RoutineListRSC({
  organizationId,
  orgSlug,
  page,
  search,
  trainers,
}: {
  organizationId: string;
  orgSlug: string;
  page: number;
  search: string;
  trainers: string[];
}) {
  const { data, total, error } = await getRoutinesPaginatedForTenant(organizationId, {
    page,
    pageSize: PAGE_SIZE,
    search,
    trainers,
  });

  if (error) {
    return <ErrorState message={error} />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <RoutineList rutinas={data} orgSlug={orgSlug} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        search={search}
        trainers={trainers}
        basePath={buildPublicHref(orgSlug)}
      />
    </>
  );
}
