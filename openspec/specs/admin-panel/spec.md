# Admin Panel Specification

## Purpose

This spec defines the requirements and behavior for the Admin Panel feature of the gym-routines-manager application.

---

## Requirements

### Requirement: Authentication System

The system MUST provide a secure authentication system using Better Auth with DNI/password login.

#### Scenario: Admin Login

- GIVEN the admin is on the login page at `/admin/login`
- WHEN the admin enters valid credentials
- THEN the admin is redirected to the dashboard
- AND a session cookie is set

#### Scenario: Invalid Credentials

- GIVEN the admin is on the login page
- WHEN the admin enters invalid credentials
- THEN an error message is displayed
- AND the admin remains on the login page

#### Scenario: Unauthenticated Access

- GIVEN an unauthenticated user tries to access `/admin/*`
- THEN the user is redirected to `/admin/login`

---

### Requirement: Authorization

The system MUST verify admin role for all administrative actions.

#### Scenario: Non-admin Access

- GIVEN an authenticated user without admin role tries to access `/admin/*`
- THEN the user is redirected to the home page

#### Scenario: Server Action Access

- GIVEN a user calls a server action without admin session
- THEN the action returns `{ success: false, message: "No tienes permisos de administrador" }`

---

### Requirement: Dashboard

The admin dashboard MUST display statistics and quick actions.

#### Scenario: View Dashboard

- GIVEN an authenticated admin visits `/admin`
- THEN the dashboard displays:
  - Total number of routines
  - Total number of days
  - Total number of exercises
  - Quick action buttons
  - Recent routines list

---

### Requirement: CRUD Operations

Admins MUST be able to create, read, update, and delete routines, days, and exercises.

#### Scenario: Create Routine

- GIVEN an authenticated admin visits `/admin/rutinas/new`
- WHEN the admin fills the form and submits
- THEN a new routine is created
- AND the admin is redirected to the routines list

#### Scenario: Edit Routine

- GIVEN an authenticated admin visits `/admin/rutinas/[id]`
- WHEN the admin modifies the routine data
- THEN the routine is updated
- AND the changes are reflected immediately

#### Scenario: Delete Routine

- GIVEN an authenticated admin is on the routine edit page
- WHEN the admin clicks delete
- THEN the routine is permanently deleted
- AND the admin is redirected to the routines list

---

### Requirement: Day Management

Admins MUST be able to manage days within routines.

#### Scenario: Add Day

- GIVEN an authenticated admin is editing a routine
- WHEN the admin adds a new day
- THEN the day is created with auto-generated order

#### Scenario: Delete Day

- GIVEN an authenticated admin is editing a routine
- WHEN the admin deletes a day
- THEN all exercises in that day are also deleted (cascade)

---

### Requirement: Exercise Management

Admins MUST be able to manage exercises within days.

#### Scenario: Add Exercise

- GIVEN an authenticated admin is on the day detail page
- WHEN the admin adds a new exercise
- THEN the exercise is created with auto-generated order

#### Scenario: Reorder Exercises

- GIVEN an authenticated admin is on the day detail page
- WHEN the admin drags exercises to reorder
- THEN the order is saved to the database
- AND the UI updates immediately

---

### Requirement: Input Validation

All inputs MUST be validated server-side using Zod.

#### Scenario: Invalid UUID

- GIVEN an admin submits a form with invalid UUID
- THEN the server returns validation error
- AND the error is displayed to the admin

#### Scenario: Invalid JSON in Reorder

- GIVEN an admin triggers reorder with malformed JSON
- THEN the server returns "Formato de IDs inválido"
- AND no 500 error occurs

---

### Requirement: Security

The system MUST implement security best practices.

#### Scenario: Session Handling

- GIVEN a user logs in
- THEN the session is managed via HTTP-only cookies
- AND the client does NOT store session in localStorage

#### Scenario: Protected Routes

- GIVEN an unauthenticated user tries to access `/admin/*` except `/admin/login`
- THEN the user is redirected to login
- AND the original URL is preserved for redirect after login

---

## Technical Implementation

### Authentication
- **Library**: Better Auth v1.5.4
- **Database**: Prisma with PostgreSQL
- **Session**: HTTP-only cookies (7 days expiry)

### Authorization
- **Middleware**: Verifies session and admin role
- **Server Actions**: Each action calls verifyAdmin()

### State Management
- **Client State**: Zustand (in-memory, no persistence)
- **Server State**: Server Components with revalidatePath

