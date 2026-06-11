# Design: Page Loading Overhaul

## Technical Approach

Three route-group `loading.tsx` files (root generic, `(public)` homepage-shaped, `(admin)` admin-shaped) plus 9 page-shaped skeleton components built on a new `Skeleton` UI primitive. Four admin pages stop calling `auth.api.getSession` (parent layout already validates) and use a `React.cache()` wrapper in `src/lib/admin-session.ts`. Two public pages (`/informacion`, `/feriados`) stop self-fetching their own `/api/*` routes and call Prisma directly via 4 new `unstable_cache` readers. Three server actions gain `revalidateTag` calls mirroring the existing `gym.ts:updateGymField` pattern. Hard tech debt: 6 `force-dynamic` flags stay (deferred to the `use cache` follow-up), `cacheComponents: true` stays off, `next.config.ts` untouched.

## Architecture Decisions

### Decision: Route-group `loading.tsx` (3 files) over per-page

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Route-group `loading.tsx` × 3 | 3 files cover 11 pages; minor shape mismatch on detail pages | **Chosen** |
| Per-page `loading.tsx` × 11 | Perfect shapes, 8 more files, 11 Suspense boundaries | **Reject** — duplicates the admin layout shell 8 times |
| Per-route-group + 2 public detail pages | Covers the visible mismatch without 8× duplication | **Chosen** for public detail pages (`rutinas/[id]`, `rutinas/[id]/dias/[diaId]`) — they're 2 pages, not 8 |

**Rationale**: Admin pages all share the same admin-layout shape, so one `loading.tsx` at the route group is enough. Public detail pages have distinct shapes (stat badges + day accordions, exercise card list) that don't match the homepage skeleton — keep these 2 as per-page.

### Decision: `unstable_cache` (Next 15 API) over `use cache` (Next 16)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `use cache` + `cacheTag` | Modern, but requires `cacheComponents: true` in `next.config.ts` (hard constraint: do not touch) | **Reject for now** |
| `unstable_cache` + `revalidateTag` | Works on current Next 15.x; clean migration path documented in proposal's "Tech Debt Inventory" | **Chosen** |

**Rationale**: User explicitly resolved this: use `unstable_cache` now, migrate to `use cache` in the existing ROADMAP follow-up. Proposal § "Tech Debt Inventory" embeds the step-by-step context for that future agent.

### Decision: Session dedup via `React.cache()` (per-request memoization)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `React.cache()` wrapper in `src/lib/admin-session.ts` | Per-request dedup; no global state; one line at the call site | **Chosen** |
| `globalThis.__adminSession` | Works across RSC boundaries, but pollutes global namespace | **Reject** |
| Stash session in React context via client boundary | Forces a client boundary on the layout; breaks RSC | **Reject** |

**Rationale**: The parent layout already validates the session; child pages need `role` for guard logic (`trainers` redirects non-ADMIN, `rutinas` filters by `ownerId` for TRAINER). The wrapper is a no-op for callers — identical to the current `auth.api.getSession` call, just memoized.

### Decision: Reader co-location per entity

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `src/lib/<entity>.ts` for each (feriados, promociones, descuentos-duracion, gym-price) | Symmetric with `src/lib/rutinas.ts`; one file per tag | **Chosen** |
| `src/lib/informacion-readers.ts` (consolidated) | Fewer files, but mixes 4 entities with 4 tags in one place | **Reject** — `rutinas.ts` precedent wins |

**Rationale**: The existing `src/lib/rutinas.ts` already exports `getRutinas`, `getCachedRutinaById`, `getStats` as a unit. Follow the same pattern: `src/lib/feriados.ts` exports both `getFeriadosActivosPublic` (filtered) and `getFeriadosForAdmin` (unfiltered), sharing the `feriados` tag.

## Data Flow

