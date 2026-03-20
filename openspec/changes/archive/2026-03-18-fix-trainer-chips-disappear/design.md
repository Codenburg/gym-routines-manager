# Design: Fix Trainer Chips Disappearing Bug

## Architecture Decision

### Problem

The current data flow incorrectly derives the trainer list from already-filtered routines:

```
page.tsx (旧):
const rutinasResult = await getCachedRutinas(search, trainers);  // Trainer filter applied
const trainersData = extractTrainers(rutinasResult.data);       // Derived from filtered
```

This means when you filter by "Nando", the trainer list only contains "Nando".

### Solution

Modify `getCachedRutinas` to return a new structure separating stable trainer data from filtered rutinas:

```typescript
// New return type in rutinas.ts
interface RutinasYTrainersResult {
  rutinas: Rutina[];      // Filtered for display
  trainers: Trainer[];    // ALL trainers (stable for chips)
  error: boolean;
}
```

### Data Flow (New)

```
┌─────────────────────────────────────────────────────────────────┐
│  getCachedRutinas(search, trainers)                            │
│                                                                 │
│  QUERY 1 (no trainer filter):                                  │
│    SELECT creador FROM rutinas                                  │
│    → extractTrainers() → ALL trainers (stable)                 │
│                                                                 │
│  QUERY 2 (with filters):                                       │
│    SELECT * FROM rutinas WHERE nombre ILIKE %search%           │
│                    AND creador IN (trainers)                    │
│    → Filtered rutinas for display                              │
│                                                                 │
│  Returns: { rutinas, trainers, error }                          │
└─────────────────────────────────────────────────────────────────┘

page.tsx:
  TrainerSidebarClient → trainers={result.trainers}  ← ALWAYS ALL
  RoutineList           → rutinas={result.rutinas}   ← FILTERED
```

## Files Changed

### `src/lib/rutinas.ts`

1. Export interfaces: `Rutina`, `Trainer`, `Dia`, `Ejercicio`
2. Add `extractTrainers()` function
3. Create `RutinasYTrainersResult` interface
4. Modify `fetchRutinasFromDb` to:
   - Query ALL trainers first (unfiltered)
   - Query filtered rutinas second
   - Return combined result

### `src/app/page.tsx`

1. Remove local `extractTrainers` function
2. Remove local `Rutina`/`Trainer` interfaces
3. Change to use `result.trainers` and `result.rutinas` directly
4. Update `RoutineListWrapper` to accept `rutinas[]` and `error` directly

## Implementation Notes

- Two separate Prisma queries are required (no way around this for stable trainer list)
- First query uses `select: { creador: true }` for efficiency (no need for full data)
- Second query includes full rutina data with dias and ejercicios
- Error handling returns empty arrays with `error: true`