### Validation
- **Library**: Zod v4
- **Validation Points**: Form submission, API parameters

### API Layers
1. **Middleware**: Route protection
2. **Server Actions**: Business logic with auth
3. **Public API**: Read-only endpoints

---

### Requirement: Gym Price Configuration (FormState + useActionState)

Admins MUST be able to view and edit the gym subscription price. The server action MUST return `FormState<T>` and the component MUST use `useActionState` (React 19). On successful save, a toast notification MUST be displayed.

#### Scenario: Display current price

- GIVEN The admin page loads
- WHEN The component fetches from GET /api/gym
- THEN The current price MUST be displayed in a readable format (e.g., "$45.000")

#### Scenario: Loading state

- GIVEN The admin page is loading
- WHEN The API request is in flight
- THEN A loading skeleton or spinner MUST be displayed

#### Scenario: Enter edit mode

- GIVEN The admin user is viewing the price display
- WHEN The user clicks the "Editar precio" button
- THEN The display MUST change to a numeric input field
- AND The current price MUST be pre-filled in the input

#### Scenario: Cancel edit

- GIVEN The user is in edit mode with unsaved changes
- WHEN The user clicks a cancel button
- THEN The input MUST be discarded
- AND The original price MUST be displayed again

#### Scenario: Save new price with success toast

- GIVEN The user is in edit mode with a valid new price
- WHEN The user clicks "Guardar"
- THEN The server action MUST be called with `useActionState`
- AND On success, the display MUST update with the new price
- AND The component MUST exit edit mode
- AND A toast success notification MUST be displayed: "Precio actualizado exitosamente"

#### Scenario: Save with validation error

- GIVEN The user is in edit mode with invalid input (less than 1000, more than 500000, or more than 2 decimal places)
- WHEN The user clicks "Guardar"
- THEN A validation error message MUST be displayed below the input
- AND The request MUST NOT complete

#### Scenario: Save with server error

- GIVEN The user is in edit mode with valid input
- WHEN The server action returns an error
- THEN A toast error notification MUST be displayed with the error message
- AND The component MUST remain in edit mode

#### Scenario: Price formatting

- GIVEN The price value is 45000
- WHEN The price is rendered for display
- THEN It MUST be displayed as "$45.000" (peso sign, thousand separator)

#### Scenario: Input sync with server state

- GIVEN The user is in edit mode
- WHEN The server action returns a new price (e.g., after another user edited)
- THEN The input MUST resync using `key={serverPrice}` to force re-mount

#### Scenario: Second consecutive edit shows toast

- GIVEN The user just completed an edit and the form closed
- WHEN The user clicks "Editar precio" again and saves
- THEN A toast MUST be displayed (the useEffect dependency on isPending ensures this fires every time)

### Component Specification

#### Gym Price Editor Component

**Location**: `src/components/admin/GymPriceEditor.tsx`

**Architecture**: Uses React 19 `useActionState` with the `updateGymPrice` server action.

**State Management**:
- Server state: `useActionState(updateGymPrice, initialState)` returns `[state, formAction, isPending]`
- Local UI state: `useState(false)` for `isEditing`

**Input Sync Rule**: Inputs consuming server action data MUST use either:
1. Controlled: `value={state.data?.x}` + `onChange`
2. Uncontrolled with resync: `defaultValue={state.data?.x}` + `key={state.data?.x}`

**Toast Pattern**:
```typescript
useEffect(() => {
  if (!isPending && state.success) {
    setIsEditing(false);
    toast.success("Precio actualizado exitosamente");
  }
}, [isPending, state.success]);
```

**Validation**: Zod schema enforces min 1000, max 500000, max 2 decimal places.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| ACGP1 | `updateGymPrice` signature is `(prevState: FormState<{ price: number }>, formData: FormData)` |
| ACGP2 | `updateGymPrice` returns `FormState<{ price: number }>` |
| ACGP3 | GymPriceEditor uses `useActionState` instead of manual try/catch |
| ACGP4 | Zod validation rejects prices < 1000, > 500000, or > 2 decimals |
| ACGP5 | Toast appears on successful save (including second consecutive edit) |
| ACGP6 | Edit form closes after successful save |
| ACGP7 | Validation errors display below input without closing form |
| ACGP8 | Input uses `defaultValue` + `key={serverPrice}` for sync |

---

### Requirement: Admin Profile Header Component

