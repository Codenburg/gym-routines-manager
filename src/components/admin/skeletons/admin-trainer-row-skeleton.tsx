import { Skeleton } from "@/components/ui/skeleton";

/**
 * AdminTrainerRowSkeleton — placeholder for a single row in the
 * admin trainers manager. The real row is an avatar + name/email
 * column + role pill + edit/delete actions. The skeleton mirrors
 * that footprint.
 */
export function AdminTrainerRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
