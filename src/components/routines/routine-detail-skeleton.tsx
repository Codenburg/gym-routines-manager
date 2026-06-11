import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * RoutineDetailSkeleton — placeholder for the public routine detail
 * page (`/rutinas/[id]`). Mirrors the structure of the real page:
 *
 *   - back link
 *   - header (title + type badge + author line + description)
 *   - 3 stat badges (días, ejercicios, series)
 *   - "Días de entrenamiento" h2
 *   - 3 day accordions (each with a "Día N" + muscle badge row + a
 *     couple of exercise rows so the height of the real list is
 *     approximated)
 *
 * Built on the `Skeleton` primitive (which renders
 * `bg-muted animate-pulse rounded`) so it satisfies the E2E assertion
 * in `tests/homepage.spec.ts:4.10` for the `.animate-pulse` class
 * appearing during loading.
 */
export function RoutineDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back link */}
        <Skeleton className="h-6 w-40 mb-6" />

        {/* Header */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-2/3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-4 mb-8">
          {[
            "w-24",
            "w-32",
            "w-24",
          ].map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2"
            >
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className={`h-4 ${w}`} />
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-56" />

          {Array.from({ length: 3 }).map((_, dayIndex) => (
            <Card key={dayIndex}>
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, exIndex) => (
                    <div
                      key={exIndex}
                      className="flex items-center justify-between"
                    >
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
