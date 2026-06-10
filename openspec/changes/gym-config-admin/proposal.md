# Proposal: Gym Configuration Admin

## Intent

10 hardcoded gym values (name, hours, address, Instagram/WhatsApp URLs) across 8 files require code changes to update. Make them configurable from the admin panel, stored in the Gym model. Use the env var `NEXT_PUBLIC_GYM_NAME` (set at deploy time = identity of this deployment's gym owner) as fallback for unauthenticated contexts (login page, root layout metadata) when the DB is unavailable. **No hardcoded brand name fallback** — if both DB and env var are missing/unavailable, render a generic name (e.g. "Gimnasio") that does NOT belong to any other client.

## Scope

### In Scope
- Extend Gym Prisma model with name, hours, address, social link fields via additive migration
- Extend GET/PATCH `/api/gym` to read/write new fields with Zod validation
- Create `/admin/config` admin page with form for all gym config fields
- Refactor 8 hardcoded locations to read from DB (with null/loading states — no brand-name placeholder)
- Env var fallback chain: `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` (generic, no brand identity) for root layout metadata (`generateMetadata()`) and login page. Never hardcode a specific brand name.
- `revalidatePath` covering all affected public pages on save

### Out of Scope
- Multi-gym support (singleton only, id "gym")
- Image/logo upload
- Social link validation beyond URL format
- i18n for hours/address display

## Capabilities

### New Capabilities
- `gym-config`: Admin gym configuration page, public consumption of gym display data, fallback strategy for unauthenticated contexts

### Modified Capabilities
- `database`: Extend Gym model with `nombre`, `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp` fields
- `api`: Extend GET response body and PATCH request/validation with new fields

## Approach

Additive migration → extend API + server actions → `src/app/(admin)/admin/config/page.tsx` (Server Component, fetch + pass initial data) → `GymConfigManager` (Client Component, `useActionState` per field group) → refactor 8 hardcoded locations to fetch from DB → `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` fallback chain for layout metadata + login page (generic last-resort, no brand name) → `revalidatePath` on every save.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | 6 new fields on Gym model |
| `src/app/api/gym/route.ts` | Modified | Extend GET/PATCH with new fields |
| `src/app/actions/gym.ts` | Modified | New `updateGymConfig` action |
| `src/app/layout.tsx` | Modified | Switch to `generateMetadata()` with `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain (generic fallback, no brand) |
| `src/app/(public)/page.tsx` | Modified | Fetch name from DB |
| `src/app/loading.tsx` | Modified | Fetch name from DB |
| `src/app/(auth)/admin/login/page.tsx` | Modified | Read name from `NEXT_PUBLIC_GYM_NAME` env var; fall back to generic "Gimnasio" (no brand identity) |
| `src/components/admin/admin-sidebar.tsx` | Modified | Fetch name from DB |
| `src/components/informacion/HoursSection.tsx` | Modified | Read hours from DB |
| `src/components/informacion/AddressSection.tsx` | Modified | Read address/maps embed from DB |
| `src/components/informacion/SocialLinksSection.tsx` | Modified | Read social URLs from DB |
| `src/app/(admin)/admin/config/page.tsx` | **New** | Server Component, auth-guarded |
| `src/components/admin/GymConfigManager.tsx` | **New** | Client Component form manager |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Root layout uses static `metadata` export | High | Replace with `generateMetadata()` — `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain (generic last-resort, no specific brand) |
| `loading.tsx` shares root layout, needs name | Medium | Same `DB → env → "Gimnasio"` chain inside `loading.tsx` |
| Login page has no auth context | Low | `NEXT_PUBLIC_GYM_NAME` env var; fall back to "Gimnasio" |
| Hardcoded specific brand fallback would leak another client's identity | **High** | **Never hardcode a specific brand string** — last-resort fallback is a generic neutral name ("Gimnasio") that belongs to no client |

## Rollback Plan

Revert the additive migration (`prisma migrate dev` rollback), revert all file changes via git. Migration is additive only (new columns) — zero data loss on revert. Existing `price` field and all current data remain untouched.

## Dependencies

- Existing Gym model singleton pattern (`id "gym"`)
- Existing `verifyAdmin()` utility for server actions
- Existing `FormState<T>` + `useActionState` pattern for form management
- Existing `toast.success`/`toast.error` from sonner

## Performance & Breaking Changes

- **Bundle size**: Negligible — new components are small forms
- **Performance**: One additional DB query per page rendering gym display data; mitigated by layout-level fetch and caching
- **Breaking changes**: None — additive migration only, API response extended with new fields (backwards-compatible)

## Deferred (Follow-up Changes)

- **Migrate `unstable_cache` → `use cache` (Next 16 Cache Components)** — see `design.md` Known Follow-ups. This change uses `unstable_cache` because `cacheComponents` is not yet enabled in `next.config.ts`. The follow-up enables the flag, rewrites the cached reader to use `'use cache'` + `cacheTag('gym-config')` + `cacheLife({ revalidate: 60 })`, and validates no runtime APIs leak into the cached function. The current code is structured to make this an isolated change.

## Success Criteria

- [ ] Admin can set name, hours, address, social links from `/admin/config`
- [ ] Changes reflect immediately on homepage, loading, sidebar, info sections after save
- [ ] Login page and `<title>` metadata use `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain when DB is unavailable — generic neutral last-resort, never a specific brand name
- [ ] Production deploys should set `NEXT_PUBLIC_GYM_NAME` so the deploy identity is never ambiguous; the generic "Gimnasio" exists only as a safety net
- [ ] All 10 hardcoded values replaced with DB-driven or env-driven values
- [ ] Existing price config on dashboard remains fully functional
