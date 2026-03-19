import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Skeleton component that mirrors the structure of RoutineCard.
 * Used during streaming loading to prevent layout shift.
 */
export function RoutineCardSkeleton() {
  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50 animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="h-6 w-3/4 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded-full shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-3 w-1/3 bg-muted rounded mt-3" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid of skeleton cards shown during initial load.
 * Matches the layout of RoutineList.
 */
export function RoutineListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="routine-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <RoutineCardSkeleton key={i} />
      ))}
    </div>
  );
}
