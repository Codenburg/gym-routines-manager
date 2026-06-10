# Tasks: gym-config-admin

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600-800 lines (3 new files + 16 modified + 2 test files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |
| Files affected | 19 (3 new + 16 modified) + 2 test files = 21 total |
| Suggested split | Slice 1 (Foundation) → Slice 2 (Admin page) → Slice 3 (Public consumers) → Slice 4 (Verification) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Chained PR Slices

| Slice | Goal | Phases | Status | Approx. Lines | Base branch |
|-------|------|--------|--------|---------------|-------------|
| 1 | Foundation: data model + API + server action + schema tests | Phase 1 + Phase 2 | DONE (6 commits) | ~150-200 | main (or feature tracker) |
| 2 | Admin config page + sidebar nav | Phase 3 | DONE (5 commits) | ~430 | slice 1 |
| 3 | Public consumers (layout, loading, pages, info sections) | Phase 4 | PENDING | ~200-300 | slice 2 |
| 4 | E2E verification + final cleanup | Phase 5 | PENDING | ~100-200 | slice 3 |

Each slice includes its own verification and tests.

---

## Phase 1: Foundation (Data + API)

- [x] 1.1 Extend `prisma/schema.prisma` Gym model with 6 nullable `String?` fields (`nombre`, `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`); run `prisma migrate dev --name add_gym_display_fields`.
- [x] 1.2 Update `prisma/seed.ts` to default the new fields to `null` (do NOT hardcode any brand string).
- [x] 1.3 Extend `getGymConfigForServer` in `src/app/actions/gym.ts` with `unstable_cache` (key `["gym-config"]`, tags `["gym-config"]`, 60s revalidate); export new `GymDisplay` type.
- [x] 1.4 Extend GET `/api/gym` response shape in `src/app/api/gym/route.ts` to include the 6 new fields (return `null` until set); keep PATCH price-only.
- [x] 1.5 Add `gymFieldSchema` (discriminated union) and `GymField` type in `src/lib/schemas.ts` — URL validators for `mapsEmbedUrl`/`socialInstagram`/`socialWhatsapp`; `min(1).max(N)` for string fields.

## Phase 2: Server Action

- [x] 2.1 Add `updateGymField(prevState, formData)` server action in `src/app/actions/gym.ts`: `verifyAdmin` → Zod parse → `prisma.gym.update` → `revalidateTag("gym-config")` + `revalidatePath` for `/`, `/informacion`, `/admin`; returns `FormState<{ field, value }>`.
- [x] 2.2 Add Vitest unit tests in `tests/unit/gym-field-schema.test.ts`: each field valid case, empty `nombre` rejected, non-URL rejected for URL fields, unknown discriminant rejected.

## Phase 3: Admin Config Page

- [x] 3.1 Create `src/app/(admin)/admin/config/page.tsx` (Server Component, `export const dynamic = "force-dynamic"`, auth-guarded by parent layout) — fetch `getGymConfigForServer()`, pass `initial` props to `GymConfigManager`. Admin-only via `isAdmin(session)` check; TRAINER redirected to /admin/rutinas (mirrors trainers/page.tsx pattern).
- [x] 3.2 Create `src/components/admin/GymConfigManager.tsx` (Client Component) — 4 sub-forms (Identity / Horario / Ubicación / Redes) each using `useActionState(updateGymField, …)`; uses `AdminCard` + `AdminFormField` + `Button` + `DumbbellSpinner` primitives; toast on success; follows `GymPriceEditor` pattern. Refactored to declarative `FieldConfig` + shared `FieldSubForm` shell + `useGymFieldForm` hook (no duplication).
- [x] 3.3 Add "Configuración" entry to `src/components/admin/admin-sidebar.tsx` nav (with admin role filter), pointing to `/admin/config`. Filter refactored to declarative `adminOnly: true` flag.
- [x] 3.4 Verify admin-only access: TRAINER → redirect to /admin/rutinas (page-level guard); unauthenticated → redirect to `/admin/login` (parent layout). E2E coverage deferred to Slice 4.

## Phase 4: Layout + Public Consumers

- [ ] 4.1 Convert `src/app/layout.tsx` from static `metadata` to `generateMetadata()`; resolve name via `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain. NO hardcoded specific brand string.
- [ ] 4.2 Update `src/app/loading.tsx` to use the same `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain.
- [ ] 4.3 Update `src/app/(public)/page.tsx` to fetch gym name via `getGymConfigForServer()` and apply fallback chain.
- [ ] 4.4 Update `src/app/(auth)/admin/login/page.tsx` to use `process.env.NEXT_PUBLIC_GYM_NAME ?? "Gimnasio"` (NO DB read — Client Component).
- [ ] 4.5 Update `src/components/admin/admin-sidebar.tsx` to accept `gymName: string` prop; remove any hardcoded literal.
- [ ] 4.6 Update `src/app/(admin)/admin/layout.tsx` to fetch gym name and pass to `AdminLayoutComponent`; update `src/components/admin/admin-layout.tsx` to forward the `gymName` prop to `AdminSidebar`.
- [ ] 4.7 Update `src/app/(public)/informacion/page.tsx` to fetch expanded gym config and pass as props to child sections.
- [ ] 4.8 Refactor `src/components/informacion/HoursSection.tsx` to accept `horario: string | null` prop; hide section when null.
- [ ] 4.9 Refactor `src/components/informacion/AddressSection.tsx` to accept `direccion: string | null`, `mapsEmbedUrl: string | null` props; hide section when either is null.
- [ ] 4.10 Refactor `src/components/informacion/SocialLinksSection.tsx` to accept `socialInstagram: string | null`, `socialWhatsapp: string | null` props; render only non-null buttons.
- [ ] 4.11 Add `.env.example` entry documenting `NEXT_PUBLIC_GYM_NAME`.

## Phase 5: Verification

- [ ] 5.1 E2E (Playwright): admin flow — login → `/admin/config` → edit each field group → save → verify public pages (`/`, `/informacion`, `/admin` sidebar) reflect new values.
- [ ] 5.2 E2E (Playwright): fallback chain — with DB `nombre=null`, `/` shows env var; with both DB and env unavailable, shows generic "Gimnasio" (never another client's brand). Use env override.
- [ ] 5.3 E2E (Playwright): auth gate — hitting `/admin/config` while logged out redirects to `/admin/login`; non-admin roles redirect per existing RBAC.
- [ ] 5.4 Lint, type-check (`tsc --noEmit`), and `next build` all pass; grep the repo for any hardcoded specific brand string and confirm only `"Gimnasio"` and `NEXT_PUBLIC_GYM_NAME` remain as fallback literals.

---

## Hard Constraints (MUST appear in acceptance criteria of every relevant task)

- **No specific gym brand name may be hardcoded as a fallback** — the only allowed string literals for fallback are `process.env.NEXT_PUBLIC_GYM_NAME` and `"Gimnasio"`. Grep verification is part of Phase 5.4.
- **All cache invalidation paths** (`revalidatePath` for `/`, `/informacion`, `/admin`; `revalidateTag("gym-config")`) MUST be exercised on every save in `updateGymField`.
- **The fallback chain** `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` MUST be present wherever a gym name is rendered to a potentially-unauthenticated surface (root layout `generateMetadata`, `loading.tsx`, `login/page.tsx`, homepage hero, admin layout/sidebar).
- **All new Gym fields are nullable `String?`** — additive migration only, no default values, no seed data with brand strings.
- **Per-field server action** (`updateGymField`) — NOT a single bulk action, so partial saves don't overwrite siblings with empty strings.

---

## Implementation Order Rationale

Phase 1 establishes the data contract and API surface that everything else depends on. Phase 2 adds the write path with validation. Phase 3 builds the admin UI on top of the working backend. Phase 4 wires the public consumers to read the new data. Phase 5 verifies the whole chain end-to-end. This order also aligns with the suggested chained-PR slices — each slice produces a working, reviewable artifact.
