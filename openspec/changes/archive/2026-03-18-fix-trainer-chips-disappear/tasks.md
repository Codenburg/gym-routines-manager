# Tasks: Fix Trainer Chips Disappearing Bug

## Implementation Tasks

- [x] Export interfaces from rutinas.ts (Rutina, Trainer, Dia, Ejercicio)
- [x] Add extractTrainers function to rutinas.ts
- [x] Create RutinasYTrainersResult interface
- [x] Modify fetchRutinasFromDb to query trainers separately (unfiltered)
- [x] Modify fetchRutinasFromDb to return { rutinas, trainers, error }
- [x] Update page.tsx to use new return structure
- [x] Remove local extractTrainers from page.tsx
- [x] Update RoutineListWrapper props

## Verification Tasks

- [x] Build passes without errors
- [x] TypeScript compilation succeeds
- [x] All trainer chips visible when filter is active
- [x] Multiple trainer selection works
- [x] Toggle (select/deselect) works without losing chips
- [x] "Todos" clears all filters

## Completed: 8/8 tasks
