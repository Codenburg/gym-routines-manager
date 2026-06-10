# Design: Gym Configuration Admin

## Technical Approach

Additive Prisma migration → extend `GET/PATCH /api/gym` and `src/app/actions/gym.ts` with new fields → Server Component `/admin/config` page that fetches the singleton and passes it to a `GymConfigManager` client component using the existing `useActionState` + `FormState` pattern (no React Hook Form, matching `GymPriceEditor`) → refactor 8 hardcoded call sites to receive `gym` data as props or fetch server-side, with `NEXT_PUBLIC_GYM_NAME` env-var fallback for unauthenticated surfaces (root metadata via `generateMetadata`, login page) and a **generic "Gimnasio"** last-resort fallback (never hardcode a specific brand name) → `revalidatePath` on every save across `/`, `/informacion`, `/admin`, and `revalidateTag("gym-config")` on the cached reader.

## Architecture Decisions

### Decision: Single `updateGymConfig` action over per-field actions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| One action with all 7 fields | Simpler call site, one `revalidatePath` block, but partial updates overwrite siblings with empty strings | **Reject** |
| Per-field actions (3 actions) | More work, more revalidations, but each field independent | **Chosen** |
| One action with `Partial<>` semantics | Type-safe partial updates with a single action | **Reject** — adds Zod complexity not present in codebase |

**Rationale**: Per-field actions mirror the existing `createFeriado` / `updateFeriado` split and the `GymPriceEditor` pattern, keep the 4 form sections in `GymConfigManager` independent, and let the client fail each group in isolation. We add `updateGymField` as a generic action that accepts a discriminated `field` key — see Interfaces.

### Decision: Env-var fallback for root metadata, not layout fetch

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Fetch from DB in `generateMetadata` | True DB-driven, but converts every static page to dynamic | **Chosen for primary** |
| Env var only | Static, fast, but stale | **Chosen as fallback** |
| Hybrid: try DB, fall back to env | Best of both, one extra code path | **Chosen** |

**Rationale**: Root `metadata` is currently `export const metadata` (static). Converting to `generateMetadata()` makes the layout dynamic for every request — but the gym name rarely changes, so we wrap the DB read in `unstable_cache` with `cacheTag("gym-config")` + a 60s `revalidate` TTL, and on error fall back to `process.env.NEXT_PUBLIC_GYM_NAME ?? "Gimnasio"`. The env var represents the deploy's gym owner; the generic "Gimnasio" is the last-resort safety net so we never leak another client's brand name in production.

### Decision: `unstable_cache` (legacy) over `use cache` (Next 16)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `use cache` + `cacheTag` (Next 16) | Modern, but requires `cacheComponents: true` and is not yet enabled in `next.config.ts` | **Reject for now** |
| `unstable_cache` + `revalidateTag` | Works on Next 15.x as deployed, easy migration later | **Chosen** |
| `revalidate = 60` per page | Coarse, invalidates ALL pages on any save | **Reject** |

**Rationale**: Confirmed via `next-cache-components` skill that `unstable_cache` is the current state in this repo. The skill's migration table (`unstable_cache` → `use cache`) is the explicit upgrade path — but we follow the existing pattern (`revalidatePath` after every action) and add `unstable_cache` only for the hot read in `generateMetadata` and the server-side helper. Documented as a follow-up to migrate to `use cache` once `cacheComponents` is enabled.

### Decision: Layout-level fetch + prop drilling for `/admin/layout.tsx`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Layout fetches gym, passes `gymName` to `AdminLayoutComponent` → `AdminSidebar` | One fetch, single source of truth | **Chosen** |
| `AdminSidebar` fetches independently | Re-fetches per render, N+1 risk | **Reject** |
| Zustand store hydration | Overkill for one string | **Reject** |

**Rationale**: `AdminLayout` is already a Server Component that validates the session. We extend it to also call `getGymConfigForServer()` and pass `gymName` down to `AdminLayoutComponent` (Client) → `AdminSidebar` (Client). The cache lives at the action layer, so this stays cheap.

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Admin edits config                          │
└──────────────────────────────────────────────────────────────────┘
              │
              ▼
   /admin/config (Server Component)
              │  getGymConfigForServer()  ◄── unstable_cache "gym-config"
              ▼
   <GymConfigManager initial={...}>     (Client, 4 sub-forms)
              │  useActionState per field
              ▼
   updateGymField(field, value)         (Server Action)
              │  verifyAdmin → Zod → prisma.gym.update
              │  revalidateTag("gym-config")
              │  revalidatePath("/", "/informacion", "/admin")
              ▼
   PostgreSQL (Gym singleton, id="gym")
              │
              ▼  on next request
   ┌──────────┴──────────┬─────────────┬──────────────┐
   ▼                     ▼             ▼              ▼
