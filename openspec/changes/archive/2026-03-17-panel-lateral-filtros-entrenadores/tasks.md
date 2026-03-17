# Tasks: Panel lateral con filtros de entrenadores

## Phase 1: API Foundation

- [x] 1.1 Create `src/app/api/trainers/route.ts` with GET endpoint returning trainer list with routine counts
- [x] 1.2 Modify `src/app/api/rutinas/route.ts` to add `trainers` query parameter with IN clause filtering

## Phase 2: Hooks & Types

- [x] 2.1 Modify `src/hooks/use-unified-search.ts` to add:
  - `trainerFilters: string[]` state
  - `toggleTrainerFilter(name: string)` function
  - `clearTrainerFilters()` function
  - URL synchronization for `trainers` param
- [ ] 2.2 Update `src/types/search.ts` if needed for new types

## Phase 3: UI Components - Sidebar

- [x] 3.1 Create `src/components/search/trainer-sidebar.tsx`:
  - Props: trainers array, selectedTrainers, onToggle, onClearAll
  - Scrollable list with checkboxes
  - "Todos" option at top
  - Count badges per trainer
- [x] 3.2 Create `src/components/search/active-filter-chips.tsx` or update existing ActiveFilters to handle trainer filters

## Phase 4: UI Components - Search Input

- [x] 4.1 Create `src/components/search/search-input.tsx`:
  - Simple input with search icon
  - Clear button (X)
  - 300ms debounce on change
  - No autocomplete dropdown
- [x] 4.2 Modify `src/components/search/search-bar.tsx` to use SearchInput instead of SearchAutocomplete
- [x] 4.3 Delete `src/components/search/search-autocomplete.tsx` (no longer needed)

## Phase 5: Page Integration

- [x] 5.1 Modify `src/app/page.tsx`:
  - Add `getTrainers()` function calling `/api/trainers`
  - Pass trainers list to TrainerSidebar component
  - Update layout to include sidebar (flex/grid)
  - Integrate with useUnifiedSearch for trainer filters
- [ ] 5.2 Verify routing works: `?search=X&trainers=A,B` updates correctly

## Phase 6: Testing & Verification

- [ ] 6.1 Test `/api/trainers` returns correct data structure
- [ ] 6.2 Test `/api/rutinas?trainers=X` filters correctly
- [ ] 6.3 Verify debounce delays search by ~300ms
- [ ] 6.4 Verify multiple trainer selection shows OR logic
- [ ] 6.5 Verify "Todos" clears all trainer filters
- [ ] 6.6 Verify active filter chips appear and are removable

## Phase 7: Cleanup

- [ ] 7.1 Remove any unused imports or dead code
- [ ] 7.2 Verify ESLint passes with no warnings
- [ ] 7.3 Verify TypeScript compilation succeeds
