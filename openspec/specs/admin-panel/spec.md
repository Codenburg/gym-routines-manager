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

### Requirement: Gym Price Configuration

Admins MUST be able to view and edit the gym subscription price.

#### Scenario: Display current price

- GIVEN The admin page loads
- WHEN The component fetches from GET /api/gym
- THEN The current price MUST be displayed in a readable format (e.g., "$45.000")

#### Scenario: Loading state

- GIVEN The admin page is loading
- WHEN The API request is in flight
- THEN A loading skeleton or spinner MUST be displayed

#### Scenario: API error handling

- GIVEN The API is unavailable or returns an error
- WHEN The component attempts to fetch the price
- THEN An error message MUST be displayed to the user
- AND The user SHOULD be able to retry

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

#### Scenario: Save new price

- GIVEN The user is in edit mode with a valid new price
- WHEN The user clicks "Guardar"
- THEN The PATCH /api/gym request MUST be sent with the new price
- AND On success, the display MUST update with the new price
- AND The component MUST exit edit mode

#### Scenario: Save with invalid input

- GIVEN The user is in edit mode with invalid input (negative, zero, non-numeric)
- WHEN The user clicks "Guardar"
- THEN A validation error message MUST be displayed
- AND The request MUST NOT be sent to the API

#### Scenario: Price formatting

- GIVEN The price value is 45000
- WHEN The price is rendered for display
- THEN It MUST be displayed as "$45.000" (peso sign, thousand separator)

#### Scenario: Remove hardcoded price from public pages

- GIVEN The informacion page loads
- WHEN The page renders the price section
- THEN The price MUST be fetched from GET /api/gym
- AND There MUST NOT be any hardcoded "$45.000" in the source

### Component Specification

#### Gym Price Editor Component

**Location**: `src/components/admin/` (new file)

**States**:
- `loading`: Display skeleton/spinner while fetching
- `display`: Show current price with edit button
- `editing`: Show input field with save/cancel buttons
- `saving`: Show loading state while PATCH request is in flight
- `error`: Show error message with retry option

**Props** (if exposed):
- None required (fetches its own data)

**Internal Data**:
- `price`: number | null
- `isEditing`: boolean
- `inputValue`: string
- `isLoading`: boolean
- `isSaving`: boolean
- `error`: string | null

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| ACGP1 | Admin component fetches price from GET /api/gym on mount |
| ACGP2 | Admin component displays formatted price (e.g., "$45.000") |
| ACGP3 | "Editar precio" button activates edit mode |
| ACGP4 | Numeric input accepts only valid numbers |
| ACGP5 | Save button sends PATCH request with new price |
| ACGP6 | Refetch occurs after successful save |
| ACGP7 | Error states are handled gracefully |
| ACGP8 | Loading states are displayed appropriately |
| ACGP9 | informacion/page.tsx no longer contains hardcoded "$45.000" |
| ACGP10 | No other hardcoded price constants exist in the codebase |

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
