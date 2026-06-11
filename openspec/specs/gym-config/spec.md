# Gym Configuration Specification

## Purpose

Define how gym display information (name, hours, address, social links) is managed by admins and consumed by the public app. The system MUST support admin editing via a dedicated page, public read access from Server Components, and a three-step name resolution chain (`DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"`) for unauthenticated contexts. No specific brand name may be hardcoded as a fallback.

---

## Requirements

### Requirement: Public Gym Data Consumption

Server Components and Server Actions MUST read the current gym configuration from the database and render it in headers, sidebars, and public information sections. The public `HoursSection` MUST consume `horarioJson` (a structured weekly object), format it as a uniform single-line string, and never render the admin's free-text input.
(Previously: Public `HoursSection` rendered a single free-text `horario` string verbatim.)

#### Scenario: Public page reads gym name

- GIVEN a Gym record exists with `nombre = "Titanium Gym"`
- WHEN the homepage Server Component renders
- THEN the rendered output MUST contain the string "Titanium Gym"

#### Scenario: Public page reads hours from structured data

- GIVEN `horarioJson` contains `{ lun: { abierto: true, apertura: "08:00", cierre: "22:00" }, ..., vie: { abierto: true, apertura: "08:00", cierre: "22:00" }, sab: { abierto: true, apertura: "09:00", cierre: "14:00" }, dom: { abierto: false, apertura: null, cierre: null } }`
- WHEN `HoursSection` renders
- THEN the output MUST contain the formatted string "Lun a Vie 8:00 a 22:00 · Sáb 9:00 a 14:00 · Dom cerrado"

#### Scenario: Public page reads address and maps embed

- GIVEN `direccion = "Av. Siempre Viva 742"` and `mapsEmbedUrl = "https://www.google.com/maps/embed?..."`
- WHEN `AddressSection` renders
- THEN the output MUST contain "Av. Siempre Viva 742"
- AND the `<iframe>` `src` MUST equal the stored mapsEmbedUrl

#### Scenario: Public page reads social links

- GIVEN `socialInstagram = "https://instagram.com/titanium"` and `socialWhatsapp = "https://wa.me/5491112345678"`
- WHEN `SocialLinksSection` renders
- THEN the Instagram `href` MUST equal the stored Instagram URL
- AND the WhatsApp `href` MUST equal the stored WhatsApp URL

#### Scenario: NULL horarioJson hides the hours section

- GIVEN a Gym record with `horarioJson = null` (unconfigured)
- WHEN the public page renders
- THEN the `HoursSection` MUST render an empty state (hidden or placeholder)
- AND the component MUST NOT throw

#### Scenario: All-closed horarioJson hides the hours section

- GIVEN `horarioJson` exists but every day has `abierto: false`
- WHEN `HoursSection` renders
- THEN the section MUST be hidden (no output, no fake content)
- AND the component MUST NOT throw

#### Scenario: NULL fields render empty, not fake data

- GIVEN a Gym record with `nombre` and `price` set, but all new display fields are NULL
- WHEN any public component renders
- THEN the component MUST NOT throw
- AND sections depending on a NULL field MUST render an empty/placeholder state (never hardcoded fake data)

### Requirement: Admin Gym Configuration Page

The system MUST provide `/admin/config`, auth-guarded by the existing admin middleware, that lets authenticated admins view and edit all gym configuration fields. The Hours & Address group MUST render a per-day schedule editor (7 day cards) instead of a free-text `horario` textarea.
(Previously: The Hours & Address group exposed a single `<textarea>` for `horario`.)

#### Scenario: Admin opens config page

- GIVEN an authenticated admin visits `/admin/config`
- WHEN the page renders
- THEN a form MUST display inputs for: nombre, direccion, mapsEmbedUrl, socialInstagram, socialWhatsapp
- AND a per-day schedule editor MUST be rendered in place of the previous `horario` textarea, with 7 day cards
- AND each day card MUST be pre-filled with the current DB value (one for `lun`, `mar`, `mie`, `jue`, `vie`, `sab`, `dom`)

#### Scenario: Non-admin redirected

- GIVEN an authenticated non-admin (role USER or TRAINER) navigates to `/admin/config`
- WHEN the page resolves
- THEN the user MUST be redirected per existing RBAC rules (USER → homepage, TRAINER → `/admin/rutinas`)

#### Scenario: Unauthenticated redirected

- GIVEN no authenticated session
- WHEN a request is made to `/admin/config`
- THEN the user MUST be redirected to `/admin/login`

