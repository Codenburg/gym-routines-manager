# Delta for Admin Panel

## ADDED Requirements

### Requirement: Admin Layout Loading State

The admin layout (`src/app/(admin)/admin/layout.tsx`) MUST render a visible loading state while the auth check is in flight. The auth gate MUST remain in the layout (redirect on no session is the security boundary), but the visible UI between the request starting and the redirect-to-dashboard (or redirect-to-login) MUST be a branded skeleton — not a blank page or a flash of the homepage's loading state.

#### Scenario: Auth check in flight shows branded skeleton

- GIVEN a user navigates to `/admin/*` (any admin subroute)
- WHEN the layout's auth check (`auth.api.getSession`) is in flight
- THEN the user MUST see a visible admin-shaped loading state (a centered `DumbbellSpinner` or a skeleton admin shell)
- AND the user MUST NOT see the homepage's loading state (no "Gimnasio" header + routine cards)

#### Scenario: Unauthenticated redirect happens after loading

- GIVEN a user with no session navigates to `/admin/*`
- WHEN the auth check resolves with no session
- THEN the layout MUST redirect to `/admin/login`
- AND the loading skeleton MUST be visible during the brief in-flight window

#### Scenario: Authenticated user sees admin shell

- GIVEN a user with a valid admin/trainer session navigates to `/admin/*`
- WHEN the auth check resolves
- THEN the layout MUST render the admin shell (sidebar + header) without a full-page flash
- AND the child page's own `loading.tsx` MUST take over once the layout's auth check is complete

### Requirement: Admin Dashboard Loading State

The admin dashboard `loading.tsx` (co-located with `src/app/(admin)/admin/page.tsx`) MUST render a page-shaped skeleton: 3 stat-card placeholders in a row + 6 routine-card placeholders in a grid. The skeleton MUST match the dashboard's eventual layout shape.

#### Scenario: Dashboard loading shows 3 stat cards + 6 routine cards

- GIVEN the user navigates to `/admin`
- WHEN the dashboard data (`getStats`, `getRutinas`, `getGymConfigForServer`) is in flight
- THEN the dashboard `loading.tsx` MUST render 3 stat-card skeletons in a row
- AND MUST render 6 routine-card skeletons in a 2-3 column grid
- AND MUST render a PageHeader skeleton (title bar + back link)
- AND the skeletons MUST use the `<Skeleton>` UI primitive

#### Scenario: Dashboard loading transitions to data

- GIVEN the dashboard `loading.tsx` skeleton is displayed
- WHEN the data finishes loading
- THEN the skeleton MUST be replaced with the real dashboard content
- AND the transition MUST NOT cause a layout shift

### Requirement: Admin Session Deduplication

All admin Server Components and Server Actions within a single request MUST share a single `auth.api.getSession` call. The system MUST expose a session reader (e.g. `getAdminSession` in `src/lib/admin-session.ts`) that is wrapped in `React.cache()` so that repeated calls within the same request return the same session object without an additional database round-trip. Child admin pages MUST call this shared reader instead of calling `auth.api.getSession` directly.

#### Scenario: Single session read per request

- GIVEN the admin layout, a child page (e.g. `/admin/rutinas`), and a child component all need the session
- WHEN the request is in flight
- THEN `auth.api.getSession` MUST be called exactly once
- AND all consumers MUST receive the same session object via the cached reader
- AND the layout's session check (security gate) MUST still execute and still be authoritative

#### Scenario: Child page uses shared reader

- GIVEN a child admin page (e.g. `admin/rutinas/page.tsx`, `admin/rutinas/[id]/dias/[diaId]/page.tsx`, `admin/trainers/page.tsx`, `admin/config/page.tsx`) needs the session for role-based logic
- WHEN the page is rendered
- THEN the page MUST call the shared cached session reader (e.g. `getAdminSession()`)
- AND MUST NOT call `auth.api.getSession` directly
- AND the role/ownerId from the session MUST still be available for downstream logic

#### Scenario: Cache is per-request

- GIVEN two separate HTTP requests hit the admin panel
- WHEN each request resolves its session
- THEN each request MUST have its own cached session (no cross-request leakage)
- AND `React.cache()`'s per-request memoization MUST scope the cache correctly

### Requirement: Per-Page Admin Loading States

Each admin page (rutinas list, rutinas/new, rutinas/[id], rutinas/[id]/dias/[diaId], promociones, descuentos-duracion, feriados, trainers, config, dashboard) MUST have a co-located `loading.tsx` file that renders a page-shaped skeleton matching the destination page's layout. The loading files MUST use the `<Skeleton>` UI primitive, NOT raw `bg-muted animate-pulse` divs. The skeleton files SHOULD reuse extracted shared components (`FeriadosSkeleton`, `RutinasFormSkeleton`, `RoutineListSkeleton`) where applicable.

| Admin page | Loading skeleton shape |
|------------|------------------------|
| `/admin` (dashboard) | PageHeader + 3 stat cards + 6 routine cards |
| `/admin/rutinas` | PageHeader + 6-card grid (reuses `RoutineListSkeleton`) |
| `/admin/rutinas/new` | PageHeader + form (reuses `RutinasFormSkeleton`) |
| `/admin/rutinas/[id]` | PageHeader + 2-column form skeleton |
| `/admin/rutinas/[id]/dias/[diaId]` | PageHeader + 4 exercise row skeletons |
| `/admin/promociones` | PageHeader + 4 promo card skeletons |
| `/admin/descuentos-duracion` | PageHeader + 4 discount row skeletons |
| `/admin/feriados` | PageHeader + 6 feriado row skeletons |
| `/admin/trainers` | PageHeader + 4 trainer row skeletons |
| `/admin/config` | PageHeader + 6 form field skeletons |

#### Scenario: Each admin page shows a page-shaped loading state

- GIVEN the user navigates to any admin page listed in the table above
- WHEN the page's data is in flight
- THEN the co-located `loading.tsx` MUST render a skeleton matching the page's eventual shape
- AND the skeleton MUST appear in the same layout slot the real content will occupy
- AND the user MUST NOT see a wrong-shaped skeleton (e.g. homepage cards on an admin page)

#### Scenario: Loading state replaced with content

- GIVEN a page-shaped skeleton is displayed for an admin page
- WHEN the page's data resolves
- THEN the skeleton MUST be replaced with the real content
- AND the layout MUST NOT shift

#### Scenario: Shared skeleton components are reused

- GIVEN the admin feriados loading file is being authored
- WHEN the developer composes the skeleton
- THEN the developer MUST import and render the shared `FeriadosSkeleton` (extracted from the public feriados page) if both pages need the same row shape
- AND MUST NOT duplicate the row markup in the admin loading file

#### Scenario: Routine form skeleton reused across new + edit

- GIVEN `RutinasFormSkeleton` has been extracted as a shared component
- WHEN `admin/rutinas/new/loading.tsx` and `admin/rutinas/[id]/loading.tsx` are authored
- THEN both loading files MUST import and render `RutinasFormSkeleton`
- AND the visual structure MUST be identical between new and edit forms
