# Admin Panel Specification

## Purpose

This spec defines the requirements and behavior for the Admin Panel feature of the gym-routines-manager application.

---

## Requirements

### Requirement: Authentication System

The system MUST provide a secure authentication system using Better Auth with email/password login.

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
