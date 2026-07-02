import { RoutineListSkeleton } from "@/components/routines/routine-card-skeleton";

export default function PublicTenantLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl pb-16 lg:pb-0">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 text-center">
              <div className="mx-auto h-12 w-64 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <RoutineListSkeleton count={6} />
        </div>
      </main>
    </div>
  );
}
