# Gym Configuration Specification

## Purpose

Define how gym display information (name, hours, address, social links) is managed by admins and consumed by the public app. The system MUST support admin editing via a dedicated page, public read access from Server Components, and a three-step name resolution chain (`DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"`) for unauthenticated contexts. No specific brand name may be hardcoded as a fallback.

---

## Requirements

### Requirement: Public Gym Data Consumption

Server Components and Server Actions MUST read the current gym configuration from the database and render it in headers, sidebars, and public information sections.

#### Scenario: Public page reads gym name

- GIVEN a Gym record exists with `nombre = "Titanium Gym"`
- WHEN the homepage Server Component renders
- THEN the rendered output MUST contain the string "Titanium Gym"

#### Scenario: Public page reads hours

- GIVEN a Gym record exists with `horario = "Lun-Vie 7:00-22:00"`
- WHEN `HoursSection` renders
- THEN the output MUST contain "Lun-Vie 7:00-22:00"

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

#### Scenario: NULL fields render empty, not fake data

- GIVEN a Gym record with `nombre` and `price` set, but all new display fields are NULL
- WHEN any public component renders
- THEN the component MUST NOT throw
- AND sections depending on a NULL field MUST render an empty/placeholder state (never hardcoded fake data)

### Requirement: Admin Gym Configuration Page

The system MUST provide `/admin/config`, auth-guarded by the existing admin middleware, that lets authenticated admins view and edit all gym configuration fields.

#### Scenario: Admin opens config page

- GIVEN an authenticated admin visits `/admin/config`
- WHEN the page renders
- THEN a form MUST display inputs for: nombre, horario, direccion, mapsEmbedUrl, socialInstagram, socialWhatsapp
- AND each input MUST be pre-filled with the current DB value

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

All gym config input MUST be validated server-side via Zod. Errors MUST be returned in `FormState<T>` and rendered near the offending input.

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

#### Scenario: Optional fields accept empty

- GIVEN an admin submits empty values for `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`
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
