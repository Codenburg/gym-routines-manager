# Tasks: Optimización de Carga de Rutinas

## Overview

Implementation of server-side caching with `unstable_cache` and streaming with Suspense + skeleton components.

## Task List

### Phase 1: Data Layer (Cache)

- [x] **1.1** Create `src/lib/rutinas.ts` with `unstable_cache` wrapper
- [x] **1.2** Implement `fetchRutinasFromDb` with `try/catch` returning `DataResult<Rutina[]>`
- [x] **1.3** Export `getCachedRutinas` with 60s revalidation
- [x] **1.4** Implement `revalidateRutinasCache()` helper for manual invalidation

### Phase 2: UI Layer (Skeleton)

- [x] **2.1** Create `src/components/routines/routine-card-skeleton.tsx`
- [x] **2.2** Implement `RoutineCardSkeleton` mirroring `RoutineCard` structure
- [x] **2.3** Implement `RoutineListSkeleton` as grid of 6 skeleton cards
- [x] **2.4** Use `animate-pulse` for loading effect

### Phase 3: Page Integration

- [x] **3.1** Update `src/app/page.tsx` to import `getCachedRutinas`
- [x] **3.2** Replace local `getRutinas()` function with `getCachedRutinas()`
- [x] **3.3** Update Suspense fallback to use `RoutineListSkeleton`
- [x] **3.4** Remove unused `loading.tsx` import from page.tsx

### Phase 4: Verification

- [x] **4.1** TypeScript type check passes (`npx tsc --noEmit`)
- [x] **4.2** Verify skeleton renders correctly during loading
- [x] **4.3** Verify error state shows message without skeleton
- [x] **4.4** Verify empty state shows message without skeleton
- [x] **4.5** Verify success state shows actual data

## Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| 1.1 | ✅ Complete | Created `src/lib/rutinas.ts` |
| 1.2 | ✅ Complete | `fetchRutinasFromDb` with error handling |
| 1.3 | ✅ Complete | `getCachedRutinas` with `unstable_cache` |
| 1.4 | ✅ Complete | `revalidateRutinasCache()` helper |
| 2.1 | ✅ Complete | Created skeleton component file |
| 2.2 | ✅ Complete | `RoutineCardSkeleton` mirrors card structure |
| 2.3 | ✅ Complete | `RoutineListSkeleton` with 6 cards |
| 2.4 | ✅ Complete | Uses `animate-pulse` |
| 3.1 | ✅ Complete | Imports from `@/lib/rutinas` |
| 3.2 | ✅ Complete | Uses `getCachedRutinas` |
| 3.3 | ✅ Complete | Suspense uses `RoutineListSkeleton` |
| 3.4 | ✅ Complete | Removed unused import |
| 4.1 | ✅ Complete | TypeScript clean |
| 4.2 | ✅ Complete | Skeleton renders immediately |
| 4.3 | ✅ Complete | Error state handled correctly |
| 4.4 | ✅ Complete | Empty state handled correctly |
| 4.5 | ✅ Complete | Data displays correctly |

## Files Changed

### Created
```
src/lib/rutinas.ts                              # Cached data fetching
src/components/routines/routine-card-skeleton.tsx  # Skeleton components
```

### Modified
```
src/app/page.tsx                               # Uses getCachedRutinas + Suspense
```

## Verification Results

```
TypeScript Check: ✅ PASSED
No Errors: ✅
No Warnings: ✅
```

## Dependencies

- Next.js 16 (unstable_cache)
- React 19 (Suspense)
- TypeScript 5
