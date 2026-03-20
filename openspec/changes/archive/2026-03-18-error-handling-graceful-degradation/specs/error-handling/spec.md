# Spec: Error Handling with Graceful Degradation

## Overview

This spec defines the error handling architecture for data fetching operations. It establishes the `DataResult<T>` pattern as the single source of truth for all UI states.

## Data Layer Specification

### DataResult<T> Type

```typescript
interface DataResult<T> {
  data: T;
  error: boolean;
}

function ok<T>(data: T): DataResult<T> {
  return { data, error: false };
}

function err<T>(data: T): DataResult<T> {
  return { data, error: true };
}
```

### Data Fetching Functions Rules

All data fetching functions MUST:

1. **Use try/catch** for all infrastructure operations
2. **Return `DataResult<T>`** instead of throwing exceptions
3. **Never expose internal error details** to the caller
4. **Log errors server-side** using `console.error` with namespace prefix (e.g., `[getRutinas]`)

### Behavior Matrix

| Scenario | Data Returned | `error` flag | Example |
|----------|---------------|--------------|---------|
| Success | Real data | `false` | `ok([{id: 1, nombre: "Rutina A"}])` |
| API error | Empty/default | `true` | `err([])` |
| Network failure | Empty/default | `true` | `err([])` |
| Not found | `null` | `false` | `ok(null)` (not error) |

### Allowed Fallback Values

When `error === true`, functions MAY return:

| Type | Allowed Fallback | Rationale |
|------|------------------|-----------|
| `T[]` | `[]` | Empty array means "no data available" |
| `number \| null` | `null` | Null means "unknown/unavailable" |
| `T \| null` | `null` | Null means "not found" |

### FORBIDDEN Fallback Values

| Type | Forbidden Value | Reason |
|------|-----------------|--------|
| `number` (price) | `45000` | Invented price lies to user |
| `number` (count) | `30` | Invented count is fake data |
| `string` | `"N/A"` | Should use proper error state |

## UI Layer Specification

### Three-State Model

All UI components MUST handle exactly three states:

| State | Condition | Visual Representation |
|-------|-----------|---------------------|
| **Loading** | Data being fetched | Skeleton/spinner placeholder |
| **Error** | `error === true` | "No disponible" / "No se pudieron cargar" |
| **Success** | `error === false && data.length > 0` | Normal data display |
| **Empty** | `error === false && data.length === 0` | "No hay rutinas" |

### State Handling Examples

#### RoutineList Component
```
IF showError === true:
  → Display: "No se pudieron cargar las rutinas" + retry message
  → NO counts, NO cards

IF showError === false AND rutinas.length === 0:
  → Display: "No hay rutinas disponibles" + create prompt

IF showError === false AND rutinas.length > 0:
  → Display: Normal card grid
```

#### TrainerSidebar Component
```
IF hasError === true:
  → Display: "Entrenadores" header + "No disponible" message
  → NO trainer counts

IF hasError === false AND trainers.length === 0:
  → Do not render sidebar

IF hasError === false AND trainers.length > 0:
  → Display: Normal sidebar with trainer list
```

#### PriceSection Component
```
IF priceError === true OR price === null:
  → Display: "Precio" + "No disponible" + AlertCircle icon
  → NO numeric price

IF priceError === false AND price !== null:
  → Display: "Precio" + formatted price + "Abono mensual"
```

## Single Source of Truth

### Homepage State Propagation

The homepage MUST use a single state source for the entire page:

```
getRutinas() → rutinasResult
                ├── rutinasResult.error → controls RoutineList (showError)
                └── extractTrainers(rutinasResult.data) → controls TrainerSidebar (hasError)
```

**CRITICAL**: `getTrainers()` MUST NOT be a separate function with independent state.

### Propagation Rules

1. Parent components fetch and own the `DataResult<T>`
2. Child components receive `data` and `error` (or derived `hasError`) via props
3. Multiple components in the same segment MUST NOT fetch the same resource independently
4. Sidebar MUST derive its state from the same source as main content

## Error Boundaries

### When to Use error.tsx

| Use error.tsx | DO NOT use error.tsx |
|----------------|----------------------|
| Bugs in rendering | DB connection failures |
| Unexpected exceptions | API timeout |
| Uncaught TypeErrors | Network errors |

### Error.tsx Content Guidelines

- Title: Generic ("Algo salió mal")
- Message: Generic user-friendly text
- Actions: Retry button (calls `reset()`)
- NO technical details exposed to user
- NO stack traces or error messages

## File Structure

```
src/
├── lib/
│   └── data-result.ts          # DataResult<T> type definition
├── app/
│   ├── page.tsx                # Homepage: single source of truth
│   ├── error.tsx               # Error boundary for unexpected errors
│   ├── global-error.tsx        # Global fatal error boundary
│   ├── feriados/page.tsx       # Uses DataResult<Feriado[]>
│   ├── informacion/page.tsx     # Uses DataResult<number | null>
│   ├── rutinas/[id]/page.tsx   # Uses DataResult<Rutina | null>
│   ├── rutinas/[id]/dias/[diaId]/page.tsx  # Uses DataResult<Dia | null>
│   └── admin/page.tsx          # Uses DataResult<Stats>, DataResult<number | null>
└── components/
    ├── routines/routine-list.tsx           # Handles showError prop
    └── search/trainer-sidebar-client.tsx  # Handles hasError prop
```

## Acceptance Criteria

### AC1: No Fake Data
```
GIVEN the database is unavailable
WHEN the homepage loads
THEN the sidebar shows "No disponible"
AND the main content shows "No se pudieron cargar las rutinas"
AND no invented counts (like "Todos: 30") are displayed
```

### AC2: Honest Price Display
```
GIVEN the database is unavailable
WHEN the price section loads
THEN the price shows "No disponible"
AND no fallback price like "$45.000 (aproximado)" is displayed
```

### AC3: Consistent State
```
GIVEN the database is unavailable
WHEN the homepage loads
THEN both sidebar and main content show the same error state
AND no mixed states (error in main + counts in sidebar) are possible
```

### AC4: Error Boundary Reserved
```
GIVEN an unexpected bug occurs during render
WHEN error.tsx captures the error
THEN a generic error UI is displayed
AND infrastructure errors (DB down) do NOT trigger error.tsx
```

### AC5: Type Safety
```
GIVEN a data fetching function
WHEN an error occurs
THEN the function returns DataResult<T> with error === true
AND TypeScript enforces error state handling at compile time
```
