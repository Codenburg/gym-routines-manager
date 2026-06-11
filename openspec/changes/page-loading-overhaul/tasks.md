# Tasks: page-loading-overhaul

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Files affected | 19 new + 16 modified = 35 total |
| Estimated changed lines (full change) | ~1050 lines (skeletons + readers + 3 loading.tsx + small refactors) |
| **Slice 1 changed lines** | ~350 lines (under 400 budget) |
| **Slice 2 changed lines** | ~350 lines (under 400 budget) |
| **Slice 3 changed lines** | ~350 lines (under 400 budget) |
| **400-line budget risk** | **Low (per slice)** |
| **Chained PRs recommended** | **Yes (3 logical slices)** |
| **Push strategy** | **All commits pushed together to origin/main** (no admin breakage window) |
| **Delivery strategy** | `stacked-to-main` (resolved at session start) |
| **Decision needed before apply** | **No** — strategy is resolved (chained slices, joint push) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Slice | Notes |
|------|------|-------|-------|
| 1 | Foundation: `Skeleton` primitive + 8 admin skeleton components + admin `loading.tsx` + root rewrite | Slice 1 | Drop-in only, no app-logic changes |
| 2 | Admin refactor: `admin-session.ts` + 4 page session drops + 4 cached readers + 3 action revalidateTag | Slice 2 | Clean abstraction first (`admin-session.ts` own commit) |
| 3 | Public refactor: 3 public skeleton components + `(public)/loading.tsx` + `informacion`/`feriados` refactor | Slice 3 | Drops 4 + 2 HTTP self-fetches, uses cached readers |

## Phase 1: Foundation (Slice 1 of 3)

### 1.1 Skeleton primitive
- [x] Create `src/components/ui/skeleton.tsx` — primitive component, `bg-muted animate-pulse rounded`, accepts className
- [x] Match the existing UI primitive style (uses `cn` from `src/lib/utils.ts`)

### 1.2 Admin route group loading
- [x] Create `src/app/(admin)/loading.tsx` — admin-shaped skeleton (top bar + sidebar + main content area) composing the 1.4 skeleton components

### 1.3 Root loading (replace)
- [x] Modify `src/app/loading.tsx` — replace the homepage-shaped skeleton with a generic `<DumbbellSpinner size="lg" />` centered (last-resort fallback only)

### 1.4 Admin skeleton components
- [x] Create `src/components/admin/skeletons/admin-stats-card-skeleton.tsx` (1 stat tile)
- [x] Create `src/components/admin/skeletons/admin-stats-grid-skeleton.tsx` (3 stats)
- [x] Create `src/components/admin/skeletons/admin-rutinas-table-skeleton.tsx` (5-10 rows)
- [x] Create `src/components/admin/skeletons/admin-feriado-row-skeleton.tsx` (1 row)
- [x] Create `src/components/admin/skeletons/admin-promocion-card-skeleton.tsx` (1 card)
- [x] Create `src/components/admin/skeletons/admin-descuento-row-skeleton.tsx` (1 row)
- [x] Create `src/components/admin/skeletons/admin-trainer-row-skeleton.tsx` (1 row)
- [x] Create `src/components/admin/skeletons/admin-config-section-skeleton.tsx` (label + input)

## Phase 2: Admin refactor (Slice 2 of 3)

### 2.1 Admin session helper (own commit)
- [ ] Create `src/lib/admin-session.ts` — `getAdminSession` wrapped in `React.cache()`, replaces the redundant `auth.api.getSession` calls in 4 admin pages

### 2.2 Drop redundant session checks (4 pages)
- [ ] Modify `src/app/(admin)/admin/rutinas/page.tsx` — drop `auth.api.getSession`, use `getAdminSession` from `src/lib/admin-session.ts`
- [ ] Modify `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` — same
- [ ] Modify `src/app/(admin)/admin/trainers/page.tsx` — same
- [ ] Modify `src/app/(admin)/admin/config/page.tsx` — same

### 2.3 New cached readers (4 readers in `src/lib/`)
- [ ] Create `src/lib/gym-price.ts` — `getGymPrice` with `unstable_cache(..., { tags: ['gym-config'], revalidate: 60 })`
- [ ] Create `src/lib/promociones.ts` — `getPromociones` with `unstable_cache(..., { tags: ['promociones'], revalidate: 60 })`
- [ ] Create `src/lib/descuentos.ts` — `getDescuentos` with `unstable_cache(..., { tags: ['descuentos-duracion'], revalidate: 60 })`
- [ ] Create or extend `src/lib/feriados.ts` — `getFeriados` with `unstable_cache(..., { tags: ['feriados'], revalidate: 30 })` (NOT 60s — "new" badge freshness, see proposal Tech Debt Inventory)

