## Exploration: gym-config-admin

### Current State

#### Hardcoded values (5 locations)

| Value | File | Line(s) | What it does |
|---|---|---|---|
| "Champion Gym" | `src/app/(public)/page.tsx` | 40 | Page header `<h1>` |
| "Champion Gym" | `src/app/loading.tsx` | 12 | Loading skeleton `<h1>` |
| "Champion Gym" | `src/app/layout.tsx` | 31 | `<title>` metadata |
| "Champion Gym" | `src/components/admin/admin-sidebar.tsx` | 107 | Sidebar logo span |
| "Champion Gym" | `src/app/(auth)/admin/login/page.tsx` | 65 | Login page heading |
| "8:00 a 22:00" + "Lunes a viernes" | `src/components/informacion/HoursSection.tsx` | 11, 13 | Hours display |
| "Sargento Cabral 545, Esquina, Corrientes" | `src/components/informacion/AddressSection.tsx` | 11 | Address text |
| Google Maps embed URL | `src/components/informacion/AddressSection.tsx` | 1-2 | Maps iframe |
| Instagram URL + WhatsApp URL | `src/components/informacion/SocialLinksSection.tsx` | 3-4 | Social link buttons |
| "by Codenburg" | `src/app/(public)/page.tsx` + `loading.tsx` | 42, 14 | Subtitle below name |

#### Gym model (Prisma)

Located at `prisma/schema.prisma` lines 176-184:
```prisma
model Gym {
  id        String   @id @default("gym")
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  feriados  Feriado[]
  promociones Promocion[]
  descuentosDuracion DescuentoDuracion[]
}
```

Currently only has `price` as configurable field. Related models (`Feriado`, `Promocion`, `DescuentoDuracion`) reference `Gym` via `gymId` with default `"gym"`.

#### API routes

- `GET /api/gym` — Returns gym config (id, price, timestamps). Auto-creates with default price 45000 if not found. Schema at `openspec/specs/api/spec.md`.
- `PATCH /api/gym` — Admin-only update. Currently only accepts `{ price: number }` via Zod. Uses `verifyAdmin()` helper.

Both in `src/app/api/gym/route.ts`.

#### Server actions

- `src/app/actions/gym.ts` — Contains `getGymConfig()` (server component reader) and `updateGymPrice()` (FormState + useActionState pattern).
- `src/app/actions/feriados.ts` — Feriados CRUD (verifyAdmin, Zod validation, revalidatePath)
- `src/app/actions/promociones.ts` — Promociones CRUD
- `src/app/actions/descuentos-duracion.ts` — Descuentos CRUD

All server actions follow: `verifyAdmin(await headers())` → `schema.safeParse()` → Prisma mutation → `revalidatePath()`.

#### Admin panel structure

- **Dashboard** at `src/app/(admin)/admin/page.tsx` — Uses `GymPriceEditor` for price (Server Component fetch + Client Component edit via useActionState)
- **Feriados** at `.../admin/feriados/page.tsx` — Server Component fetch → `FeriadoManager` client component
- **Promociones** at `.../admin/promociones/page.tsx` — `PromocionManager` client component
- **Descuentos** at `.../admin/descuentos-duracion/page.tsx` — `DescuentoDuracionManager` client component
- **Trainers** at `.../admin/trainers/page.tsx`
- **No existing settings/config page** — No admin page for gym name, hours, address, or social links

#### Admin sidebar

At `src/components/admin/admin-sidebar.tsx`. Current nav items: Rutinas, Feriados, Promociones, Descuentos, Entrenadores. Nav items filtered by role (TRAINER sees only Rutinas + Feriados). Hardcoded "Champion Gym" at line 107.

#### Admin pattern (how feriados/promociones work)

Each admin section follows:
1. **Server Component page** → fetches initial data from Prisma directly
2. **Client Component manager** → manages state with `useState`, calls server actions
3. **Server Actions** → `"use server"` + `verifyAdmin()` + Zod validation + Prisma mutation + `revalidatePath()`
4. **Toast via sonner** → success/error feedback
5. **Confirm dialog** → destructive actions via `useConfirm` hook

### Affected Areas

