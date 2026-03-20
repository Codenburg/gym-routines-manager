# Tasks: Error Handling with Graceful Degradation

## Overview

Implementation of `DataResult<T>` pattern for consistent error handling across all data fetching functions and UI components.

## Task List

### Phase 1: Core Infrastructure

- [x] **1.1** Create `src/lib/data-result.ts` with `DataResult<T>` interface, `ok()`, and `err()` helpers

### Phase 2: Data Layer Refactoring

- [x] **2.1** Refactor `getRutinas()` in `src/app/page.tsx` to return `DataResult<Rutina[]>` with `try/catch`
- [x] **2.2** Remove separate `getTrainers()` function and create `extractTrainers(rutinas)` to derive trainers from rutinas data
- [x] **2.3** Refactor `getFeriados()` in `src/app/feriados/page.tsx` to return `DataResult<Feriado[]>`
- [x] **2.4** Refactor `getGymPrice()` in `src/app/informacion/page.tsx` to return `DataResult<number | null>` (null on error)
- [x] **2.5** Refactor `getRutina()` in `src/app/rutinas/[id]/page.tsx` to return `DataResult<Rutina | null>` (removed `throw`)
- [x] **2.6** Refactor `getDia()` in `src/app/rutinas/[id]/dias/[diaId]/page.tsx` to return `DataResult<Dia | null>` (removed `throw`)
- [x] **2.7** Refactor `getStats()` in `src/app/admin/page.tsx` to return `DataResult<Stats>`
- [x] **2.8** Refactor `getGymPrice()` in `src/app/admin/page.tsx` to return `DataResult<number | null>`

### Phase 3: UI Layer Updates

- [x] **3.1** Update `RoutineList` in `src/components/routines/routine-list.tsx` to handle `showError?: boolean` prop
- [x] **3.2** Update `TrainerSidebarClient` in `src/components/search/trainer-sidebar-client.tsx` to accept `trainers[]` and `hasError` instead of `trainersResult`
- [x] **3.3** Update `PriceSection` in `src/app/informacion/page.tsx` to show "No disponible" instead of fallback price
- [x] **3.4** Update `GymPriceEditor` in `src/components/admin/GymPriceEditor.tsx` to handle `initialPrice: number | null`

### Phase 4: Error Boundary Configuration

- [x] **4.1** Create `src/app/error.tsx` as safety net for unexpected errors (NOT for infrastructure failures)
- [x] **4.2** Create `src/app/global-error.tsx` for fatal root layout errors
- [x] **4.3** Create `src/components/error/error-display.tsx` reusable error UI component

### Phase 5: Verification

- [x] **5.1** TypeScript type check passes (`npx tsc --noEmit`)
- [x] **5.2** No fake/hardcoded fallback values (e.g., 45000) in UI components
- [x] **5.3** Single source of truth verified: `rutinasResult.error` controls both sidebar and content
- [x] **5.4** Error boundary NOT triggered by DB failures (verified by code review)

## Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| 1.1 | ✅ Complete | Created `DataResult<T>` with `ok()` and `err()` |
| 2.1 | ✅ Complete | `getRutinas()` returns `DataResult<Rutina[]>` |
| 2.2 | ✅ Complete | Removed `getTrainers()`, created `extractTrainers()` |
| 2.3 | ✅ Complete | `getFeriados()` returns `DataResult<Feriado[]>` |
| 2.4 | ✅ Complete | `getGymPrice()` returns `DataResult<number | null>` |
| 2.5 | ✅ Complete | `getRutina()` returns `DataResult<Rutina | null>`, removed `throw` |
| 2.6 | ✅ Complete | `getDia()` returns `DataResult<Dia | null>`, removed `throw` |
| 2.7 | ✅ Complete | `getStats()` returns `DataResult<Stats>` |
| 2.8 | ✅ Complete | Admin `getGymPrice()` returns `DataResult<number | null>` |
| 3.1 | ✅ Complete | `RoutineList` handles `showError` prop |
| 3.2 | ✅ Complete | `TrainerSidebarClient` uses single source of truth |
| 3.3 | ✅ Complete | Price shows "No disponible" on error |
| 3.4 | ✅ Complete | `GymPriceEditor` handles `null` price |
| 4.1 | ✅ Complete | `error.tsx` for unexpected errors only |
| 4.2 | ✅ Complete | `global-error.tsx` for fatal errors |
| 4.3 | ✅ Complete | `ErrorDisplay` reusable component |
| 5.1 | ✅ Complete | TypeScript clean |
| 5.2 | ✅ Complete | No fake values in UI |
| 5.3 | ✅ Complete | Single source of truth verified |
| 5.4 | ✅ Complete | Error boundaries reserved for bugs |

## Files Changed

### Created
```
src/lib/data-result.ts                           # DataResult<T> type
src/app/error.tsx                                 # Error boundary
src/app/global-error.tsx                          # Global error boundary
src/components/error/error-display.tsx            # Reusable error UI
```

### Modified
```
src/app/page.tsx                                 # Refactored data fetching
src/app/feriados/page.tsx                        # Refactored data fetching
src/app/informacion/page.tsx                     # Refactored + honest price
src/app/rutinas/[id]/page.tsx                   # Removed throw, DataResult
src/app/rutinas/[id]/dias/[diaId]/page.tsx      # Removed throw, DataResult
src/app/admin/page.tsx                          # Refactored data fetching
src/components/routines/routine-list.tsx        # Added showError prop
src/components/search/trainer-sidebar-client.tsx # Single source of truth
src/components/admin/GymPriceEditor.tsx          # Handles null price
```

## Verification Results

```
TypeScript Check: ✅ PASSED
No Errors: ✅
No Warnings: ✅
```