```
URL change → Next.js streams the route group's loading.tsx (skeleton)
     │
     ▼
Layout's data fetch (auth check, gym config) ──► rendering with real data
     │
     ▼
Page-level cached readers (unstable_cache)
     │  getGymPrice (gym-config)         ◄── 60s TTL
     │  getPromociones  (promociones)    ◄── 60s TTL
     │  getDescuentos   (descuentos-duracion) ◄── 60s TTL
     │  getFeriados     (feriados)       ◄── 30s TTL (new-badge freshness)
     │
     ▼
On mutation (server action)
     │  revalidatePath("/admin/promociones") + revalidateTag("promociones")
     │  revalidatePath("/informacion")     + revalidateTag("feriados")
     │  ...
     ▼
Next request: cache miss → re-read DB → repopulate cache
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/skeleton.tsx` | New | `Skeleton` primitive: `<div className={cn("bg-muted animate-pulse rounded", className)} />` |
| `src/components/admin/skeletons/admin-stats-card-skeleton.tsx` | New | Single stat tile (icon + 2 text lines) |
| `src/components/admin/skeletons/admin-stats-grid-skeleton.tsx` | New | 3 of the above |
| `src/components/admin/skeletons/admin-rutinas-table-skeleton.tsx` | New | 5-10 bar rows |
| `src/components/admin/skeletons/admin-feriado-row-skeleton.tsx` | New | Date + 2 action buttons |
| `src/components/admin/skeletons/admin-promocion-card-skeleton.tsx` | New | Title + price + description bars |
| `src/components/admin/skeletons/admin-descuento-row-skeleton.tsx` | New | Meses + percentage bars |
| `src/components/admin/skeletons/admin-trainer-row-skeleton.tsx` | New | Name + role + action buttons |
| `src/components/admin/skeletons/admin-config-section-skeleton.tsx` | New | Label + input + 4-6 sibling fields |
| `src/components/routines/routine-detail-skeleton.tsx` | New | Header + 3 stat badges + days list |
| `src/components/routines/day-detail-skeleton.tsx` | New | Header + exercise card list |
| `src/components/informacion/informacion-skeleton.tsx` | New | Price tile + 2 collapsibles + hours + address |
| `src/lib/admin-session.ts` | New | `getAdminSession = cache(async () => auth.api.getSession({...}))` |
| `src/lib/gym-price.ts` | New | `getGymPrice` (tag `gym-config`, 60s) — re-uses `getGymConfigForServer` pattern |
| `src/lib/promociones.ts` | New | `getPromocionesActivasPublic` + `getPromocionesForAdmin` (tag `promociones`, 60s) |
| `src/lib/descuentos.ts` | New | `getDescuentosDuracionPublic` + `getDescuentosDuracionForAdmin` (tag `descuentos-duracion`, 60s) |
| `src/lib/feriados.ts` | New | `getFeriadosActivosPublic` + `getFeriadosForAdmin` + `getLatestFeriadoDatePublic` (tag `feriados`, 30s) |
| `src/app/loading.tsx` | Modify | Replace homepage shape with `<DumbbellSpinner size="lg" />` centered |
| `src/app/(public)/loading.tsx` | New | Homepage shape (lifted from current `src/app/loading.tsx`) |
| `src/app/(admin)/loading.tsx` | New | Admin shape (sidebar + PageHeader + main area skeleton) |
| `src/app/(public)/informacion/page.tsx` | Modify | Drop 4 HTTP self-fetches, use cached readers; 5 round-trips → 4 parallel Prisma queries |
| `src/app/(public)/feriados/page.tsx` | Modify | Drop 2 HTTP self-fetches, use `getFeriadosActivosPublic` + `getLatestFeriadoDatePublic` |
| `src/app/(admin)/admin/page.tsx` | Modify | Replace local `getGymPrice` with `getGymPrice` reader (cache hit) |
| `src/app/(admin)/admin/promociones/page.tsx` | Modify | Use `getPromocionesForAdmin` |
| `src/app/(admin)/admin/descuentos-duracion/page.tsx` | Modify | Use `getDescuentosDuracionForAdmin` |
| `src/app/(admin)/admin/feriados/page.tsx` | Modify | Use `getFeriadosForAdmin` |
| `src/app/(admin)/admin/rutinas/page.tsx` | Modify | Drop `auth.api.getSession`, use `getAdminSession` |
| `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` | Modify | Drop `auth.api.getSession`, use `getAdminSession` |
| `src/app/(admin)/admin/trainers/page.tsx` | Modify | Drop `auth.api.getSession`, use `getAdminSession` |
| `src/app/(admin)/admin/config/page.tsx` | Modify | Drop `auth.api.getSession`, use `getAdminSession` |
| `src/app/actions/promociones.ts` | Modify | Add `(revalidateTag as any)("promociones")` × 5 (mirrors `gym.ts:250`) |
| `src/app/actions/descuentos-duracion.ts` | Modify | Add `(revalidateTag as any)("descuentos-duracion")` × 3 |
| `src/app/actions/feriados.ts` | Modify | Add `(revalidateTag as any)("feriados")` × 3 |

**Total**: 19 new + 16 modified = 35 files. ~1050 lines net.

## Interfaces / Contracts

