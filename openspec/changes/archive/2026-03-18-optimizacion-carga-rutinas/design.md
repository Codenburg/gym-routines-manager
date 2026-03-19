# Design: Optimización de Carga de Rutinas

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Homepage (page.tsx)                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Suspense Boundary                                         │   │
│  │                                                           │   │
│  │  fallback: <RoutineListSkeleton />                         │   │
│  │                                                           │   │
│  │  content: <RoutineListWrapper rutinasResult={...} />      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ getCachedRutinas(search, trainers)                      │   │
│  │                                                           │   │
│  │  └── unstable_cache(                                    │   │
│  │        fetchRutinasFromDb,                              │   │
│  │        ["rutinas"],                                     │   │
│  │        { revalidate: 60, tags: ["rutinas"] }         │   │
│  │      )                                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Prisma Query (only on cache miss)                     │   │
│  │                                                           │   │
│  │  prisma.rutina.findMany({                             │   │
│  │    where: { ...filters },                             │   │
│  │    include: { dias: { include: { ejercicios } } },   │   │
│  │    orderBy: { createdAt: "desc" }                     │   │
│  │  })                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Cached Data Function

```typescript
// src/lib/rutinas.ts
export const getCachedRutinas = unstable_cache(
  fetchRutinasFromDb,  // Must be async, no side effects
  ["rutinas"],         // Cache key - changes trigger new cache entry
  {
    revalidate: 60,    // Revalidate every 60 seconds
    tags: ["rutinas"], // Tag for manual revalidation
  }
);
```

### 2. Skeleton Components

```typescript
// src/components/routines/routine-card-skeleton.tsx

// Single card skeleton - mirrors RoutineCard structure
export function RoutineCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-3/4 bg-muted rounded" /> {/* title */}
        <div className="h-5 w-16 bg-muted rounded-full" /> {/* badge */}
      </CardHeader>
      <CardContent>
        <div className="h-4 w-full bg-muted rounded" /> {/* desc line 1 */}
        <div className="h-4 w-2/3 bg-muted rounded" /> {/* desc line 2 */}
        <div className="h-3 w-1/3 bg-muted rounded mt-3" /> {/* creator */}
      </CardContent>
    </Card>
  );
}

// Grid skeleton
export function RoutineListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RoutineCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### 3. Page Integration

```tsx
// src/app/page.tsx
import { getCachedRutinas } from "@/lib/rutinas";
import { RoutineListSkeleton } from "@/components/routines/routine-card-skeleton";

export default async function Home({ searchParams }) {
  const { search, trainers } = await searchParams;
  
  // This is cached - no DB query if cache is fresh
  const rutinasResult = await getCachedRutinas(search, trainers);
  
  return (
    <Suspense fallback={<RoutineListSkeleton count={6} />}>
      <RoutineListWrapper rutinasResult={rutinasResult} />
    </Suspense>
  );
}
```

## Key Design Decisions

### Decision 1: Cache Key is Just ["rutinas"]

**Rationale**: Using only the resource name as cache key. Search and filter parameters are handled internally by the function.

**Tradeoff**: 
- Pro: Simpler cache management
- Con: All search variations share the same base cache (but Next.js creates variations based on function arguments)

### Decision 2: 60 Second Revalidation

**Rationale**: Balance between freshness and DB load.

**Tradeoff**:
- Pro: User sees new routines within 60 seconds
- Con: Slightly stale data for up to 60 seconds

### Decision 3: Skeleton with 6 Cards

**Rationale**: Most pages show 6-12 routines per view. 6 is a good default that fills the grid on desktop.

**Tradeoff**:
- Pro: Immediate visual feedback
- Con: If actual data is empty, skeleton briefly shows then disappears

## State Machine

```
                    ┌─────────────┐
                    │   INITIAL   │
                    └──────┬──────┘
                           │
                           ▼
               ┌───────────────────────────┐
               │      SHOW_SKELETON        │
               │  (Suspense fallback)     │
               └───────────┬───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ SUCCESS  │  │  ERROR   │  │  EMPTY   │
       │ (data)   │  │ (!data)  │  │ (data=[])│
       └──────────┘  └──────────┘  └──────────┘
```

## Performance Characteristics

| Scenario | Before | After |
|----------|---------|-------|
| Cold cache, DB fast | ~300ms render | ~200ms to skeleton + ~50ms to data |
| Warm cache | ~300ms render | ~100ms render (cache hit) |
| DB slow (1s) | 1s spinner | Immediate skeleton + 1s to data |
| DB error | Error boundary crash | Immediate error message |

## Verification Checklist

- [ ] `getCachedRutinas` uses `unstable_cache`
- [ ] Cache revalidates every 60 seconds
- [ ] `RoutineListSkeleton` mirrors `RoutineCard` structure
- [ ] Suspense boundary is properly placed
- [ ] Error state handled without showing skeleton
- [ ] Empty state handled without showing skeleton
- [ ] TypeScript compiles without errors
