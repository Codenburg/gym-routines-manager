# Proposal: Page Loading Overhaul

## Intent

The current page-loading UX is **homogeneous and wrong-shaped**: the only `loading.tsx` is `src/app/loading.tsx`, hard-wired to the homepage layout (header + search + trainer pills + 6-card grid). Every route falls back to it — admin pages, detail pages, `/informacion`, `/feriados`, and the auth gate — so the user sees a routine-card skeleton flash before the admin layout kicks in, or before the redirect to `/admin/login`.

This change introduces **route-group-level loading** (3 files: root generic, `(public)` homepage-shape, `(admin)` admin-shape) with **page-shaped skeletons** so each route shows a skeleton that matches its destination. It also adds a **`Skeleton` UI primitive** + 9 page-shaped skeleton components, dedupes `auth.api.getSession` in 4 admin pages via a `React.cache()` wrapper in `src/lib/admin-session.ts`, refactors `informacion` and `feriados` to **stop self-fetching their own API routes** and call Prisma directly, and wraps server-action reads in `unstable_cache` with `revalidateTag` for invalidation.

**Hard constraint**: every page must have a visible loading state.

## Scope

### In Scope
- 1 new `Skeleton` primitive: `src/components/ui/skeleton.tsx`
- 9 new page-shaped skeleton components (`admin/dashboard-skeleton`, `admin/rutinas-table-skeleton`, `admin/feriados-skeleton`, `admin/promociones-skeleton`, `admin/descuentos-skeleton`, `admin/trainers-skeleton`, `admin/config-skeleton`, `informacion/informacion-skeleton`, `routines/detail-skeleton`)
- 3 new `loading.tsx` files at route group level: `src/app/loading.tsx` (rewrite → generic `DumbbellSpinner`), `src/app/(public)/loading.tsx` (homepage-shape), `src/app/(admin)/admin/loading.tsx` (admin-shape)
- 1 new `src/lib/admin-session.ts` helper using `React.cache()` to dedupe session reads
- 1 refactor: `(public)/informacion/page.tsx` — drop 4 HTTP self-fetches, call Prisma directly
- 1 refactor: `(public)/feriados/page.tsx` — drop 2 HTTP self-fetches, call Prisma directly
- 1 refactor: drop redundant `auth.api.getSession` in 4 admin pages (rutinas, rutinas/[id]/dias/[diaId], trainers, config) — use the cached wrapper
- 3 new cached readers in `src/lib/` (3 NEW files, `unstable_cache` + tags):
  - `getFeriadosActivosPublic` + `getFeriadosForAdmin` (`src/lib/feriados.ts`, tag `feriados`)
  - `getPromocionesActivasPublic` + `getPromocionesForAdmin` (`src/lib/promociones.ts`, tag `promociones`)
  - `getDescuentosDuracionPublic` + `getDescuentosDuracionForAdmin` (`src/lib/descuentos-duracion.ts`, tag `descuentos-duracion`)
  - `getGymPricePublic` reuses the existing `getGymConfigForServer` (tag `gym-config`)
- `getFeriadosActivosPublic` gets a 30s TTL (not 60s) for "new" badge freshness
- 3 server actions updated to call `revalidateTag` alongside `revalidatePath`: `actions/promociones.ts` (5 calls), `actions/descuentos-duracion.ts` (3 calls), `actions/feriados.ts` (3 calls)
- 1 homepage Suspense split: wrap `trainerCounts` + `gymName` in `<Suspense>` boundaries so the page shell renders immediately

### Out of Scope
- Migrating `unstable_cache` → `use cache` (separate ROADMAP follow-up)
- Removing `force-dynamic` from 6 admin pages (same follow-up)
- New tests for the primitive skeletons (visual testing is the verification)
- Cross-midnight schedules (already out per v0.17.0)
- Multi-gym support (singleton)
- API docs in MDX (separate ROADMAP Alta Prioridad)

## Capabilities

### New Capabilities
(none — extends existing capabilities only)

### Modified Capabilities
- `ui` / `design-system`: add `Skeleton` primitive + 9 page-shaped skeletons
- `homepage`: homepage-shaped `loading.tsx` at route group level
- `admin-panel`: admin-shaped `loading.tsx` at route group level
- `api` (the 3 server actions that now also call `revalidateTag`)
- `gym-config` (the public side that now uses the existing `getGymConfigForServer` for price)

## Approach

**3 chained logical slices, joint push** (same pattern as `gym-hours-structured` — user is sole reviewer):

