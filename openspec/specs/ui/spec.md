# UI Specification - Rutina Completa Creation Form

## Purpose

This specification defines the requirements and behavior for the simplified routine creation flow, enabling users to create a complete routine with days and exercises in a single page.

---

## Requirements

### Requirement: Single Page Form Access

The system MUST provide a single-page form accessible at `/admin/rutinas/nueva/completa` that allows users to create a complete routine with nested days and exercises in one submission.

#### Scenario: Accessing the complete routine creation page

- GIVEN an authenticated admin user navigates to `/admin/rutinas/nueva/completa`
- WHEN the page loads
- THEN a complete form MUST be displayed with all sections visible
- AND the URL MUST reflect the route `/admin/rutinas/nueva/completa`

---

### Requirement: Routine Data Section

The form MUST include a routine data section with the following fields:

- **nombre** (required): Text input for routine name
- **tipo** (required): Select dropdown with options "fuerza", "cardio", "flexibilidad", "hipertrofia"
- **descripcion** (optional): Textarea for routine description

#### Scenario: Routine name field required

- GIVEN the user is on `/admin/rutinas/nueva/completa`
- WHEN the user attempts to submit without entering a routine name
- THEN a validation error MUST display: "Nombre es requerido"

#### Scenario: Routine type selection

- GIVEN the user is on the form
- WHEN the user clicks the tipo dropdown
- THEN the options "fuerza", "cardio", "flexibilidad", "hipertrofia" MUST be available
- AND the user MUST select one option to proceed

---

### Requirement: Dynamic Days Management

The form MUST allow users to add and remove days dynamically.

Each day MUST contain:
- **nombre** (required): Text input for day name
- **musculosEnfocados** (optional): Text input for focused muscles
- **ejercicios** (required): Array of at least one exercise

#### Scenario: Adding a new day

- GIVEN the user is on the form with at least one day
- WHEN the user clicks "+ Agregar Día"
- THEN a new day section MUST appear below existing days
- AND the new day MUST have an empty ejercicios array

#### Scenario: Removing a day

- GIVEN the form has more than one day
- WHEN the user clicks the delete button on a day
- THEN that day section MUST be removed from the form
- AND the remaining days MUST maintain their order

#### Scenario: Minimum one day required

- GIVEN the user attempts to submit with zero days
- THEN a validation error MUST display: "Al menos un día es requerido"

---

### Requirement: Dynamic Exercises Management per Day

Each day section MUST allow users to add and remove exercises dynamically.

Each exercise MUST contain:
- **nombre** (required): Text input for exercise name
- **series** (optional): Text input for number of sets
- **repes** (optional): Text input for repetitions

#### Scenario: Adding an exercise to a day

- GIVEN the user is viewing a day section
- WHEN the user clicks "+ Agregar Ejercicio"
- THEN a new exercise row MUST appear within that day's exercise list
- AND the new exercise row MUST have empty fields

#### Scenario: Removing an exercise from a day

- GIVEN a day has more than one exercise
- WHEN the user clicks the delete button on an exercise row
- THEN that exercise row MUST be removed from the day
- AND the remaining exercises MUST maintain their order

#### Scenario: Minimum one exercise per day required

- GIVEN the user attempts to submit a day with zero exercises
- THEN a validation error MUST display: "Al menos un ejercicio por día"

#### Scenario: Exercise name required

- GIVEN the user attempts to submit without entering an exercise name
- THEN a validation error MUST display: "Nombre del ejercicio es requerido"

---

### Requirement: Form Submission with Atomic Transaction

The form MUST submit all data (routine + days + exercises) in a single action using an atomic transaction.

#### Scenario: Successful form submission

- GIVEN all required fields are filled correctly
- WHEN the user clicks "Crear Rutina"
- THEN all data MUST be saved atomically using `prisma.$transaction`
- AND on success, the user MUST be redirected to `/admin/rutinas/[id]` with the created routine

#### Scenario: Transaction failure rollback

- GIVEN any part of the transaction fails (e.g., database error)
- THEN NO data MUST be persisted to the database
- AND an error message MUST be displayed to the user

---

### Requirement: Form Validation Display

The form MUST display clear validation errors inline next to the affected fields.

#### Scenario: Inline field validation

- GIVEN a field fails validation
- WHEN the user attempts to submit
- THEN the error message MUST appear adjacent to the invalid field
- AND the invalid field SHOULD be highlighted (e.g., red border)

---

### Requirement: Form Layout Structure

The form MUST follow the specified layout structure:

```
┌─────────────────────────────────────────────────────────┐
│  NUEVA RUTINA COMPLETA                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ─── Datos de la Rutina ───                            │
│  [Nombre *]    [Tipo *]                                │
│  [Descripción]                                         │
│                                                         │
│  ─── Días de la Rutina ───                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Día 1: [Nombre *]  [Músculos Enfocados]       │   │
│  │                                                │   │
│  │ Ejercicios:                                    │   │
│  │  ┌────────────────────────────────────────┐    │   │
│  │  │ [Nombre *]  [Series]  [Repes]        │    │   │
│  │  └────────────────────────────────────────┘    │   │
│  │                                                │   │
│  │  [+ Agregar Ejercicio]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Agregar Día]                                        │
│                                                         │
│  ───────────────────────────────────────────────────   │
│  [Cancelar]                        [Crear Rutina]      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Scenario: Form sections visibility

- GIVEN the user is on the page
- THEN all sections MUST be visible without scrolling on desktop
- AND collapsible components MAY be used to manage long content

---

### Requirement: Cancel Navigation

The form MUST include a Cancel button that navigates back to the routines list.

#### Scenario: Cancel button action

- GIVEN the user clicks "Cancelar"
- THEN the user MUST be navigated to `/admin/rutinas`

---

## Data Schema (Client-Side)

The form MUST use the following Zod schema for client-side validation:

```typescript
const ejercicioSchema = z.object({
  nombre: z.string().min(1, "Nombre del ejercicio es requerido"),
  series: z.string().optional(),
  repes: z.string().optional(),
});

