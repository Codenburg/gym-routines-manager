import { Skeleton } from "@/components/ui/skeleton";

/**
 * AdminDescuentoRowSkeleton — placeholder for a single row in the
 * admin descuentos-duracion manager. The real row shows meses + %
 * inputs + edit/delete actions. The skeleton mirrors that footprint.
 */
export function AdminDescuentoRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