### Requirement: Admin Saves Gym Configuration

A server action MUST validate input, persist changes to the singleton Gym record, call `revalidatePath` for every public path consuming gym data, and return `FormState<T>`.

#### Scenario: Save valid gym name

- GIVEN an admin on `/admin/config`
- AND the Gym has `nombre = "Old"`
- WHEN the admin submits `nombre = "New"`
- THEN the record MUST be updated
- AND `revalidatePath` MUST be called for the homepage, public info section, and admin sidebar
- AND the action MUST return `{ success: true }`
- AND a success toast MUST be displayed

#### Scenario: Save social link

- GIVEN an admin submits a new `socialInstagram` URL
- WHEN the server action processes the request
- THEN the value MUST be persisted
- AND `SocialLinksSection` MUST reflect the new value on next render

### Requirement: Input Validation

All gym config input MUST be validated server-side via Zod. Errors MUST be returned in `FormState<T>` and rendered near the offending input. The `horarioJson` field MUST be validated against the `HorarioSemanal` Zod schema; malformed payloads (invalid time format, missing required day keys) MUST be rejected.
(Previously: `horario` was validated as a trimmed string of 1–200 chars.)

#### Scenario: Empty name rejected

- GIVEN an admin submits `nombre = ""`
- WHEN the server action validates
- THEN it MUST return `{ success: false, errors: { nombre: "..." } }`
- AND the DB MUST NOT be updated

#### Scenario: Invalid URL rejected for mapsEmbedUrl

- GIVEN `mapsEmbedUrl = "not-a-url"`
- WHEN the server action validates
- THEN it MUST return a validation error for `mapsEmbedUrl`
- AND the DB MUST NOT be updated

#### Scenario: Invalid URL rejected for social links

- GIVEN `socialInstagram` or `socialWhatsapp` is a non-URL string
- WHEN the server action validates
- THEN it MUST return a validation error for the offending field
- AND the DB MUST NOT be updated

#### Scenario: Malformed horarioJson rejected

- GIVEN an admin submits a `horarioJson` payload with an invalid time string (e.g. `apertura = "25:99"`) or a missing day key
- WHEN the server action validates
- THEN it MUST return a validation error for `horarioJson`
- AND the DB MUST NOT be updated

#### Scenario: Optional fields accept empty

- GIVEN an admin submits `horarioJson = null`, or empty values for `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`
- WHEN the server action validates
- THEN the request MUST be accepted and NULL values persisted (these fields are optional)

### Requirement: Name Resolution Chain (DB → Env Var → Generic)

For the gym name in unauthenticated contexts (root layout `<title>`, login page, `loading.tsx`), the system MUST resolve the displayed name using a strict three-step chain and MUST NEVER hardcode a specific brand string (no specific client name may appear as a hardcoded fallback).