const diaSchema = z.object({
  nombre: z.string().min(1, "Nombre del día es requerido"),
  musculosEnfocados: z.string().optional(),
  ejercicios: z.array(ejercicioSchema).min(1, "Al menos un ejercicio por día"),
});

export const rutinaCompletaSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  tipo: z.enum(["fuerza", "cardio", "flexibilidad", "hipertrofia"]),
  descripcion: z.string().optional(),
  dias: z.array(diaSchema).min(1, "Al menos un día es requerido"),
});
```

---

## Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|--------------|
| AC1 | Page accessible at `/admin/rutinas/nueva/completa` | Navigate to URL, verify form loads |
| AC2 | Form has routine name, tipo (dropdown), descripcion fields | Visual inspection |
| AC3 | Clicking "+ Agregar Día" adds new day section | Click button, verify new section appears |
| AC4 | Clicking delete on day removes it from form | Click delete, verify removal |
| AC5 | Clicking "+ Agregar Ejercicio" adds exercise row | Click button, verify new row appears |
| AC6 | Clicking delete on exercise removes it | Click delete, verify removal |
| AC7 | Validation error shows when submitting without routine name | Submit empty, verify error message |
| AC8 | Validation error shows when submitting day without exercise | Submit empty exercise, verify error |
| AC9 | Successful submission redirects to routine detail page | Submit valid data, verify redirect |
| AC10 | Cancel button navigates to `/admin/rutinas` | Click cancel, verify navigation |
| AC11 | Transaction rolls back on database failure | Simulate failure, verify no partial data |
| AC12 | Validation errors appear inline next to fields | Trigger validation, verify error placement |

---

# UI Specification - Footer Component

## Purpose

This specification defines the requirements and behavior for the application footer component, including layout positioning and conditional visibility based on route.

## Requirements

### Requirement: Copyright Text Centering

The system MUST display the copyright text "© 2026 Codenburg" centered horizontally within the footer container.

#### Scenario: Copyright centered on footer

- GIVEN the user is on any page where the footer is visible
- WHEN the footer component renders
- THEN the text "© 2026 Codenburg" MUST appear in the horizontal center of the footer
- AND the text MUST be visually centered relative to the footer container width

#### Scenario: Copyright centered on different viewport widths

- GIVEN the user is viewing the application on any viewport width (mobile, tablet, desktop)
- WHEN the footer renders
- THEN the copyright text MUST remain horizontally centered regardless of screen size
- AND the centering MUST NOT break or overflow on small screens

---

### Requirement: Admin Button Right Alignment

The system MUST display the "Administradores" button aligned to the right side of the footer container.

#### Scenario: Admin button on right side

- GIVEN the user is on any page where the footer is visible
- WHEN the footer component renders
- THEN the "Administradores" button MUST appear at the right edge of the footer
- AND there MUST be appropriate spacing between the button and the container edge

#### Scenario: Admin button positioning relative to copyright

- GIVEN the footer is rendered with three sections (left spacer, center copyright, right button)
- WHEN the layout is computed
- THEN the copyright text MUST be centered between the left and right sections
- AND the admin button MUST be positioned at the far right

---

### Requirement: Footer Hidden on Admin Login Page

The system MUST NOT render the footer component when the user navigates to the `/admin/login` route.

#### Scenario: Footer hidden on /admin/login

- GIVEN the user navigates to `/admin/login`
- WHEN the page renders
- THEN the footer component MUST NOT be visible
- AND the footer markup MUST NOT be present in the DOM

#### Scenario: Footer visible on other admin routes

- GIVEN the user navigates to `/admin` or any other admin route except `/admin/login`
- WHEN the page renders
- THEN the footer component MUST be visible
- AND display normally with centered copyright and right-aligned button

#### Scenario: Footer visible on public pages

- GIVEN the user navigates to any public route (e.g., `/`, `/rutinas`, `/ejercicios`)
- WHEN the page renders
- THEN the footer component MUST be visible
- AND display with the required centered copyright and right-aligned button

---

### Requirement: Client-Side Route Detection

The system MUST use client-side route detection to determine whether to hide the footer.

#### Scenario: Client component handles route detection

- GIVEN the footer component is converted to a client component
- WHEN the component mounts or the route changes
- THEN the component MUST use `usePathname` from `next/navigation` to detect the current route
- AND MUST return `null` when pathname equals `/admin/login`

---

## Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|--------------|
| ACF1 | Copyright text "© 2026 Codenburg" is horizontally centered in footer | Visual inspection |
| ACF2 | "Administradores" button is aligned to the right edge of footer | Visual inspection |
| ACF3 | Footer is completely absent on `/admin/login` page | Navigate to route, verify no footer in DOM |
| ACF4 | Footer appears on `/admin` (dashboard) | Navigate to route, verify footer visible |
| ACF5 | Footer appears on public pages (e.g., `/`, `/rutinas`) | Navigate to routes, verify footer visible |
| ACF6 | TypeScript compiles without errors | Run `npm run build` or `npx tsc --noEmit` |
| ACF7 | ESLint passes without new warnings | Run `npm run lint` |
