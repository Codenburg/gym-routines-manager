import { Skeleton } from "@/components/ui/skeleton";
import { AdminPromocionCardSkeleton } from "@/components/admin/skeletons/admin-promocion-card-skeleton";

/**
 * Per-page loading UI for `/admin/promociones`.
 *
 * Mirrors the (admin) route group chrome (sidebar + main content
 * shell) and replaces the generic placeholder with the
 * promociones page's actual layout: title + description + list
 * of promo cards.
 *
 * The real page uses `container py-8` (not the usual
 * `space-y-6`) so this loading file matches that wrapper too,
 * preserving the same vertical rhythm and side gutters.
 */
export default function AdminPromocionesLoading() {
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
          <div className="container py-8 space-y-6">
            {/* Header skeleton — title + description */}
            <div className="flex items-center gap-4 mb-6 px-4">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-3.5 w-72" />
              </div>
            </div>

            {/* Promociones list card — mirrors the right column of the real grid */}
            <div className="bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <Skeleton className="h-5 w-64" />
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <AdminPromocionCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content — mobile */}
        <div className="lg:hidden p-4 pt-16 w-full">
          <div className="container py-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-3.5 w-56" />
              </div>
            </div>

            <div className="bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <Skeleton className="h-5 w-56" />
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <AdminPromocionCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
