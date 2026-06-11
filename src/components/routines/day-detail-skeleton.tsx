import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

/**
 * DayDetailSkeleton — placeholder for the public day detail page
 * (`/rutinas/[id]/dias/[diaId]`). Mirrors the structure of the real
 * page:
 *
 *   - back link
 *   - header (h1 "Día N" + muscle badges)
 *   - "Ejercicios (N)" h2
 *   - 5 exercise cards (each with a numbered circle + exercise name +
 *     series count)
 *
 * Built on the `Skeleton` primitive (which renders
 * `bg-muted animate-pulse rounded`) so it satisfies the E2E assertion
 * in `tests/homepage.spec.ts:4.10` for the `.animate-pulse` class
 * appearing during loading.
 */
export function DayDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back link */}
        <Skeleton className="h-6 w-44 mb-6" />

        {/* Header */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Exercises list */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />

          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