The admin header MUST display a profile button on the right side showing the authenticated admin's name with a User icon. The profile button MUST open a dropdown menu when clicked.

The system SHALL display the admin's name from the session data.

#### Scenario: Profile button displays admin name

- GIVEN an authenticated admin is on any admin panel page
- WHEN the header renders
- THEN a profile button MUST be visible on the right side of the header
- AND the button MUST display the User icon from lucide-react
- AND the button MUST display the admin's name from `session.user.name`

#### Scenario: Profile dropdown opens on click

- GIVEN an authenticated admin is on any admin panel page
- AND the profile dropdown is closed
- WHEN the admin clicks the profile button
- THEN the dropdown MUST open
- AND the dropdown MUST be aligned to the right edge of the profile button
- AND the button MUST show aria-expanded="true"

#### Scenario: Profile dropdown closes on click outside

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the admin clicks anywhere outside the dropdown
- THEN the dropdown MUST close
- AND the profile button MUST show aria-expanded="false"

#### Scenario: Profile dropdown closes on Escape key

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the admin presses the Escape key
- THEN the dropdown MUST close
- AND the profile button MUST regain focus
- AND the button MUST show aria-expanded="false"

#### Scenario: Profile button has correct accessible attributes

- GIVEN an authenticated admin is on any admin panel page
- WHEN the profile button is rendered
- THEN the button MUST have aria-expanded attribute reflecting open/closed state
- AND the button MUST have aria-haspopup="true"
- AND the dropdown MUST have role="menu"

---

### Requirement: Logout Functionality

The dropdown menu MUST provide a "Cerrar sesión" option that, when clicked, MUST clear the session and redirect the user to the login page.

The system SHALL use the existing signOut function from `@/lib/auth-client`.

#### Scenario: Logout option visible in dropdown

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the dropdown renders
- THEN a "Cerrar sesión" option MUST be visible
- AND it SHOULD include a LogOut icon

#### Scenario: Logout clears session and redirects

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the admin clicks "Cerrar sesión"
- THEN the session MUST be cleared (token removed)
- AND the admin MUST be redirected to /admin/login
- AND the admin MUST NOT be able to access admin pages without re-authenticating

---

### Requirement: Visual States

The profile button and dropdown options MUST have visible hover and active states for better user experience.

The system SHOULD use consistent button styling with the existing shadcn/ui Button component.

#### Scenario: Profile button hover state

- GIVEN an authenticated admin hovers over the profile button
- THEN a visual hover state MUST be visible (background color change or similar)

#### Scenario: Logout option hover state

- GIVEN an authenticated admin hovers over "Cerrar sesión" in the dropdown
- THEN a visual hover state MUST be visible
- AND the cursor MUST be pointer

---

### Requirement: Dropdown Alignment

The dropdown menu MUST be positioned aligned to the profile button, appearing directly below it with proper spacing.

The dropdown SHALL NOT overflow the viewport.

#### Scenario: Dropdown aligns to button

- GIVEN an authenticated admin opens the profile dropdown
- WHEN the dropdown renders
- THEN the dropdown's left edge MUST align with the profile button's left edge
- OR the dropdown's right edge MUST align with the profile button's right edge (right-aligned)

---

### Requirement: Session Data Fallback

If session data is unavailable or admin name is not set, the system SHALL display a fallback value or hide the name gracefully.

#### Scenario: No admin name in session

- GIVEN an authenticated admin is on the admin panel
- AND session.user.name is undefined or empty
- WHEN the header renders
- THEN the profile button SHOULD display a fallback (e.g., "Admin" or just the User icon)
- AND the application MUST NOT crash

---

## Role-Based Access Control

This section defines requirements for the admin-trainer-roles system that replaces the flat `admin: boolean` with a `role` enum.

### Requirement: Role-Based Authorization

The system MUST verify user role for all administrative actions. The layout MUST redirect non-admin-trainer users to the homepage.

#### Scenario: Admin user accesses admin panel

- GIVEN a user with role ADMIN is authenticated
- WHEN they navigate to /admin
- THEN the admin panel MUST be accessible
- AND all admin features MUST be available

#### Scenario: Trainer user accesses admin panel

- GIVEN a user with role TRAINER is authenticated
- WHEN they navigate to /admin
- THEN the admin panel MUST be accessible
- AND only Rutinas and Feriados features MUST be available

#### Scenario: Regular user redirected to homepage