```ts
// src/components/ui/skeleton.tsx
export function Skeleton({ className, ...props }: SkeletonProps): JSX.Element;

// src/lib/admin-session.ts
export const getAdminSession: () => Promise<Session | null>;

// src/lib/gym-price.ts
export const getGymPrice: () => Promise<number | null>;
// (tag: "gym-config", revalidate: 60)

// src/lib/promociones.ts
export const getPromocionesActivasPublic: () => Promise<Promocion[]>;
export const getPromocionesForAdmin: () => Promise<Promocion[]>;
// (tag: "promociones", revalidate: 60)

// src/lib/descuentos.ts
export const getDescuentosDuracionPublic: () => Promise<DescuentoDuracion[]>;
export const getDescuentosDuracionForAdmin: () => Promise<DescuentoDuracion[]>;
// (tag: "descuentos-duracion", revalidate: 60)

// src/lib/feriados.ts
export const getFeriadosActivosPublic: () => Promise<Feriado[]>;
export const getFeriadosForAdmin: () => Promise<Feriado[]>;
export const getLatestFeriadoDatePublic: () => Promise<string | null>;
// (tag: "feriados", revalidate: 30 — freshness for "new" badge)
```

## Caching & Revalidation

- `unstable_cache(..., { tags: ["<entity>"], revalidate: N })` for all 5 new readers
- Mutations in `actions/{promociones,descuentos-duracion,feriados}.ts` call BOTH `revalidatePath` (existing) + `revalidateTag` (new) — pattern is identical to `actions/gym.ts:updateGymField:250`
- `force-dynamic` flags on 6 admin pages stay (tech debt for the `use cache` follow-up; cache hit-rate is gated by `force-dynamic`, but the refactor still removes redundant DB round-trips and HTTP waterfalls)
- `cacheComponents: true` stays off (hard constraint)

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| **Unit** | `Skeleton` primitive | None (visual; smoke tested via E2E) |
| **Unit** | Cached readers | None (thin `unstable_cache` wrappers; underlying Prisma calls unchanged) |
| **E2E** | Root loading rewrite — no homepage-shaped cards on auth-gate redirect | Playwright: hit `/admin/rutinas` while unauthed, expect generic spinner before redirect |
| **E2E** | Admin page-shaped skeleton visible briefly | Playwright: throttle DB, navigate to `/admin/promociones`, assert skeleton DOM |
| **E2E** | Public detail page-shaped skeleton | Playwright: navigate to `/rutinas/<id>`, assert stat-badge + day-accordion skeleton |
| **E2E** | `informacion` no longer self-fetches | Playwright: network trace — zero requests to `/api/feriados|promociones|descuentos-duracion|gym` on `/informacion` |
| **E2E** | 3 server-action revalidateTag calls work end-to-end | Playwright: create promocion → `/informacion` reflects it (cache invalidated) |
| **E2E** | Existing 11 E2E specs stay green | Playwright regression |

## Migration / Rollout

3 chained slices, joint push (same pattern as `gym-hours-structured`):

- **Slice 1 (Foundation)** — `Skeleton` primitive + 8 admin skeletons + `admin/loading.tsx` + rewrite root `loading.tsx` to generic spinner. No refactors; safe drop-in. ~350 lines.
- **Slice 2 (Admin refactor)** — `admin-session.ts` helper + drop 4 redundant `getSession` calls + 4 new cached readers + `revalidateTag` in 3 action files. ~350 lines.
- **Slice 3 (Public refactor)** — `(public)/loading.tsx` + `(public)/informacion` and `(public)/feriados` drop HTTP self-fetches + 3 new public readers + 3 public detail skeletons + homepage Suspense split for `trainerCounts` + `gymName`. ~350 lines.

**Rollback** (reverse slice order): removing `loading.tsx` files is purely additive (falls back to root). Removing cached readers is equivalent to inline Prisma calls. Removing `revalidateTag` is a no-op when the readers aren't in use. Removing `getAdminSession` is a no-op for callers (equivalent to the old `auth.api.getSession` direct call).

## Open Questions

- [x] All decisions resolved in the orchestrator prompt (caching API, `force-dynamic` strategy, loading strategy, `next.config.ts` untouched, hard constraint on visible loading state).
- [ ] **Cascade order within Slice 2**: should `admin-session.ts` land in the same commit as the first page drop, or its own commit? Default: own commit, then per-page drops in separate commits.
- [ ] **`gym-price.ts` location**: separate file (`src/lib/gym-price.ts`) vs. co-locating in `src/app/actions/gym.ts`. Proposal says separate file. The price is part of the `Gym` config reader (`getGymConfigForServer` already returns it). Decision pending: extract a `getGymPrice` wrapper or call `getGymConfigForServer().then(g => Number(g?.price))` inline. **Recommended**: dedicated `getGymPrice` in `src/lib/gym-price.ts` for symmetry and one-tag invalidation clarity.
