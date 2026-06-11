import { Skeleton } from "@/components/ui/skeleton";
import { AdminStatsGridSkeleton } from "@/components/admin/skeletons/admin-stats-grid-skeleton";
import { AdminRutinasTableSkeleton } from "@/components/admin/skeletons/admin-rutinas-table-skeleton";

/**
 * Per-page loading UI for `/admin` (dashboard).
 *
 * Mirrors the (admin) route group chrome (sidebar + main content
 * shell) and replaces the generic placeholder with the dashboard's
 * actual layout: title-only header, GymPriceEditor card, stats
 * grid, and the recent-rutinas table.
 *
 * Falls through to `(admin)/loading.tsx` is not possible here —
 * Next.js picks the closest `loading.tsx`, so the per-page file
 * wins for `/admin`.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar placeholder — matches AdminSidebar's footprint */}
        <aside
          aria-hidden="true"
          className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-secondary border-r border-border z-30"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="p-4">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              >
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </nav>
          <div className="mt-auto border-t border-border p-4 flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="w-4 h-4 ml-auto rounded" />
          </div>
        </aside>

        {/* Main content — desktop */}
        <div className="ml-64 flex-1 p-6 hidden lg:block">
          <div className="space-y-8">
            {/* Header skeleton — title only (no actions on dashboard) */}
            <div className="flex items-center gap-4 mb-6 px-4">
              <div className="flex-1">
                <Skeleton className="h-7 w-72" />
              </div>
            </div>

            {/* GymPriceEditor placeholder — matches its bg-secondary card */}
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>

            {/* Stats grid — 3 stat tiles in a row */}
            <AdminStatsGridSkeleton />

            {/* Recent rutinas table */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 px-4">
                <Skeleton className="h-5 w-48 inline-block" />
              </h2>
              <AdminRutinasTableSkeleton rows={5} />
            </div>
          </div>
        </div>

        {/* Main content — mobile */}
        <div className="lg:hidden p-4 pt-16 w-full">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Skeleton className="h-7 w-56" />
              </div>
            </div>

            <div className="bg-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>

            <AdminStatsGridSkeleton />

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                <Skeleton className="h-5 w-40 inline-block" />
              </h2>
              <AdminRutinasTableSkeleton rows={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