- GIVEN a user with role USER is authenticated
- WHEN they navigate to /admin
- THEN the user MUST be redirected to the homepage
- AND the admin panel MUST NOT be accessible

### Requirement: Trainer Management Panel

Admins MUST be able to manage trainers via a dedicated UI at `/admin/trainers`.

#### Scenario: Admin sees Trainers nav item

- GIVEN an authenticated admin with role ADMIN
- WHEN the admin sidebar renders
- THEN the "Entrenadores" nav item MUST be visible

#### Scenario: Trainer does not see Trainers nav item

- GIVEN an authenticated user with role TRAINER
- WHEN the trainer sidebar renders
- THEN the "Entrenadores" nav item MUST NOT be visible

#### Scenario: Admin creates a new trainer

- GIVEN an authenticated admin visits `/admin/trainers`
- WHEN the admin fills the trainer creation form and submits
- THEN a new user with role TRAINER MUST be created
- AND the trainer can log in with the provided credentials

#### Scenario: Admin updates a trainer

- GIVEN an authenticated admin visits `/admin/trainers`
- WHEN the admin selects an existing trainer and updates their data
- THEN the trainer's data MUST be updated in the database

#### Scenario: Admin deletes (deactivates) a trainer

- GIVEN an authenticated admin visits `/admin/trainers`
- WHEN the admin deletes a trainer
- THEN the trainer's role MUST be set to USER (soft delete)
- AND the trainer MUST NOT be able to log in

### Requirement: Sidebar Navigation Filtered by Role

The sidebar navigation items MUST be filtered based on the user's role.

#### Scenario: Admin sees all nav items

- GIVEN an authenticated admin with role ADMIN
- WHEN the admin sidebar renders
- THEN all nav items MUST be visible:
  - Dashboard
  - Rutinas
  - Entrenadores
  - Feriados
  - Promociones
  - Gym

#### Scenario: Trainer sees only permitted nav items

- GIVEN an authenticated trainer with role TRAINER
- WHEN the trainer sidebar renders
- THEN only these nav items MUST be visible:
  - Rutinas
  - Feriados
- AND these items MUST NOT be visible:
  - Entrenadores
  - Promociones
  - Gym

### Requirement: Trainer Routine Isolation

Trainers MUST only be able to view and manage their own routines. Admins can view and manage all routines.

#### Scenario: Trainer sees only their routines

- GIVEN an authenticated trainer with role TRAINER
- WHEN the trainer views the rutinas list
- THEN only routines where `creadorId === trainer.id` MUST be displayed
- AND routines created by other trainers or admins MUST NOT be visible

#### Scenario: Trainer creates routine with their creator ID

- GIVEN an authenticated trainer with role TRAINER
- WHEN the trainer creates a new routine
- THEN the routine's `creadorId` MUST be set to the trainer's user ID

#### Scenario: Trainer cannot edit other trainer's routine

- GIVEN an authenticated trainer with role TRAINER
- AND a routine created by another trainer
- WHEN the trainer attempts to edit the other trainer's routine
- THEN the edit MUST be rejected
- AND an error message MUST be displayed

#### Scenario: Admin sees all routines

- GIVEN an authenticated admin with role ADMIN
- WHEN the admin views the rutinas list
- THEN ALL routines from all trainers and admins MUST be displayed

### Requirement: Trainer Redirect on Protected Routes

Trainers MUST be redirected to `/admin/rutinas` when attempting to access protected routes.

#### Scenario: Trainer accessing trainers page

- GIVEN an authenticated trainer with role TRAINER
- WHEN the trainer navigates to `/admin/trainers`
- THEN the trainer MUST be redirected to `/admin/rutinas`
- AND an error message MAY be displayed

#### Scenario: Trainer accessing promociones page

- GIVEN an authenticated trainer with role TRAINER
- WHEN the trainer navigates to `/admin/promociones`
- THEN the trainer MUST be redirected to `/admin/rutinas`

#### Scenario: Trainer accessing descuentos page

- GIVEN an authenticated trainer with role TRAINER
- WHEN the trainer navigates to `/admin/descuentos-duracion`
- THEN the trainer MUST be redirected to `/admin/rutinas`

---

## Gym Configuration Admin Page

This section defines requirements for the admin gym configuration page and its navigation entry.

### Requirement: Admin Config Page Navigation

The admin sidebar MUST expose a "Configuración" (or equivalently named) nav item that links to `/admin/config`. The item MUST follow the existing visual conventions of other admin sidebar items and MUST be visible to all admin roles that have access to the gym configuration feature.