- **Slice 1 (Foundation)**: `Skeleton` primitive + 4 admin-side skeletons + admin route group `loading.tsx` + rewrite root `loading.tsx` to generic `DumbbellSpinner`
- **Slice 2 (Admin refactor)**: drop redundant `auth.api.getSession` in 4 pages via `admin-session.ts`; replace local `getGymPrice` in `admin/page.tsx` with `getGymConfigForServer`; add 3 cached readers + `revalidateTag` to 3 server actions
- **Slice 3 (Public refactor)**: refactor `informacion` and `feriados` to Prisma direct; add `(public)/loading.tsx`; add homepage Suspense for `trainerCounts` + `gymName`; add 4 public-side skeleton components

Hard constraint: **every page must have a visible loading state** so the user never feels the page hangs.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/ui/skeleton.tsx` | New | `Skeleton` primitive (an `animate-pulse bg-muted rounded` wrapper) |
| `src/components/admin/dashboard-skeleton.tsx` | New | 3 stat cards + 6 recent-routine cards |
| `src/components/admin/rutinas-table-skeleton.tsx` | New | PageHeader + 6-card grid (reuses `RoutineListSkeleton`) |
| `src/components/admin/feriados-skeleton.tsx` | New | PageHeader + 6 feriado rows |
| `src/components/admin/promociones-skeleton.tsx` | New | PageHeader + 4 promo cards |
| `src/components/admin/descuentos-skeleton.tsx` | New | PageHeader + 4 discount rows |
| `src/components/admin/trainers-skeleton.tsx` | New | PageHeader + 4 trainer rows |
| `src/components/admin/config-skeleton.tsx` | New | PageHeader + 6 form field skeletons |
| `src/components/informacion/informacion-skeleton.tsx` | New | 6 section skeletons (price, promos, discounts, hours, address, social) |
| `src/components/routines/detail-skeleton.tsx` | New | Stat badges + 3 day accordions |
| `src/app/loading.tsx` | Modified | Rewrite to generic `DumbbellSpinner` |
| `src/app/(public)/loading.tsx` | New | Homepage-shape: header + search + trainer pills + 6-card grid |
| `src/app/(admin)/admin/loading.tsx` | New | Admin-shape: sidebar + PageHeader + dashboard skeleton |
| `src/lib/admin-session.ts` | New | `React.cache()` wrapper for `auth.api.getSession` |
| `src/lib/feriados.ts` | New | 2 readers, tag `feriados` |
| `src/lib/promociones.ts` | New | 2 readers, tag `promociones` |
| `src/lib/descuentos-duracion.ts` | New | 2 readers, tag `descuentos-duracion` |
| `src/app/(public)/informacion/page.tsx` | Modified | Drop 4 HTTP self-fetches, use cached readers |
| `src/app/(public)/feriados/page.tsx` | Modified | Drop 2 HTTP self-fetches, use cached readers |
| `src/app/(public)/page.tsx` | Modified | Wrap `trainerCounts` + `gymName` in `<Suspense>` |
| `src/app/(admin)/admin/rutinas/page.tsx` | Modified | Drop `auth.api.getSession`, use `getAdminSession` |
| `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` | Modified | Same as above |
| `src/app/(admin)/admin/trainers/page.tsx` | Modified | Same as above |
| `src/app/(admin)/admin/config/page.tsx` | Modified | Same as above |
| `src/app/actions/promociones.ts` | Modified | Add `(revalidateTag as any)("promociones")` to 5 mutations |
| `src/app/actions/descuentos-duracion.ts` | Modified | Add `(revalidateTag as any)("descuentos-duracion")` to 3 mutations |
| `src/app/actions/feriados.ts` | Modified | Add `(revalidateTag as any)("feriados")` to 3 mutations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `unstable_cache` under `force-dynamic` is wasted (no cache hits) | Med | Acknowledged tech debt. `force-dynamic` removal is the same follow-up as `unstable_cache` → `use cache` migration. |
| `revalidateTag` for new tags only called from server actions, not from API route handlers | Low | API routes are GET-only (mutations go through actions). If a PATCH route is added later, it must also call `revalidateTag`. |
| Switching `informacion` from HTTP to Prisma direct changes the failure mode (DB outage fails the page, not the API) | Low | Each reader wrapped in try/catch; section renders nothing on error. Same graceful degradation as today. |
| Generic spinner at root feels too generic between Slice 1 and Slice 3 | Low | Slice 3 adds `(public)/loading.tsx` homepage-shape, restoring the homepage UX. |
| `React.cache()` per-request memoization may not apply across RSC boundaries | Low | `React.cache()` shares the cache within a single request. If a boundary crosses, the second call is harmless (deduped at `unstable_cache` level by other readers). |
| `getFeriadosActivosPublic` 30s TTL — `mark-as-seen` relies on freshness | Low | 30s staleness is fine: the user is on the page for tens of seconds, so the "new" badge UX is unaffected. |

## Rollback Plan

3-step rollback in reverse slice order (Slice 3 → Slice 2 → Slice 1). Each slice is a logical group of commits and reverts independently:
- Removing the new `admin-session.ts` wrapper has no behavior change (callers used `auth.api.getSession` and now use the wrapper, which is equivalent).
- Removing the new `loading.tsx` files is purely additive — the app falls back to the current behavior (root loading).
- Removing the cached readers is equivalent to calling Prisma directly inline (revert the imports).
- Removing the `revalidateTag` calls has no behavior change (the `revalidatePath` calls still work; the tag invalidation is a no-op for readers that don't use it).

## Dependencies

- Existing `DumbbellSpinner` (generic root loading fallback)
- Existing `RoutineListSkeleton` (still the homepage grid base)
- Existing cached readers: `getGymConfigForServer`, `getRutinas`, `getCachedRutinaById`, `getStats`, `getGymDisplayForServer`
- Existing `cn` utility in `src/lib/utils.ts`
- Existing `resolveGymName` from `src/lib/gym-display.ts`
- Existing `auth.api.getSession` (Better Auth)

## Performance & Breaking Changes

- **Bundle size**: Negligible — small primitive + 9 small skeleton components
- **Perceived performance**: Major win — every page shows a page-shaped skeleton
- **Real performance**: Minor win — `informacion` drops 4 HTTP round-trips to 1 Prisma query; `feriados` drops 2 to 1; admin pages drop redundant session checks
- **Breaking changes**: None. New `loading.tsx` files are additive; new cached readers are equivalent to their uncached counterparts; `admin-session.ts` wrapper is a no-op for callers

## Success Criteria

- [ ] Every page in the app shows a visible loading state on navigation (no "blank" flashes)
- [ ] Admin pages show an admin-shaped skeleton (not a routine-card grid)
- [ ] Public detail pages show a detail-shaped skeleton
- [ ] `informacion` page no longer self-fetches its own API
- [ ] 4 admin pages no longer make redundant `auth.api.getSession` calls
- [ ] 3 server actions call `revalidateTag` alongside `revalidatePath`
- [ ] 3 new cached readers (feriados, promociones, descuentos) + 1 reused (`getGymConfigForServer`) all wrapped in `unstable_cache` with tags
- [ ] Build clean, all existing tests pass (101/101 unit + 11/11 E2E)
- [ ] Manual smoke: navigate between 5+ routes and observe correct skeletons

## Note (v1 update — explicit tech debt)

Caching uses `unstable_cache` (legacy Next 15 API) instead of `use cache` (Next 16 recommended). The 6 `force-dynamic` flags on admin pages are also kept. Both are scheduled to be addressed together in the existing ROADMAP follow-up "Migrate `unstable_cache` → `use cache` (Next 16 Cache Components)" — when that follow-up runs, it will (a) enable `cacheComponents: true`, (b) rewrite all readers to `use cache`, (c) remove the 6 `force-dynamic` flags, and (d) validate `revalidateTag` covers all invalidation paths.

## Tech Debt Inventory (for the follow-up agent)

When the future SDD change "migrate-unstable-cache-to-use-cache" runs, here is the concrete inventory of what needs to be migrated. This list was written by the agent that delivered `page-loading-overhaul` for the agent that will do the migration.

### `unstable_cache` readers introduced in this change (and their tag conventions)

| Reader | File | Tag | TTL | Invalidated by |
|--------|------|-----|-----|----------------|
| `getGymPrice` | `src/lib/gym-price.ts` (new) | `gym-config` | 60s | `actions/gym.ts:updateGymField` (revalidateTag already there) |
| `getPromociones` | `src/lib/promociones.ts` (new) | `promociones` | 60s | `actions/promociones.ts` (add `revalidateTag("promociones")` alongside `revalidatePath`) |
| `getDescuentos` | `src/lib/descuentos.ts` (new) | `descuentos-duracion` | 60s | `actions/descuentos-duracion.ts` (add `revalidateTag("descuentos-duracion")`) |
| `getFeriados` | (added to existing `src/lib/feriados.ts` if exists, or new file) | `feriados` | **30s** (not 60s — used for "new" badge freshness on home notification) | `actions/feriados.ts` (add `revalidateTag("feriados")`) |

### Pre-existing `unstable_cache` readers (out of scope of this change, but in the same migration)

| Reader | File | Tag | TTL | Note |
|--------|------|-----|-----|------|
| `getGymConfigForServer` | `src/app/actions/gym.ts` | `gym-config` | 60s | Already wired with `revalidateTag` in `updateGymField` |
| `getGymDisplayForServer` | `src/app/actions/gym.ts` | `gym-config` | 60s | New in `gym-hours-structured` (v0.17.0) |
| `getRoutinesPaginated` | `src/services/routines/pagination.ts` | `rutinas` | 30s | Home page list |
| `getTrainerCounts` | `src/services/routines/pagination.ts` | `rutinas` | 30s | Home page trainer pills |
| `getRutinas` | `src/app/actions/rutinas.ts` (or similar) | `rutinas` | 60s | Admin rutinas list |
| `getCachedRutinaById` | (lib) | `rutinas` | 60s | Public detail + admin edit |
| `getStats` | `src/services/admin/stats.ts` (or similar) | `rutinas` | 60s | Admin dashboard stats |

### `force-dynamic` flags to remove (and why)

6 admin pages set `export const dynamic = "force-dynamic"`:

- `src/app/(admin)/admin/page.tsx` — Dashboard
- `src/app/(admin)/admin/rutinas/page.tsx` — Rutinas list
- `src/app/(admin)/admin/rutinas/[id]/page.tsx` — Edit form
- `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` — Day edit
- `src/app/(admin)/admin/feriados/page.tsx` — Feriados list
- `src/app/(admin)/admin/config/page.tsx` — Gym config

**Why they can be removed safely**:
- All 6 pages use cached readers (`getRutinas`, `getCachedRutinaById`, `getFeriados`, `getGymDisplayForServer`, etc.) which `revalidatePath` + `revalidateTag` cover on writes.
- `force-dynamic` was originally added as a defensive measure but the cache invalidation handles freshness now.
- **Caveat**: an admin creating a routine and immediately navigating to the list page may see stale data for up to 60s. To prevent this, ensure every mutation action calls BOTH `revalidatePath` AND `revalidateTag` (e.g., `createRutina` should call `revalidatePath("/admin/rutinas")` AND `revalidateTag("rutinas")`). Audit the actions in `actions/rutinas.ts`, `actions/feriados.ts`, `actions/promociones.ts`, `actions/descuentos-duracion.ts`, `actions/gym.ts` — verify each mutation calls both.

### Context prompt for the migration agent

> **You are picking up the `migrate-unstable-cache-to-use-cache` SDD change.** Read this entire section first.
>
> **What you're migrating**: The `page-loading-overhaul` change (this file's sibling) introduced 4 new cached readers and 3 new `revalidateTag` calls. The earlier `gym-config-admin` and `gym-hours-structured` changes introduced 7+ more cached readers. The full inventory is in the table above.
>
> **What you need to do**:
> 1. Enable `cacheComponents: true` in `next.config.ts` (currently absent).
> 2. For each `unstable_cache(..., { tags: [...], revalidate: N })` wrapper, replace with a function that has `'use cache'` at the top, calls `cacheTag('the-tag')` inside, and `cacheLife({ revalidate: N })` for the TTL. Use the `next-cache-components` skill for the exact syntax — the migration table in that skill is your reference.
> 3. Remove the 6 `force-dynamic` flags listed above. Verify each removal doesn't break the immediate-freshness-after-write expectation by checking the corresponding server action calls `revalidateTag` (not just `revalidatePath`).
> 4. Add a `cacheLife` to the `getGymConfigForServer` reader if missing — it currently only has `tags` + `revalidate: 60`, which is the old API. In the new API, `cacheLife({ revalidate: 60 })` is what you need.
> 5. Delete any duplicate `unstable_cache` import statements (only `next/cache` is needed for `revalidatePath` + `revalidateTag` after the migration).
> 6. Run `pnpm build` and the full test suite. The build will surface type errors if any reader was missed.
> 7. Update the ROADMAP to mark this follow-up as done.
>
> **What you should NOT do**:
> - Don't touch `src/app/loading.tsx`, the `Skeleton` primitive, or any of the per-page/per-group `loading.tsx` files. Those are UI concerns and are complete.
> - Don't change the `revalidateTag` tag names. The naming convention is `<entity>` (singular, kebab-case) and is consistent with what the rest of the project uses.
> - Don't add NEW `unstable_cache` calls. If you need to cache something new, use `use cache` from the start.
> - Don't change the auth check pattern in `(admin)/admin/layout.tsx` or `src/lib/admin-session.ts`. That's a separate concern.
>
> **Skills to load**: `next-cache-components` (primary), `next-best-practices` (secondary), `prisma` (for any data layer changes), `react-19` (for the `'use cache'` directive's interaction with hooks, which is the main gotcha).
>
> **Risks to flag in your proposal**:
> - `cacheComponents: true` is a project-wide flag. It changes the build's behavior. Surface this as a Medium-severity risk.
> - Some `unstable_cache` readers may have been added in slices where the writer was forgotten (e.g., `getStats` may not have a matching `revalidateTag` in any action). Audit carefully.
> - The `getFeriados` 30s TTL is intentional (new-badge freshness). Don't change it to 60s "for consistency".
