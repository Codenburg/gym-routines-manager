# Tasks: Homepage UI MVP

## Phase 1: Infrastructure / Foundation

- [x] 1.1 Create `app/api/rutinas/route.ts` — GET endpoint returning all rutinas, accepts optional `search` query param for case-insensitive filtering by nombre
- [x] 1.2 Test API route: `curl GET /api/rutinas` returns all rutinas (manual verification)

## Phase 2: Core Implementation

### UI Layer — Atomic Components
- [x] 2.1 Create `components/ui/card.tsx` — Atomic Card component with proper Tailwind styling and base props
- [x] 2.2 Create `components/ui/input.tsx` — Atomic Input component with proper Tailwind styling

### Domain Layer — Routine Components
- [x] 2.3 Create `components/routines/routine-card.tsx` — Displays routine: nombre, tipo (badge), descripcion (optional), diasCount, with hover state
- [x] 2.4 Create `components/routines/routine-list.tsx` — Responsive grid: 1 col mobile, 2 col tablet (≥640px), 3 col desktop (≥1024px), handles empty state

### Feature Layer — Search Component
- [x] 2.5 Create `components/search/search-bar.tsx` — Form with GET submission, updates URL `?search=term`, handles empty submit to clear filter, shows placeholder text

## Phase 3: Integration / Wiring

- [x] 3.1 Modify `app/page.tsx` — Replace boilerplate with Server Component that fetches from `/api/rutinas` using React 19 `use()` hook, accepts searchParams prop, renders SearchBar and RoutineList
- [x] 3.2 Modify `app/layout.tsx` — Update metadata: title="Gym Routines Manager", description with app purpose
- [x] 3.3 Create `app/loading.tsx` — Suspense fallback with skeleton cards matching RoutineCard layout (3-6 skeletons), same grid structure as RoutineList

## Phase 4: Testing / Verification

### API Route Tests
- [ ] 4.1 Test: `GET /api/rutinas?search=Push` filters by name (case-insensitive)
- [ ] 4.2 Test: `GET /api/rutinas?search=nonexistent` returns empty array `[]`
- [ ] 4.3 Test: `GET /api/rutinas?search=` (empty) returns all rutinas
- [ ] 4.4 Test: Simulate DB failure, verify returns 500 with error message

### Component Visual Verification
- [ ] 4.5 Verify RoutineCard displays all fields (nombre, tipo badge, descripcion, X días)
- [ ] 4.6 Verify RoutineCard handles missing description (no empty field shown)
- [ ] 4.7 Verify RoutineCard hover state is visible
- [ ] 4.8 Verify RoutineList responsive: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] 4.9 Verify RoutineList empty state shows appropriate message

### Search Flow Tests
- [ ] 4.10 Test: Type "Chest", submit, verify URL updates to `?search=Chest`
- [ ] 4.11 Test: Submit empty search, verify URL removes search param and shows full list
- [ ] 4.12 Test: Search preserves value in input field after page refresh

### Page Integration Tests
- [ ] 4.13 Verify homepage loads all routines on initial visit
- [ ] 4.14 Verify homepage loads filtered results from URL (`/?search=Legs`)
- [ ] 4.15 Test loading state: enable network throttling, verify skeleton cards appear during fetch

## Phase 5: Cleanup (if needed)

- [ ] 5.1 Review: Ensure no console errors or terminal errors during build/dev
- [ ] 5.2 Polish: Verify consistent typography and spacing across components

---

## Implementation Order Rationale

1. **Phase 1 first**: API route is the data source — components depend on it
2. **Phase 2 second**: Build components in dependency order: atomic → domain → feature
3. **Phase 3 third**: Wire everything together in the page
4. **Phase 4 last**: Test each component in isolation, then test integration

## Dependencies

- Prisma schema already contains `Rutina` and `Dia` models (verified from spec)
- `lib/prisma.ts` already exists (NOT a new file to create)
- Seed data required for visible results (out of scope for this change)