#### Scenario: Admin sees Configuración nav item

- GIVEN an authenticated admin with role ADMIN
- WHEN the admin sidebar renders
- THEN a nav item linking to `/admin/config` MUST be visible
- AND the label MUST reflect gym configuration intent (e.g., "Configuración" or "Gym")

#### Scenario: Clicking the nav item navigates to the config page

- GIVEN an authenticated admin clicks the config nav item in the sidebar
- WHEN the navigation completes
- THEN the user MUST be on the `/admin/config` page
- AND the sidebar item MUST reflect the active route

### Requirement: Admin Config Form Layout

The `/admin/config` page MUST render a form organized into logical field groups, matching the existing `FormState<T>` + `useActionState` pattern used by `GymPriceEditor`. Each group MUST be independently submittable so an admin can save one section without re-validating the others. The Hours & Address group MUST replace its previous free-text `horario` textarea with a `WeeklyScheduleEditor` component that renders 7 day cards in a fixed order.
(Previously: The Hours & Address group exposed a single `<textarea>` for `horario`.)

#### Scenario: Config page renders all field groups

- GIVEN an authenticated admin visits `/admin/config`
- WHEN the page renders
- THEN a form MUST display input fields grouped as: Identity (nombre), Hours & Address (WeeklyScheduleEditor + direccion + mapsEmbedUrl), Social (socialInstagram, socialWhatsapp)
- AND each group MUST have its own "Guardar" button
- AND the WeeklyScheduleEditor MUST display 7 day cards in order: lun, mar, mie, jue, vie, sab, dom

#### Scenario: Schedule editor renders one card per day

- GIVEN the WeeklyScheduleEditor mounts on `/admin/config`
- WHEN the editor renders
- THEN 7 cards MUST be visible, one per weekday in fixed order (lun → dom)
- AND each card MUST show: a day label, an Abierto/Cerrado switch, an Apertura time input, a Cierre time input

#### Scenario: Closed day disables time inputs

- GIVEN a day card with the Abierto switch toggled OFF
- WHEN the card renders
- THEN the Apertura and Cierre time inputs MUST be disabled (or visually inert)
- AND the persisted value for that day MUST be `{ abierto: false, apertura: null, cierre: null }`

#### Scenario: Open day enables time inputs

- GIVEN a day card with the Abierto switch toggled ON
- WHEN the card renders
- THEN the Apertura and Cierre time inputs MUST be enabled
- AND both inputs MUST be required for the form to submit successfully (Zod enforces non-null when `abierto: true`)

#### Scenario: Inputs sync with server state

- GIVEN the Gym record is updated by another admin while the form is open
- WHEN the page re-fetches (e.g., after a save in another tab)
- THEN the input fields MUST re-sync with the latest server values
- AND the implementation MUST follow the controlled-or-key-resync rule from `react_rules.server_action_inputs` in `openspec/config.yaml`

#### Scenario: Validation errors display inline

- GIVEN an admin submits a group with invalid input (e.g., empty nombre, malformed URL)
- WHEN the server action returns a `FormState` with `errors`
- THEN the error message MUST be rendered near the offending input
- AND the form MUST remain in edit mode (not collapse or close)

#### Scenario: Success toast on save

- GIVEN an admin submits a group with valid input
- WHEN the server action returns `{ success: true }`
- THEN a success toast MUST be displayed (e.g., "Configuración actualizada")
- AND the page MUST reflect the new persisted values

### Requirement: Config Page Auth Integration

The `/admin/config` page MUST be protected by the same auth middleware that guards the rest of the admin panel. Unauthenticated users MUST be redirected to `/admin/login`. Non-admin users (role USER) MUST be redirected to the homepage. Trainer users (role TRAINER) MUST be redirected to `/admin/rutinas` per the existing RBAC rules.

#### Scenario: Unauthenticated redirect

- GIVEN no session exists
- WHEN a request to `/admin/config` is made
- THEN the user MUST be redirected to `/admin/login`

#### Scenario: Regular user blocked

- GIVEN a user with role USER is authenticated
- WHEN the user navigates to `/admin/config`
- THEN the user MUST be redirected to the homepage

### Requirement: WeeklyScheduleEditor interactions

The `WeeklyScheduleEditor` client component MUST provide a per-day editing experience for the structured `horarioJson` payload. The editor MUST submit the full weekly object in a single action call (one submission, not per-day saves).

