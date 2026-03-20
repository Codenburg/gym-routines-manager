# Design: Error Handling with Graceful Degradation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Homepage (page.tsx)                       │
│                                                                 │
│  getRutinas(search, trainers)                                   │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ DataResult<Rutina[]>                                    │    │
│  │ { data: Rutina[], error: boolean }                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ├──────────────────────────────────────┐                 │
│         │                                      │                 │
│         ▼                                      ▼                 │
│  ┌─────────────────────┐    ┌─────────────────────────────┐    │
│  │ RoutineList        │    │ TrainerSidebarClient        │    │
│  │ Props:              │    │ Props:                      │    │
│  │ - rutinas           │    │ - trainers (derived)        │    │
│  │ - showError         │    │ - hasError (same as error)  │    │
│  └─────────────────────┘    └─────────────────────────────┘    │
│                                                                 │
│  SINGLE SOURCE OF TRUTH: rutinasResult.error controls BOTH     │
└─────────────────────────────────────────────────────────────────┘
```

## DataResult<T> Pattern

### Type Definition

```typescript
// src/lib/data-result.ts
export interface DataResult<T> {
  data: T;
  error: boolean;
}

export function ok<T>(data: T): DataResult<T> {
  return { data, error: false };
}

export function err<T>(data: T): DataResult<T> {
  return { data, error: true };
}
```

### Design Rationale

1. **Simple**: Just two properties, no nested complexity
2. **Explicit**: `error` flag makes state unambiguous
3. **Type-safe**: TypeScript enforces handling of both states
4. **Composable**: Can nest `DataResult` in other types

## State Propagation Flow

### Homepage Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. getRutinas(search, trainers)                                 │
│    - Calls API endpoint                                          │
│    - try/catch around fetch                                      │
│    - Returns ok(data) on success                                │
│    - Returns err([]) on failure                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. extractTrainers(rutinasResult.data)                          │
│    - Maps rutinas to trainer counts                              │
│    - Returns Trainer[] derived from routines                     │
│    - Always called, even on error (empty array if error)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Render children with unified state                           │
│    - TrainerSidebarClient(trainers, hasError=rutinasResult.error)│
│    - RoutineListWrapper(rutinasResult)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Implementation Decisions

### Decision 1: Sidebar Derives from Routines, Not Separate API

**Before (Problematic)**:
```typescript
// Two independent sources of truth
const rutinasResult = await getRutinas();      // Could fail
const trainersResult = await getTrainers();     // Could succeed independently
// Result: contradictory states possible
```

**After (Correct)**:
```typescript
// Single source of truth
const rutinasResult = await getRutinas();
const trainersData = extractTrainers(rutinasResult.data);  // Derived, not fetched
// Result: consistent state always
```

### Decision 2: Price Shows "No Disponible" Not Fallback

**Before (Incorrect)**:
```typescript
// Invented fallback value
return err(45000);  // LIES to user!
```

**After (Correct)**:
```typescript
// Honest null
return err(null);   // "We don't know" is honest
```

UI then shows "No disponible" instead of fake price.

### Decision 3: TrainerSidebar Shows Placeholder on Error

**Error State UI**:
```tsx
if (hasError) {
  return (
    <aside className="...">
      <h3>Entrenadores</h3>
      <p>No disponible</p>   {/* Not counts! */}
    </aside>
  );
}
```

**NOT**: "Todos: 30", "Leo: 10" (fake data)

## Module Map

### Data Layer (`src/lib/data-result.ts`)

| Export | Type | Purpose |
|--------|------|---------|
| `DataResult<T>` | Interface | Standard result container |
| `ok<T>()` | Function | Creates success result |
| `err<T>()` | Function | Creates error result |

### Data Fetching Functions

| Function | Location | Returns | Error Fallback |
|----------|----------|---------|----------------|
| `getRutinas()` | `page.tsx` | `DataResult<Rutina[]>` | `err([])` |
| `extractTrainers()` | `page.tsx` | `Trainer[]` | (derived from rutinas) |
| `getFeriados()` | `feriados/page.tsx` | `DataResult<Feriado[]>` | `err([])` |
| `getGymPrice()` | `informacion/page.tsx` | `DataResult<number \| null>` | `err(null)` |
| `getRutina()` | `rutinas/[id]/page.tsx` | `DataResult<Rutina \| null>` | `err(null)` |
| `getDia()` | `rutinas/[id]/dias/[diaId]/page.tsx` | `DataResult<Dia \| null>` | `err(null)` |
| `getStats()` | `admin/page.tsx` | `DataResult<Stats>` | `err({count: 0})` |
| `getGymPrice()` | `admin/page.tsx` | `DataResult<number \| null>` | `err(null)` |

### UI Components

| Component | File | Props | Behavior on Error |
|----------|------|-------|-------------------|
| `RoutineList` | `routine-list.tsx` | `rutinas`, `showError?` | Shows error message |
| `TrainerSidebarClient` | `trainer-sidebar-client.tsx` | `trainers`, `hasError` | Shows "No disponible" |
| `PriceSection` | `informacion/page.tsx` | `price`, `priceError` | Shows "No disponible" |
| `GymPriceEditor` | `GymPriceEditor.tsx` | `initialPrice` (`number \| null`) | Enters edit mode |

## Error Boundary Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ global-error.tsx                                                 │
│ - Catches fatal errors (root layout failures)                   │
│ - Full-screen overlay with <html><body>                        │
│ - Generic message: "Error inesperado"                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (only for unexpected bugs, not infra errors)
┌─────────────────────────────────────────────────────────────────┐
│ error.tsx (segment-level)                                      │
│ - Catches render errors in homepage segment                    │
│ - Generic message: "Algo salió mal"                           │
│ - Does NOT catch: DB failures, network errors (handled by UI)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (infrastructure errors never reach here)
┌─────────────────────────────────────────────────────────────────┐
│ Data Layer (getRutinas, etc.)                                  │
│ - try/catch returns { data, error: true }                       │
│ - console.error for server-side logging                         │
│ - NO exceptions thrown                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: Homepage Load with DB Failure

```
User                  Browser                  Server                 DB
 │                      │                       │                      │
 │  GET /               │                       │                      │
 │─────────────────────>│                       │                      │
 │                      │                       │                      │
 │                      │  page.tsx             │                      │
 │                      │    getRutinas()      │                      │
 │                      │─────────────────────>│                      │
 │                      │                       │                      │
 │                      │                       │  SELECT *            │
 │                      │                       │─────────────────────>│
 │                      │                       │                      │
 │                      │                       │  CONNECTION REFUSED  │
 │                      │                       │<─────────────────────│
 │                      │                       │                      │
 │                      │                       │  catch { err([]) }   │
 │                      │                       │◀─────────────────────│
 │                      │                       │                      │
 │                      │  <div>                │                      │
 │                      │    <TrainerSidebar   │                      │
 │                      │      hasError=true/> │                      │
 │                      │    <RoutineList      │                      │
 │                      │      showError=true/>│                      │
 │                      │                       │                      │
 │  200 OK (HTML)       │                       │                      │
 │<─────────────────────│                       │                      │
 │                      │                       │                      │
 │  Render: "No se      │                       │                      │
 │  pudieron cargar"     │                       │                      │
 │  + sidebar shows     │                       │                      │
 │  "No disponible"    │                       │                      │
```

## Verification Checklist

- [ ] TypeScript compiles without errors
- [ ] `getRutinas()` returns `DataResult<Rutina[]>`
- [ ] `getTrainers()` NOT called separately on homepage
- [ ] `extractTrainers()` derives trainers from rutinas data
- [ ] `rutinasResult.error` passed to both sidebar and content
- [ ] Price shows "No disponible" not `$45.000 (aproximado)`
- [ ] Sidebar shows "No disponible" not "Todos: 30"
- [ ] `error.tsx` NOT triggered by DB failures
