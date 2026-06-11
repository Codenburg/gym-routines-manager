import { Skeleton } from "@/components/ui/skeleton";
import { AdminRutinasTableSkeleton } from "@/components/admin/skeletons/admin-rutinas-table-skeleton";

/**
 * Per-page loading UI for `/admin/rutinas`.
 *
 * Mirrors the (admin) route group chrome (sidebar + main content
 * shell) and replaces the generic placeholder with the rutinas
 * list's actual layout: back button + title + description +
 * "Nueva Rutina" action + search input + table.
 *
 * Without this file, the user would see the generic
 * `(admin)/loading.tsx` (which uses the wrong generic table
 * shape) while the session check + `getRutinas()` query resolve.
 */
export default function AdminRutinasLoading() {
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
          <div className="space-y-6">
            {/* Header skeleton — back button + title + description + Nueva Rutina action */}
            <div className="flex items-center gap-4 mb-6 px-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3.5 w-64" />
              </div>
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>

            {/* Search input placeholder — mirrors RutinasListClient's search bar */}
            <div className="w-full px-4">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Rutinas table */}
            <div className="px-4">
              <AdminRutinasTableSkeleton rows={8} />
            </div>
          </div>
        </div>

        {/* Main content — mobile */}
        <div className="lg:hidden p-4 pt-16 w-full">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>

            <Skeleton className="h-12 w-full rounded-lg" />

            <AdminRutinasTableSkeleton rows={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