### 2.4 Wire admin pages to use the cached readers
- [ ] Modify `src/app/(admin)/admin/page.tsx` — use `getGymPrice` (cached) instead of uncached Prisma direct
- [ ] Modify `src/app/(admin)/admin/promociones/page.tsx` — use `getPromociones` (cached)
- [ ] Modify `src/app/(admin)/admin/descuentos-duracion/page.tsx` — use `getDescuentos` (cached)
- [ ] Modify `src/app/(admin)/admin/feriados/page.tsx` — use `getFeriados` (cached)

### 2.5 Server action `revalidateTag` additions
- [ ] Modify `src/app/actions/promociones.ts` — add `revalidateTag("promociones")` to every mutation function alongside the existing `revalidatePath`
- [ ] Modify `src/app/actions/descuentos-duracion.ts` — same with `revalidateTag("descuentos-duracion")`
- [ ] Modify `src/app/actions/feriados.ts` — same with `revalidateTag("feriados")`

## Phase 3: Public refactor (Slice 3 of 3)

### 3.1 Public skeleton components
- [ ] Create `src/components/informacion/informacion-skeleton.tsx` (price tile + 2 collapsibles + hours + address)
- [ ] Create `src/components/routines/routine-detail-skeleton.tsx` (header + 3 stat badges + days list)
- [ ] Create `src/components/routines/day-detail-skeleton.tsx` (header + exercise card list)

### 3.2 Public route group loading
- [ ] Create `src/app/(public)/loading.tsx` — homepage-shaped skeleton (header + search + trainer pills + 6 routine-card grid)

### 3.3 Refactor: informacion page
- [ ] Modify `src/app/(public)/informacion/page.tsx` — drop the 4 sequential `fetch('/api/...')` calls; call the new `getGymDisplayForServer` + `getPromociones` + `getDescuentos` + `getFeriados` in `Promise.all` (all cached)
- [ ] Each section wrapped in try/catch so a DB error on one section doesn't break the whole page (graceful degradation)

### 3.4 Refactor: feriados page
- [ ] Modify `src/app/(public)/feriados/page.tsx` — drop the 2 sequential `fetch('/api/...')` calls; call `getFeriados` (the new cached reader) + direct query for latest date in `Promise.all`
- [ ] Keep the existing `<Suspense>` boundary around the list

### 3.5 Optional: Suspense on homepage reads
- [ ] (Decide) Whether to wrap `trainerCounts` and `gymName` in their own `<Suspense>` so the page shell (title, search bar) renders immediately. If both readers are already cached (30s / 60s TTL) and parallel-awaited, the latency is negligible. **Default: skip this** unless the user complains about a 50ms gap.

## Phase 4: Verification (Slice 3 of 3)

### 4.1 Final checks
- [ ] `pnpm lint` — 0 new errors
- [ ] `pnpm tsc --noEmit` — 0 new errors in changed files
- [ ] `pnpm test:unit` — 101/101 still pass (no new tests for skeletons; visual verification)
- [ ] `pnpm test tests/gym-config.spec.ts` — 10/11 still pass
- [ ] `pnpm build` — clean
- [ ] Manual smoke: navigate between 5+ routes (homepage, detail, admin dashboard, admin rutinas, informacion, feriados) and verify each shows the correct skeleton during the transition
- [ ] Manual smoke: `pnpm prisma studio` and verify the cache tags (`gym-config`, `promociones`, `descuentos-duracion`, `feriados`) work as expected (mutate a row, navigate to the admin page, see fresh data within 1s)

## Hard Constraints (must appear in every relevant task's acceptance criteria)

1. **No specific gym brand name as fallback** (inherited from `gym-config-admin` v0.16.0) — `rg "Champion Gym" src/` returns 0 matches.
2. **Every page has a visible loading state** — no page is left without `loading.tsx` (root) or route-group coverage.
3. **All new cached readers use `unstable_cache` + `tags` + `revalidate`** (tech debt, scheduled for migration in ROADMAP follow-up).
4. **All server action mutations call BOTH `revalidatePath` and `revalidateTag`** for the relevant tag.
5. **`getFeriados` TTL is 30s, not 60s** — used for "new" badge freshness. Documented in proposal Tech Debt Inventory.
6. **No touching `next.config.ts`** — `cacheComponents: true` stays off.
7. **The 6 `force-dynamic` flags stay** — scheduled for removal in the same follow-up as the cache migration.
8. **Existing price config functionality must remain untouched and fully functional.**
9. **The `admin-session.ts` wrapper is a no-op for callers** that already had `auth.api.getSession` — the dedup happens at the `React.cache()` level.

## Out of Scope (explicit non-goals)

- Migrating `unstable_cache` → `use cache` (separate ROADMAP follow-up)
- Removing the 6 `force-dynamic` flags (same follow-up)
- New tests for the `Skeleton` primitive (visual; smoke test only)
- Documenting the API in MDX (separate ROADMAP Alta Prioridad)
- Cross-midnight schedules (out of scope per v0.17.0)
- Multi-gym support (singleton)
- I18n for loading text (Spanish is fine for v1)