#### Scenario: Initial state from server

- GIVEN the Gym record has `horarioJson = { lun: { abierto: true, apertura: "08:00", cierre: "22:00" }, ... }`
- WHEN the editor mounts
- THEN each day card MUST be pre-filled with the server value (switch position + time inputs)
- AND the editor MUST send a `field="horarioJson"` submission carrying the full weekly object

#### Scenario: Toggle Abierto updates day state

- GIVEN the admin toggles the Abierto switch for `lun` from OFF to ON
- WHEN the toggle fires
- THEN the editor's local state for `lun.abierto` MUST become `true`
- AND the Apertura/Cierre inputs for that day MUST become enabled
- AND if the previous state had `apertura: null, cierre: null`, the editor SHOULD provide default times (e.g. `09:00–18:00`) so the form can submit

#### Scenario: Toggle Abierto off clears times

- GIVEN the admin toggles the Abierto switch for `lun` from ON to OFF
- WHEN the toggle fires
- THEN the editor's local state for that day MUST be `{ abierto: false, apertura: null, cierre: null }`
- AND the time inputs MUST become disabled

#### Scenario: Edit time inputs

- GIVEN a day is open and the admin changes `apertura` to `07:30`
- WHEN the time input fires `onChange`
- THEN the editor's local state for that day's `apertura` MUST be `"07:30"`
- AND the input MUST use `<input type="time">` for native browser time pickers

#### Scenario: Save submits the full object

- GIVEN the admin clicks the Hours & Address "Guardar" button
- WHEN the form submits
- THEN the editor MUST send a single `updateGymField` call with `field="horarioJson"` and the entire weekly object (all 7 days)
- AND on success, the editor MUST NOT submit per-day

#### Scenario: Per-day data-testid selectors

- GIVEN the editor renders
- WHEN the DOM is queried
- THEN each day card MUST expose a `data-testid="day-card-${code}"` (where `${code}` ∈ {lun, mar, mie, jue, vie, sab, dom})
- AND the Abierto switch MUST expose `data-testid="toggle-${code}"`
- AND the time inputs MUST expose `data-testid="time-${code}-apertura"` and `data-testid="time-${code}-cierre"`

#### Scenario: Validation error renders near editor

- GIVEN the admin submits a malformed `horarioJson` (e.g. one day with `abierto: true` but `apertura: null`)
- WHEN the server action returns a validation error for `horarioJson`
- THEN the editor MUST display the error message at the top of the schedule form
- AND the form MUST remain in edit mode

#### Scenario: Save without changes does not error

- GIVEN the editor pre-fills with the current server state
- AND the admin clicks "Guardar" without modifying any day
- WHEN the form submits
- THEN the server action MUST accept the submission (idempotent)
- AND the action MUST return `{ success: true }`

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| ACGCA1 | The admin sidebar exposes a "Configuración" nav item linking to `/admin/config`, visible to admins only |
| ACGCA2 | `/admin/config` renders 3 sub-form groups: Identity, Hours & Address, Social, each with its own "Guardar" button |
| ACGCA3 | Inputs use the controlled-or-key-resync pattern (`value` + `onChange`, or `defaultValue` + `key={serverValue}`) to avoid desync |
| ACGCA4 | Inline validation errors render near offending input; form stays in edit mode on error |
| ACGCA5 | A success toast is displayed on `FormState.success === true`; page reflects the new persisted values |
| ACGCA6 | Unauthenticated users are redirected to `/admin/login`; USER role → homepage; TRAINER role → `/admin/rutinas` |
| ACWS1 | `WeeklyScheduleEditor` renders 7 day cards in fixed order (lun, mar, mie, jue, vie, sab, dom) |
| ACWS2 | Each day card exposes `data-testid="day-card-${code}"`, `data-testid="toggle-${code}"`, `data-testid="time-${code}-apertura"`, `data-testid="time-${code}-cierre"` for stable Playwright selectors |
| ACWS3 | Toggling Abierto OFF clears that day's `apertura`/`cierre` to `null` and disables the time inputs; toggling ON enables them |
| ACWS4 | Saving submits the entire `horarioJson` object in a single action call (not per-day) |
| ACWS5 | Closed days persist as `{ abierto: false, apertura: null, cierre: null }`; the form is idempotent on re-save |

---

## ADDED Requirements (Page Loading Overhaul — v0.18.0)

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