generateMetadata()    /admin/layout  /              /informacion
(env fallback)        (props)        (RSC fetch)    (RSC fetch)
```

## Data Model

Add 6 nullable `String?` fields to the existing `Gym` singleton (additive, no breaking change). All are `String?` so existing rows and the API's auto-create path keep working without seed data.

```prisma
model Gym {
  id              String   @id @default("gym")
  price           Decimal  @db.Decimal(10, 2)

  // New fields (additive, all optional)
  nombre          String?  // Display name (DB → NEXT_PUBLIC_GYM_NAME env → "Gimnasio" generic)
  horario         String?  // Free-text, e.g. "8:00 a 22:00 — Lunes a viernes"
  direccion       String?  // Free-text, e.g. "Sargento Cabral 545, Esquina, Corrientes"
  mapsEmbedUrl    String?  // Google Maps embed URL
  socialInstagram String?  // Full Instagram URL
  socialWhatsapp  String?  // wa.me URL

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  feriados        Feriado[]
  promociones     Promocion[]
  descuentosDuracion DescuentoDuracion[]
}
```

**Why nullable, not defaulted**: env var + null-check at every read site is the documented fallback contract. Defaulting to a placeholder would mask missing config and make the public UI show stale branding until an admin opens the form.

**Migration**: `prisma migrate dev --name add_gym_display_fields` — pure `ALTER TABLE ADD COLUMN`, no data backfill needed.

## API Design

### GET /api/gym — extended

```ts
interface GymResponse {
  id: string;
  price: number;
  // NEW
  nombre: string | null;
  horario: string | null;
  direccion: string | null;
  mapsEmbedUrl: string | null;
  socialInstagram: string | null;
  socialWhatsapp: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Backwards-compatible: existing clients that only read `price` are unaffected. `null` for each new field until the admin sets them.

### PATCH /api/gym — extended (price only stays the same; config writes go through Server Actions)

The REST PATCH keeps `{ price }` semantics for symmetry. New fields are NOT added to `gymUpdateSchema` because they need Zod refinements (URL validation) and admin auth that's already done in Server Actions. **Single source of truth for config writes = `updateGymField` action**.

## Server Action Design

### `updateGymField` (new, replaces the current PATCH-only path for non-price fields)

```ts
"use server";

const gymFieldSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("nombre"),
             value: z.string().trim().min(1).max(80) }),
  z.object({ field: z.literal("horario"),
             value: z.string().trim().min(1).max(200) }),
  z.object({ field: z.literal("direccion"),
             value: z.string().trim().min(1).max(200) }),
  z.object({ field: z.literal("mapsEmbedUrl"),
             value: z.string().url().max(2000) }),
  z.object({ field: z.literal("socialInstagram"),
             value: z.string().url().max(500) }),
  z.object({ field: z.literal("socialWhatsapp"),
             value: z.string().url().max(500) }),
]);

export async function updateGymField(
  prevState: FormState<{ field: GymField; value: string }>,
  formData: FormData
): Promise<FormState<{ field: GymField; value: string }>> {
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) return { success: false, message: authCheck.message };

  const parsed = gymFieldSchema.safeParse({
    field: formData.get("field"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors,
             message: "Error de validación" };
  }

  try {
    await prisma.gym.update({
      where: { id: "gym" },
      data: { [parsed.data.field]: parsed.data.value },
    });

    revalidateTag("gym-config");
    revalidatePath("/");
    revalidatePath("/informacion");
    revalidatePath("/admin");

    return { success: true,
             data: { field: parsed.data.field, value: parsed.data.value },
             message: "Configuración actualizada" };
  } catch (error) {
    console.error("[updateGymField] failed", error);
    return { success: false, message: "Error al guardar la configuración" };
  }
}
```

### `getGymConfigForServer` (new, cached reader)

```ts
import { unstable_cache, revalidateTag } from "next/cache";

export const getGymConfigForServer = unstable_cache(
  async () => {
    return prisma.gym.findUnique({ where: { id: "gym" } });
  },
  ["gym-config"],
  { tags: ["gym-config"], revalidate: 60 }
);
```

`getGymConfig()` (existing, no cache) stays for callers that want fresh data (none in the public path; we can deprecate later).

## Page/Component Design

### `/admin/config` (new Server Component)

```tsx
// src/app/(admin)/admin/config/page.tsx
import { getGymConfigForServer } from "@/app/actions/gym";
import { GymConfigManager } from "@/components/admin/gym-config-manager";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const gym = await getGymConfigForServer();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración del Gimnasio"
        description="Identidad, horarios, ubicación y redes sociales"
        backHref="/admin"
      />
      <GymConfigManager
        initial={{
          nombre: gym?.nombre ?? "",
          horario: gym?.horario ?? "",
          direccion: gym?.direccion ?? "",
          mapsEmbedUrl: gym?.mapsEmbedUrl ?? "",
          socialInstagram: gym?.socialInstagram ?? "",
          socialWhatsapp: gym?.socialWhatsapp ?? "",
        }}
      />
    </div>
  );
}
```

### `GymConfigManager` (new Client Component)

Mirrors the `GymPriceEditor` pattern: 4 collapsible `<details>` sections, each with its own `useActionState(updateGymField, …)` call. No React Hook Form (matches `GymPriceEditor` precedent; fields are independent and shallow).

| Section | Fields | Why this grouping |
|---------|--------|-------------------|
| **Identidad** | `nombre` | Single string, public-facing on every page |
| **Horario** | `horario` | Free-text (admin keeps formatting control) |
| **Ubicación** | `direccion`, `mapsEmbedUrl` | Related — both render in `AddressSection` |
| **Redes sociales** | `socialInstagram`, `socialWhatsapp` | Paired in `SocialLinksSection` |

Each section:
- `<form action={formAction}>` with `name="field"` (hidden) and `name="value"` (input).
- Uses existing `AdminCard` + `AdminFormField` + `Button` + `DumbbellSpinner` primitives.
- `useEffect` closes edit mode + fires `toast.success` on `state.success && !isPending` (same idiom as `GymPriceEditor`).
- `useConfirm` for any destructive action — none in this form.

## Metadata Strategy

### Root layout (`src/app/layout.tsx`)

Replace `export const metadata` with `generateMetadata()`. Inside it, fetch via `getGymConfigForServer` (cached, 60s TTL). On error or null `nombre`, fall back to `process.env.NEXT_PUBLIC_GYM_NAME ?? "Gimnasio"`. The generic "Gimnasio" is intentionally neutral — it does not identify any specific gym, so a DB + env outage cannot leak another client's brand.

```tsx
const GENERIC_GYM_NAME = "Gimnasio"; // last-resort, no specific brand

export async function generateMetadata(): Promise<Metadata> {
  let name = process.env.NEXT_PUBLIC_GYM_NAME ?? GENERIC_GYM_NAME;
  try {
    const gym = await getGymConfigForServer();
    if (gym?.nombre) name = gym.nombre;
  } catch {
    // keep env fallback (or generic)
  }
  return {
    title: name,
    description: `Explora las mejores rutinas de ${name}`,
  };
}
```

### Login page (`src/app/(auth)/admin/login/page.tsx`)

The login page is a Client Component — no DB read. Replace the hardcoded `<h1>Champion Gym</h1>` with `process.env.NEXT_PUBLIC_GYM_NAME ?? "Gimnasio"`. No prop, no fetch. Same generic last-resort so we never leak another client's brand.

### `loading.tsx`

`loading.tsx` is a Server Component, can call `getGymConfigForServer` directly:

```tsx
const gym = await getGymConfigForServer();
const name = gym?.nombre ?? process.env.NEXT_PUBLIC_GYM_NAME ?? "Gimnasio";
// render with {name}
```

## Component Refactor List

| # | File | Current | New data source | Fallback |
|---|------|---------|-----------------|----------|
| 1 | `src/app/(public)/page.tsx` L40 | `Champion Gym` literal in `<h1>` | `getGymConfigForServer()` in RSC, pass `gymName` prop or inline const | env var → "Gimnasio" |
| 2 | `src/app/loading.tsx` L12 | `Champion Gym` literal | `getGymConfigForServer()` in this RSC | env var → "Gimnasio" |
| 3 | `src/app/layout.tsx` L31 | static `metadata.title` | `generateMetadata()` | env var → "Gimnasio" |
| 4 | `src/components/admin/admin-sidebar.tsx` L107 | `Champion Gym` literal | `gymName: string` prop from `AdminLayoutComponent` (Server passes it down) | env var → "Gimnasio" at layout level |
| 5 | `src/app/(auth)/admin/login/page.tsx` L65 | `Champion Gym` literal | `process.env.NEXT_PUBLIC_GYM_NAME` direct | generic "Gimnasio" (no brand) |
| 6 | `src/components/informacion/HoursSection.tsx` L11,13 | hardcoded hours + days | Accept `horario: string \| null` prop, render `horario ?? null` skeleton | Hide section when null |
| 7 | `src/components/informacion/AddressSection.tsx` L1,2,11 | hardcoded address + Maps URL | Accept `direccion: string \| null`, `mapsEmbedUrl: string \| null` props; render only when both present | Hide section when null |
| 8 | `src/components/informacion/SocialLinksSection.tsx` L3,4 | hardcoded URLs | Accept `socialInstagram: string \| null`, `socialWhatsapp: string \| null` props; render only the buttons that have a value | Hide empty buttons |

`/informacion/page.tsx` becomes the data-loading root for items 6–8: it already does `Promise.all` for other data, we add a `getGymDisplay()` call (uses the cached reader) and pass the new fields as props to each section.

**Sidebar chain**: `src/app/(admin)/admin/layout.tsx` → fetch gym name → pass `gymName={...}` to `AdminLayoutComponent` (Client) → pass through to `AdminSidebar` (Client). One Server fetch, no client-side data fetching.

## Caching & Revalidation

| Layer | Mechanism | When invalidated |
|-------|-----------|------------------|
| Server-side reader | `unstable_cache(..., ["gym-config"], { tags: ["gym-config"], revalidate: 60 })` | `revalidateTag("gym-config")` on `updateGymField`; also 60s TTL safety net |
| Public `/informacion` | Existing RSC pattern with `cache: "no-store"` for API fetches (no change) | `revalidatePath("/informacion")` on `updateGymField` |
| Public `/` | Same as above | `revalidatePath("/")` on `updateGymField` |
| Admin `/admin/*` | `export const dynamic = "force-dynamic"` already in admin pages | `revalidatePath("/admin")` on `updateGymField` |
| Root `generateMetadata()` | Inherits layout's cache (cached reader + 60s TTL) | Same tag invalidation |

`revalidatePath` calls are defensive — they force a fresh render of dynamic routes immediately. The `revalidateTag` is what actually purges the cached reader that `generateMetadata` and the `/admin/config` page share.

## File-by-File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add 6 `String?` fields to `Gym` model |
| `prisma/migrations/.../add_gym_display_fields/migration.sql` | Create | `ALTER TABLE "Gym" ADD COLUMN ...` × 6 |
| `src/lib/schemas.ts` | Modify | Add `gymFieldSchema` discriminated union + `GymField` type |
| `src/app/actions/gym.ts` | Modify | Add `updateGymField`, `getGymConfigForServer` (cached). Keep `getGymConfig` and `updateGymPrice` as-is. |
| `src/app/api/gym/route.ts` | Modify | Extend `GymResponse` and `GET` to return new fields. Keep `PATCH` price-only. |
| `src/app/layout.tsx` | Modify | Replace static `metadata` with `generateMetadata()` |
| `src/app/loading.tsx` | Modify | Fetch gym name, replace hardcoded h1 |
| `src/app/(public)/page.tsx` | Modify | Fetch gym name, replace hardcoded h1 |
| `src/app/(public)/informacion/page.tsx` | Modify | Fetch display fields, pass to child sections |
| `src/app/(auth)/admin/login/page.tsx` | Modify | Read `process.env.NEXT_PUBLIC_GYM_NAME` |
| `src/app/(admin)/admin/layout.tsx` | Modify | Fetch gym name, pass to `AdminLayoutComponent` |
| `src/app/(admin)/admin/config/page.tsx` | Create | Server Component, auth-guarded by parent layout |
| `src/components/admin/gym-config-manager.tsx` | Create | Client Component, 4 sub-forms with `useActionState` |
| `src/components/admin/admin-layout.tsx` | Modify | Accept + forward `gymName` prop |
| `src/components/admin/admin-sidebar.tsx` | Modify | Accept `gymName` prop, replace hardcoded span |
| `src/components/informacion/HoursSection.tsx` | Modify | Accept `horario` prop, render or hide |
| `src/components/informacion/AddressSection.tsx` | Modify | Accept `direccion` + `mapsEmbedUrl` props |
| `src/components/informacion/SocialLinksSection.tsx` | Modify | Accept `socialInstagram` + `socialWhatsapp` props |
| `.env.example` | Modify | Document `NEXT_PUBLIC_GYM_NAME` |
| `tests/e2e/gym-config.spec.ts` | Create | Playwright E2E: admin edits → public sees |
| `tests/unit/gym-field-schema.test.ts` | Create | Zod schema unit tests |

## Interfaces / Contracts

```ts
// src/lib/schemas.ts
export type GymField =
  | "nombre" | "horario" | "direccion"
  | "mapsEmbedUrl" | "socialInstagram" | "socialWhatsapp";

export const gymFieldSchema = z.discriminatedUnion("field", [ /* … */ ]);
export type GymFieldInput = z.infer<typeof gymFieldSchema>;

// src/app/actions/gym.ts
export type GymDisplay = {
  nombre: string | null;
  horario: string | null;
  direccion: string | null;
  mapsEmbedUrl: string | null;
  socialInstagram: string | null;
  socialWhatsapp: string | null;
};
```

Form field sets are a discriminated union so Zod validates URL-shaped fields with `z.string().url()` and string-shaped fields with `min(1)`. `FormState<{ field: GymField; value: string }>` keeps the action result consistent with existing patterns.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** | `gymFieldSchema` — accepts each valid field, rejects empty `nombre`, rejects non-URL for URL fields, rejects unknown `field` discriminant | Vitest: `safeParse` cases per field |
| **Unit** | `getGymConfigForServer` — cache hit/miss, tag invalidation purges | Vitest with mock Prisma, call twice, `revalidateTag`, call again |
| **Integration** | `updateGymField` — auth gate, validation, DB write, `revalidatePath` calls | Vitest with mock Prisma + mock `revalidatePath` |
| **E2E** | Admin flow: login → `/admin/config` → edit each field → save → visit `/`, `/informacion` and see new value | Playwright with Page Object: `LoginPage`, `AdminConfigPage`, `HomePage`, `InformacionPage` |
| **E2E** | Fallback: with DB gym `nombre=null`, `/` shows env var; with both env and DB unavailable, shows generic "Gimnasio" (never another client's brand) | Playwright, env var override |
| **E2E** | Auth gate: hitting `/admin/config` while logged out redirects to `/admin/login` | Playwright, unauthenticated context |

Test fixtures: seed the Gym singleton in a `beforeAll` block with default nulls, then mutate per test. Use the existing `prisma.$transaction` pattern in the codebase.

## Migration / Rollout

**Additive only** — no destructive changes. Migration adds 6 nullable columns; existing data, existing API consumers, and existing admin pages continue to work unchanged. Rollback = `prisma migrate resolve --rolled-back <migration>` + git revert. Zero data loss.

**Phased rollout option** (not blocking, recommended): ship the DB + admin page first behind a feature flag `NEXT_PUBLIC_FEATURE_GYM_CONFIG` (default off). Public consumers fall back to env var defaults until the flag is enabled. Reduces blast radius for the homepage h1 refactor.

## Known Follow-ups (Tech Debt)

These are explicitly deferred from this change. Each should become its own SDD change:

- **[ ] Migrate `unstable_cache` → `use cache` (Next 16 Cache Components)** — `getGymConfigForServer` currently uses `unstable_cache` because `cacheComponents: true` is not enabled in `next.config.ts`. The `next-cache-components` skill says `unstable_cache` is replaced by `use cache` in Next 16 and "do not use it in new code". Follow-up: enable `cacheComponents: true` in `next.config.ts`, rewrite `getGymConfigForServer` to use `'use cache'` + `cacheTag('gym-config')` + `cacheLife({ revalidate: 60 })`, and validate that no runtime API (`cookies()`, `headers()`) is accessed inside the cached function. The code is structured to make this a small, isolated change.

## Open Questions

- [ ] **Embed URL security**: do we trust admins to paste valid `google.com/maps/embed?pb=...` URLs only, or sanitize? Spec says "out of scope: social link validation beyond URL format" — same applies to `mapsEmbedUrl`. Confirmed: trust the admin, no whitelist.
- [ ] **`horario` shape**: free-text confirmed in spec, but should we offer a structured fallback (open/close time per day) in v2? Out of scope here.
- [x] **Cache TTL**: 60s is arbitrary. Should the cached reader for `generateMetadata` use a longer TTL (e.g. 5 min) since the name rarely changes? **Resolved** — keeping 60s to match the `revalidatePath` contract. Admins expect changes to be visible immediately after save, and `revalidateTag` is the actual invalidation mechanism.
- [x] **Cache API choice (unstable_cache vs use cache)**: **Resolved (deferred)** — using `unstable_cache` now; migration to `use cache` is a follow-up (see Known Follow-ups above).
