import { Skeleton } from "@/components/ui/skeleton";

/**
 * AdminPromocionCardSkeleton — placeholder for a single promo card
 * in the admin promociones list. The real card shows a dollar-icon
 * avatar + title + description + price badge + edit/toggle/delete
 * actions. The skeleton mirrors that footprint.
 */
export function AdminPromocionCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border-l-4 border-l-primary border bg-card p-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-full mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4">
        <Skeleton className="h-6 w-10 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
