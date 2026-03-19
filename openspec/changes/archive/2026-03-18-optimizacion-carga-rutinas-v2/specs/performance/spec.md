# Spec: Optimización de Carga de Rutinas

## Overview

This spec defines the caching and streaming strategy for the homepage rutinas list, ensuring fast initial page loads with progressive data loading.

## Data Caching Specification

### unstable_cache Usage

```typescript
// src/lib/rutinas.ts
export const getCachedRutinas = unstable_cache(
  fetchRutinasFromDb,  // async function
  ["rutinas"],          // cache key parts
  {
    revalidate: 60,    // seconds
    tags: ["rutinas"], // for manual revalidation
  }
);
```

### Cache Behavior

| Scenario | Cache Behavior |
|----------|---------------|
| First request | DB query, result cached |
| Next 60s requests | Cache hit, no DB query |
| After 60s | DB query, cache refreshed |
| Error | Returns `{ data: [], error: true }` |

### Revalidation

Manual revalidation via `revalidateTag("rutinas")` can be called after:
- Creating a new rutina
- Updating an existing rutina
- Deleting a rutina

## Streaming Specification

### Suspense Boundary

```tsx
<Suspense fallback={<RoutineListSkeleton count={6} />}>
  <RoutineListWrapper rutinasResult={rutinasResult} />
</Suspense>
```

### State Flow

```
Page Load
    │
    ├── Suspense boundary enters → show skeleton immediately
    │
    ├── getCachedRutinas() resolves
    │
    ├── If error: RoutineList shows "No se pudieron cargar"
    ├── If empty: RoutineList shows "No hay rutinas"
    └── If data: RoutineList shows cards grid
```

## UI States

### Loading State (Skeleton)

```tsx
<RoutineListSkeleton count={6} />
```

- Shows 6 skeleton cards in grid layout
- Each skeleton mirrors `RoutineCard` structure:
  - CardHeader: title placeholder + badge placeholder
  - CardContent: description lines + creator placeholder
  - CardFooter: diasCount placeholder
- Uses `animate-pulse` for loading effect

### Error State

When `showError === true`:
- Message: "No se pudieron cargar las rutinas"
- Icon: AlertCircle (from lucide-react)
- No skeleton, no cards, just error message

### Empty State

When `error === false && data.length === 0`:
- Message: "No hay rutinas disponibles"
- Icon: FolderOpen (from lucide-react)
- Call to action: "Crea tu primera rutina"

### Success State

When `error === false && data.length > 0`:
- Normal card grid with all routines
- Each card shows: nombre, tipo, descripcion, creador, diasCount

## Component Map

| Component | File | Purpose |
|-----------|------|---------|
| `getCachedRutinas` | `src/lib/rutinas.ts` | Cached DB access |
| `RoutineCardSkeleton` | `routine-card-skeleton.tsx` | Single card skeleton |
| `RoutineListSkeleton` | `routine-card-skeleton.tsx` | Grid of skeletons |
| `RoutineList` | `routine-list.tsx` | Handles success/error/empty states |

## File Structure

```
src/
├── lib/
│   └── rutinas.ts                    # getCachedRutinas with unstable_cache
├── app/
│   └── page.tsx                   # Uses getCachedRutinas + Suspense
└── components/
    └── routines/
        ├── routine-list.tsx        # Success/error/empty handling
        ├── routine-card.tsx        # Actual card component
        └── routine-card-skeleton.tsx # Skeleton components
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Time to First Byte (TTFB) | <200ms |
| Time to Interactive (TTI) | <500ms |
| Skeleton shown | <100ms |
| Cache hit rate | >90% for repeated visits |

## Acceptance Criteria

### AC1: Cache Reduces DB Load
```
GIVEN a user visits the homepage
WHEN the page is cached
THEN no DB query is made
AND the response is served from cache
```

### AC2: Skeleton Shows Immediately
```
GIVEN a user navigates to the homepage
WHEN the page starts loading
THEN skeleton cards are shown within 100ms
AND the page layout is preserved
```

### AC3: Error State is Clear
```
GIVEN the DB is unavailable
WHEN getCachedRutinas fails
THEN the UI shows "No se pudieron cargar las rutinas"
AND no fake data or skeleton is displayed
```

### AC4: Success State Shows Data
```
GIVEN the DB is available and has routines
WHEN getCachedRutinas succeeds
THEN the routines are displayed in a card grid
AND each card shows nombre, tipo, creator, diasCount
```

### AC5: Three States are Exclusive
```
GIVEN a loading/rendering page
WHEN an error occurs
THEN skeleton is replaced with error state only
AND success data never shows alongside error state
```
