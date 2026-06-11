import { Skeleton } from "@/components/ui/skeleton";

/**
 * AdminFeriadoRowSkeleton — placeholder for a single row in the
 * admin feriados manager. The real row is a date pill + edit/delete
 * actions; the skeleton mirrors that footprint.
 */
export function AdminFeriadoRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
