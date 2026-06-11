import { Skeleton } from "@/components/ui/skeleton";
import { AdminFeriadoRowSkeleton } from "@/components/admin/skeletons/admin-feriado-row-skeleton";

/**
 * Per-page loading UI for `/admin/feriados`.
 *
 * Mirrors the (admin) route group chrome (sidebar + main content
 * shell) and replaces the generic placeholder with the feriados
 * page's actual layout: back button + title + description + add
 * form card + holidays list card.
 *
 * The add-form card is a generic placeholder (the real
 * FeriadoManager's "Agregar Feriado" form is a client component
 * with controlled state — a stable skeleton placeholder is
 * sufficient here since the user will see the real form within
 * a few hundred ms of the session check completing).
 */
export default function AdminFeriadosLoading() {
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
            {/* Header skeleton — back button + title + description */}
            <div className="flex items-center gap-4 mb-6 px-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            </div>

            {/* Add Feriado form card placeholder */}
            <div className="bg-secondary border border-border rounded-xl p-4 space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>

            {/* Feriados list card */}
            <div className="bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <Skeleton className="h-5 w-56" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <AdminFeriadoRowSkeleton key={i} />
              ))}
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
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>

            <div className="bg-secondary border border-border rounded-xl p-4 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            <div className="bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <Skeleton className="h-5 w-48" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <AdminFeriadoRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
