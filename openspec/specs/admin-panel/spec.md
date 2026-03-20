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