The resolution order is:
1. `Gym.nombre` from the database (read via `getGymConfigForServer`)
2. `process.env.NEXT_PUBLIC_GYM_NAME` (set at deploy time as the deploy's gym owner identity)
3. The generic neutral string `"Gimnasio"` (last-resort safety net, belongs to no client)

#### Scenario: DB read wins when available

- GIVEN Gym has `nombre = "Titanium Gym"` and `NEXT_PUBLIC_GYM_NAME = "Default"`
- WHEN a public Server Component reads the gym name
- THEN the rendered name MUST be "Titanium Gym"
- AND the env var is used ONLY when DB read fails or `nombre` is NULL

#### Scenario: Env var used when DB unavailable

- GIVEN the DB is unreachable during `generateMetadata()` execution
- AND `NEXT_PUBLIC_GYM_NAME = "My Gym"`
- WHEN Next.js renders root metadata
- THEN `<title>` MUST contain "My Gym"
- AND the page MUST NOT crash

#### Scenario: Generic fallback when both DB and env fail

- GIVEN the DB is unreachable
- AND `NEXT_PUBLIC_GYM_NAME` is NOT set
- WHEN root metadata or the login page renders
- THEN the displayed gym name MUST be the generic string "Gimnasio"
- AND MUST NOT be any specific client brand name

#### Scenario: Login page uses env var (no DB read)

- GIVEN the user is on `/admin/login` with no session
- WHEN the page renders
- THEN the gym name displayed MUST be `NEXT_PUBLIC_GYM_NAME` if set
- OR the generic "Gimnasio" if env var is missing
- AND no DB query MUST be required

#### Scenario: No specific brand may be hardcoded

- GIVEN the production code
- THEN NO file MUST contain a literal gym brand name (e.g. "Champion Gym") as a fallback value
- AND the only allowed string literals for fallback are `process.env.NEXT_PUBLIC_GYM_NAME` and `"Gimnasio"`

---

### Requirement: Horario Data Structure

The system MUST define a Zod-validated `HorarioSemanal` shape for storing weekly operating hours. The structure MUST have seven fixed day keys (`lun`, `mar`, `mie`, `jue`, `vie`, `sab`, `dom`), and each day MUST be a `HorarioDia` object with `abierto: boolean`, `apertura: string | null`, and `cierre: string | null`. Time values MUST be `HH:MM` 24-hour strings validated by a regex.

#### Scenario: HorarioDia schema

- GIVEN a `HorarioDia` value `{ abierto: true, apertura: "08:00", cierre: "22:00" }`
- WHEN validated by `horarioDiaSchema`
- THEN validation MUST succeed

#### Scenario: Invalid time format rejected

- GIVEN a `HorarioDia` value `{ abierto: true, apertura: "25:99", cierre: "22:00" }`
- WHEN validated by `horarioDiaSchema`
- THEN validation MUST fail with a path-scoped error on `apertura`

#### Scenario: HorarioSemanal requires all seven day keys

- GIVEN a payload missing the `dom` key
- WHEN validated by `horarioSemanalSchema`
- THEN validation MUST fail

#### Scenario: Closed day allows null times

- GIVEN `{ abierto: false, apertura: null, cierre: null }`
- WHEN validated by `horarioDiaSchema`
- THEN validation MUST succeed

#### Scenario: HorarioSemanal can be null

- GIVEN the admin clears the schedule (all-closed or unconfigured)
- WHEN the field is set to `null` at the boundary
- THEN the application MUST accept and persist `null`

### Requirement: Public Hours Section Renders Single-Line String

The public `HoursSection` component MUST be a pure formatting function: given a `HorarioSemanal` object (or `null`), it MUST produce a single-line string using these rules:
- Consecutive open days with identical hours are grouped as `"<DíaIni> a <DíaFin> <apertura> a <cierre>"`.
- Each group is separated by `" · "` (middle dot with surrounding spaces).
- A closed day is rendered as `"<Día> cerrado"`.
- If `horarioJson` is `null` OR every day is closed, the section MUST render nothing (hidden state — no fake content).

The component MUST NOT depend on any free-text input from the admin. The application controls the format.

#### Scenario: Consecutive open days grouped

- GIVEN Mon–Fri all open with `08:00–22:00` and Sat open with `09:00–14:00` and Sun closed
- WHEN `HoursSection` renders
- THEN the rendered text MUST be `"Lun a Vie 8:00 a 22:00 · Sáb 9:00 a 14:00 · Dom cerrado"`

#### Scenario: Single open day not grouped

- GIVEN only `lun` is open (rest closed)
- WHEN `HoursSection` renders
- THEN the output MUST list the single day as `"Lun 8:00 a 22:00"` (no "Lun a Lun")
- AND the closed days MUST be enumerated as `"Mar cerrado · Mie cerrado · ..."`

#### Scenario: Non-consecutive open days listed separately

- GIVEN `lun`, `mie`, `vie` open with same hours, and `mar`, `jue` closed
- WHEN `HoursSection` renders
- THEN the output MUST list `"Lun cerrado · Mar 8:00 a 22:00 · Mie cerrado · Jue 8:00 a 22:00 · Vie cerrado"` OR equivalent grouping — closed days are spelled out, and open days form their own segments

#### Scenario: All-closed hides the section

- GIVEN every day has `abierto: false`
- WHEN `HoursSection` renders
- THEN no text MUST be rendered (the section is hidden)

#### Scenario: Null horarioJson hides the section

- GIVEN `horarioJson = null`
- WHEN `HoursSection` renders
- THEN no text MUST be rendered (the section is hidden)

#### Scenario: Time strings parsed consistently

- GIVEN a `HorarioSemanal` with times like `"08:00"`, `"9:30"`, `"22:00"`
- WHEN `HoursSection` formats the output
- THEN the times MUST be rendered without leading zeros on the hour where culturally appropriate (e.g. `8:00`, `9:30`, `22:00`) — the exact normalization rule is implementation-defined but MUST be consistent across the rendered string

---

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| ACGC1 | `/admin/config` renders for admins with pre-filled fields |
| ACGC2 | Non-admin users are redirected away from `/admin/config` |
| ACGC3 | Server action validates via Zod and returns `FormState<T>` |
| ACGC4 | Invalid input (empty name, malformed URL) is rejected with field-level errors |
| ACGC5 | Successful save persists to DB and triggers `revalidatePath` for affected routes |
| ACGC6 | All hardcoded locations render DB or env-var values |
| ACGC7 | Login page and root `<title>` use `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain; no specific brand name is hardcoded anywhere |
| ACGC8 | Public components render empty/placeholder (not fake data) when a field is NULL |

---

## ADDED Requirements (Page Loading Overhaul — v0.18.0)

### Requirement: Cached Public Price Reader

The public-facing price value displayed on `/informacion` and other public pages MUST be read through a cached reader (`getGymPrice` / `getGymConfigForServer` pattern) that uses the `gym-config` cache tag with a 60-second TTL. The cached reader MUST be invalidated when `updateGymField` (or equivalent price mutation action) is called — the mutation action MUST call both `revalidatePath` for affected routes AND `revalidateTag("gym-config")`. The reader MUST NOT be the direct Prisma `gym.findUnique` call (which bypasses the cache).

#### Scenario: Public price read goes through cached reader

- GIVEN the `/informacion` page renders
- WHEN the price is read for display
- THEN the read MUST go through the cached `getGymConfigForServer` reader (or a thin `getGymPrice` wrapper using the same `gym-config` tag)
- AND the read MUST be served from the cache on subsequent requests within the 60-second TTL
- AND the read MUST NOT call `prisma.gym.findUnique` directly from the page

#### Scenario: Cache invalidated on price update

- GIVEN an admin updates the gym price via `updateGymField`
- WHEN the mutation completes
- THEN the action MUST call `revalidateTag("gym-config")` alongside the existing `revalidatePath` calls
- AND the next read of the public price (on any page) MUST return the new value (not the cached stale value)

#### Scenario: Stale data acceptable for 60 seconds

- GIVEN the admin updates the price at time T
- WHEN a public page reads the price between T and T+60s
- THEN the page MAY display the cached (old) price value
- AND this is acceptable per the 60-second TTL
- AND the admin panel's own page MUST still show the new price immediately (it does not use the cache for display)

### Requirement: Public Gym Config Sections Use Skeleton for Loading

Public-facing consumers of gym configuration (HoursSection, AddressSection, SocialLinksSection, PriceSection) MUST render a `<Skeleton>` placeholder block while the gym data is in flight, and MUST replace the skeleton with the formatted content once the data resolves. The skeleton MUST be a non-interactive placeholder using the design system's `bg-muted animate-pulse rounded` tokens. The skeleton MUST NOT render fake data (e.g. hardcoded prices, hardcoded hours).

#### Scenario: Hours section shows Skeleton while data is in flight

- GIVEN a user navigates to `/informacion`
- WHEN the gym `horarioJson` is being read
- THEN the HoursSection MUST render a `<Skeleton>` placeholder of the same vertical space the formatted string will occupy
- AND the skeleton MUST NOT contain any formatted hours text

#### Scenario: Address section shows Skeleton while data is in flight

- GIVEN a user navigates to `/informacion`
- WHEN the gym `direccion` / `mapsEmbedUrl` is being read
- THEN the AddressSection MUST render a `<Skeleton>` placeholder
- AND the placeholder MUST NOT contain fake addresses or hardcoded map URLs

#### Scenario: Social links section shows Skeleton while data is in flight

- GIVEN a user navigates to `/informacion`
- WHEN the gym `socialInstagram` / `socialWhatsapp` is being read
- THEN the SocialLinksSection MUST render a `<Skeleton>` placeholder for each link
- AND the placeholder MUST NOT contain fake social URLs

#### Scenario: Skeleton is replaced with real content

- GIVEN a Skeleton placeholder is visible in any public gym-config section
- WHEN the data resolves
- THEN the Skeleton MUST be replaced with the real formatted content
- AND the transition MUST NOT cause a layout shift (the Skeleton's dimensions match the real content's dimensions)

#### Scenario: Skeleton is non-interactive

- GIVEN a Skeleton placeholder is rendered in a public gym-config section
- WHEN a user attempts to click, focus, or copy from the skeleton
- THEN the element MUST NOT be interactive (no clickable, no selectable text, no focusable element)
- AND the user MUST NOT be misled into believing the placeholder is real content
