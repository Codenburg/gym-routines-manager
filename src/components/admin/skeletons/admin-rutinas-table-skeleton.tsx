import { Skeleton } from "@/components/ui/skeleton";

/**
 * AdminRutinasTableSkeleton — placeholder rows for the admin rutinas
 * list. The real list is a TanStack Table rendered by
 * `RutinasListClient`; the skeleton mirrors its row shape (checkbox
 * column, name, type badge, days count, action icons) so layout
 * doesn't shift when the data resolves.
 */
export function AdminRutinasTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-border">
      <div className="bg-muted px-6 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <div className="flex items-center gap-1 ml-auto">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