| Area | Impact | Description |
|---|---|---|
| `prisma/schema.prisma` | Modified | Add fields to Gym model: name, hours, address, social links |
| `prisma/seed.ts` | Modified | Update gym seed with default values for new fields |
| `src/app/api/gym/route.ts` | Modified | Extend GET response + PATCH schema to include new fields |
| `src/app/actions/gym.ts` | Modified | Add/update server actions for gym config fields |
| `src/app/(public)/page.tsx` | Modified | Read gym name from DB instead of hardcoded "Champion Gym" |
| `src/app/loading.tsx` | Modified | Read gym name from DB instead of hardcoded |
| `src/app/layout.tsx` | Modified | Dynamic title metadata (dynamic metadata) |
| `src/app/(auth)/admin/login/page.tsx` | Modified | Read gym name from DB or env |
| `src/components/admin/admin-sidebar.tsx` | Modified | Read gym name from DB |
| `src/components/informacion/HoursSection.tsx` | Modified | Accept hours as props instead of hardcoded |
| `src/components/informacion/AddressSection.tsx` | Modified | Accept address/maps URL as props |
| `src/components/informacion/SocialLinksSection.tsx` | Modified | Accept social URLs as props |
| `src/app/(public)/informacion/page.tsx` | Modified | Fetch expanded gym config and pass as props |
| `src/components/admin/GymPriceEditor.tsx` | Refactored | Can be extended or used as template for new config editors |
| `src/app/(admin)/admin/page.tsx` | Modified | Add new config section for gym settings |
| `src/app/(admin)/admin/config/` | New | New admin config/settings page (if separate page approach) |
| `src/components/admin/GymConfigEditor.tsx` | New | Form component for gym config |
| `openspec/specs/api/spec.md` | Modified | Extend API spec with new fields |
| `openspec/specs/admin-panel/spec.md` | Modified | Add gym config admin scenarios |

### Approaches

1. **Extend Gym model + dedicated admin config page** — Add all new fields to the Gym model, create `/admin/config` page with a form. Extend GET/PATCH `/api/gym` to handle all fields. Server action for multi-field save.
   - Pros: Clean separation of concerns, follows existing CRUD patterns, single source of truth
   - Cons: More files to create, login page name fetch needs careful consideration (auth page without DB dependency during render)
   - Effort: Medium

2. **Extend Gym model + inline on dashboard** — Add fields to Gym model but keep editing on the existing admin dashboard (`/admin`) as additional editor sections alongside GymPriceEditor.
   - Pros: Faster to implement, no new route, consistent with existing price editor UX
   - Cons: Dashboard gets cluttered, less organized for the admin
   - Effort: Low-Medium

3. **Environment variables for name, DB for rest** — Keep gym name in `.env.local` (renders fast, no DB call for metadata) and put hours/address/social in DB. Admin page edits DB fields only.
   - Pros: Static name renders instantly everywhere, no DB dependency for `layout.tsx` or login page
   - Cons: Two sources of truth, env var changes require redeploy
   - Effort: Low

### Recommendation

**Approach 1 (Extend Gym model + dedicated admin config page)** is the cleanest long-term solution.

**Rationale**: 
- The Gym model already exists and is designed as the singleton source of truth
- A dedicated `/admin/config` page follows the existing admin section pattern (feriados, promociones, etc.)
- Adding to the sidebar maintains UI consistency
- The gym name being dynamic requires solving the metadata issue: `layout.tsx` exports a static `metadata` object. We'll need dynamic `generateMetadata()` for pages that need it, and a typed utility for fetching gym config in server components

**One nuance**: the login page and root layout metadata need the gym name before any user interaction. Options:
- (a) Fetch from DB in `generateMetadata()` — works for page-level, but root layout export is static
- (b) Use `NEXT_PUBLIC_GYM_NAME` env var as fallback for layout/login, DB for everything else
- (c) Fetch from DB in layout with `generateMetadata()` on the root — Next.js App Router supports this

I recommend **(b)** for the root metadata (env var as default, DB overrides for admin/public pages), because the root `layout.tsx` is a server component and can `generateMetadata()`, but the metadata is also used by `loading.tsx` which is the SAME `layout.tsx`. So we can use `generateMetadata` in layout with a DB fetch. The login page can either fetch from DB or use the same pattern.

### Risks

- **Root layout metadata**: `layout.tsx` exports static `metadata` — switching to `generateMetadata()` with a DB fetch could affect initial render performance. Mitigation: keep a reasonable default or use an env var for the first render.
- **Loading state**: `loading.tsx` currently hardcodes "Champion Gym". Since it shares the same layout, the dynamic metadata will be available. But `loading.tsx` itself shows `<h1>Champion Gym</h1>` — that will need to stay hardcoded or match the metadata pattern.
- **Login page**: The login page is unauthenticated and won't have access to DB content without exposing it. Using an env var here is pragmatic.
- **Migrations**: Adding fields to the Gym model is additive — no breaking changes. Zero-downtime.
- **Revalidation**: Each config change needs proper `revalidatePath()` calls to `/` (homepage), `/informacion`, `/admin`, etc.
- **Admin sidebar re-render**: The sidebar is a client component, so fetching gym name from DB requires a prop or hook. This is straightforward but needs attention.

### Ready for Proposal

Yes. All hardcoded locations are identified, the Gym model is already in place, and the admin pattern is well-understood. Next step: Proposal + Spec + Design.
