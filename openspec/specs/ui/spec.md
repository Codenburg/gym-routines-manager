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
---

# UI Specification - Admin Theme CSS Variables

## Purpose

This specification defines CSS variable requirements for theming the admin panel, enabling correct rendering in both light and dark modes. All admin components MUST use CSS variables instead of hardcoded Tailwind color classes.

---

## Requirements

### Requirement: Success State CSS Variables

The system MUST define CSS variables `--success` and `--success-foreground` in `globals.css` for both light and dark themes to display success message backgrounds and text.

#### Scenario: Success variables in dark theme

- GIVEN the `.dark` class is applied to the document element
- WHEN `globals.css` is loaded
- THEN the variable `--success` MUST resolve to a green tone suitable for dark backgrounds (e.g., `#166534` or equivalent)
- AND the variable `--success-foreground` MUST resolve to white or light text (e.g., `#fafafa`)

#### Scenario: Success variables in light theme

- GIVEN the `.light` class is applied to the document element
- WHEN `globals.css` is loaded
- THEN the variable `--success` MUST resolve to a green tone suitable for light backgrounds (e.g., `#dcfce7` or equivalent)
- AND the variable `--success-foreground` MUST resolve to dark text (e.g., `#14532d`)

#### Scenario: Success variables in :root

- GIVEN no theme class is applied
- WHEN `globals.css` is loaded
- THEN the variable `--success` MUST be defined as a default green tone
- AND the variable `--success-foreground` MUST be defined as default contrasting text

---

### Requirement: Icon Badge Background Variable

The system MUST define a CSS variable `--icon-badge-bg` in `globals.css` for both light and dark themes to style icon badge backgrounds (e.g., red/green status circles).

#### Scenario: Icon badge variable in dark theme

- GIVEN the `.dark` class is applied to the document element
- WHEN `globals.css` is loaded
- THEN the variable `--icon-badge-bg` MUST resolve to a semi-transparent dark background suitable for badges

#### Scenario: Icon badge variable in light theme

- GIVEN the `.light` class is applied to the document element
- WHEN `globals.css` is loaded
- THEN the variable `--icon-badge-bg` MUST resolve to a light semi-transparent background

---

### Requirement: Theme Variable Inline Declarations

The system MUST include `--success`, `--success-foreground`, and `--icon-badge-bg` in the `@theme inline` block of `globals.css` to enable Tailwind's `var()` syntax to resolve correctly.

#### Scenario: Theme inline block includes new variables

- GIVEN `globals.css` is processed by Tailwind CSS
- WHEN Tailwind scans for `--color-*` mappings
- THEN `--color-success` MUST map to `var(--success)`
- AND `--color-success-foreground` MUST map to `var(--success-foreground)`
- AND `--color-icon-badge-bg` MUST map to `var(--icon-badge-bg)`

---

### Requirement: Admin Form Label Colors

The system MUST use `text-[var(--foreground)]` for form labels instead of hardcoded `text-white`.

#### Scenario: Form labels adapt to dark theme

- GIVEN the admin form component renders in dark mode
- WHEN the form labels (e.g., "Nombre *", "Tipo *") are displayed
- THEN the labels MUST use `text-[var(--foreground)]` which renders as light text

#### Scenario: Form labels adapt to light theme

- GIVEN the admin form component renders in light mode
- WHEN the form labels are displayed
- THEN the labels MUST use `text-[var(--foreground)]` which renders as dark text

---

### Requirement: Admin Form Input Styling

The system MUST use `bg-[var(--card-bg)]`, `border-[var(--card-border)]`, and `text-[var(--foreground)]` for form select and input elements instead of hardcoded `bg-black`, `border-white/30`, and `text-white`.

#### Scenario: Select dropdown adapts to theme

- GIVEN the admin form renders in either light or dark mode
- WHEN the tipo select dropdown is displayed
- THEN the background MUST use `bg-[var(--card-bg)]`
- AND the border MUST use `border-[var(--card-border)]`
- AND the text MUST use `text-[var(--foreground)]`

---

### Requirement: Error Message Styling

The system MUST use `bg-[var(--destructive)]/10`, `border-[var(--destructive)]/30`, and `text-[var(--destructive)]` for error message containers instead of hardcoded `bg-red-900/30`, `border-red-700/50`, and `text-red-400`.

#### Scenario: Error message styling in dark mode

- GIVEN the admin form displays an error message in dark mode
- WHEN the error message container renders
- THEN the background MUST use `bg-[var(--destructive)]/10`
- AND the border MUST use `border-[var(--destructive)]/30`
- AND the text MUST use `text-[var(--destructive)]`

#### Scenario: Error message styling in light mode

- GIVEN the admin form displays an error message in light mode
- WHEN the error message container renders
- THEN the colors MUST adapt to provide sufficient contrast on the light background

---

### Requirement: Success Message Styling

The system MUST use `bg-[var(--success)]` and `text-[var(--success-foreground)]` for success message containers instead of hardcoded `bg-green-900/30` and `text-green-400`.

#### Scenario: Success message styling in dark mode

- GIVEN the admin form displays a success message in dark mode
- WHEN the success message container renders
- THEN the background MUST use `bg-[var(--success)]`
- AND the text MUST use `text-[var(--success-foreground)]`

#### Scenario: Success message styling in light mode

- GIVEN the admin form displays a success message in light mode
- WHEN the success message container renders
- THEN the colors MUST adapt to provide sufficient contrast on the light background

---

### Requirement: Icon Button Destructive Styling

The system MUST use `hover:bg-[var(--destructive)]/10` and `text-[var(--destructive)]` for icon buttons with destructive action (e.g., delete day buttons) instead of hardcoded `hover:bg-red-900/30` and `text-red-400`.

#### Scenario: Delete day button styling in dark mode

- GIVEN the dia-section component renders the "Eliminar día" button in dark mode
- WHEN the button is displayed
- THEN the icon/text color MUST use `text-[var(--destructive)]`
- AND on hover, the background MUST use `hover:bg-[var(--destructive)]/10`

#### Scenario: Delete day button styling in light mode

- GIVEN the dia-section component renders in light mode
- WHEN the "Eliminar día" button is displayed
- THEN the colors MUST adapt appropriately for light backgrounds

---

### Requirement: Card Background Styling

The system MUST use `bg-[var(--card-bg)]` for card and panel backgrounds instead of hardcoded `bg-zinc-900` or `bg-black`.

#### Scenario: Card background adapts to theme

- GIVEN an admin card component renders in either light or dark mode
- WHEN the card background is displayed
- THEN the background MUST use `bg-[var(--card-bg)]` which adapts to the current theme

---

### Requirement: Button Hover Background

The system MUST use `hover:bg-[var(--button-secondary-bg)]` for secondary button hover states instead of hardcoded `bg-white/10`.

#### Scenario: Secondary button hover in dark mode

- GIVEN a secondary button with hover state renders in dark mode
- WHEN the user hovers over the button
- THEN the hover background MUST use `hover:bg-[var(--button-secondary-bg)]`

---

### Requirement: Delete Button Destructive Styling

The system MUST use `bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)]` for destructive action buttons (e.g., "Eliminar Rutina") instead of hardcoded `bg-red-600 hover:bg-red-700 text-white`.

#### Scenario: Delete rutina button styling in dark mode

- GIVEN the delete-rutina-button component renders in dark mode
- WHEN the button is displayed
- THEN the background MUST use `bg-[var(--destructive)]`
- AND the hover opacity MUST use `hover:opacity-90`
- AND the text color MUST use `text-[var(--destructive-foreground)]`

#### Scenario: Delete rutina button styling in light mode

- GIVEN the delete-rutina-button component renders in light mode
- WHEN the button is displayed
- THEN the colors MUST adapt to maintain visibility and contrast

---

### Requirement: No Hardcoded Dark Theme Colors

The system MUST NOT use hardcoded Tailwind color classes for background, border, and text colors in admin components. All colors MUST reference CSS variables.

#### Scenario: No hardcoded bg-zinc-900 in admin components

- GIVEN an admin component file is refactored
- WHEN the file is saved
- THEN the class `bg-zinc-900` MUST NOT appear in the file
- AND `bg-black` MUST NOT appear as a background class

#### Scenario: No hardcoded text-white for labels

- GIVEN an admin component file is refactored
- WHEN `text-white` is used for non-interactive text (labels, headings)
- THEN it MUST be replaced with `text-[var(--foreground)]`

---

## Files Affected by This Change

| File | Changes |
|------|---------|
| `src/app/globals.css` | ADD `--success`, `--success-foreground`, `--icon-badge-bg` variables |
| `src/components/admin/rutina-form.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/ejercicio-form.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/dia-manager.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/ejercicio-list.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/ejercicio-row.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/dia-section.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/delete-rutina-button.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/delete-rutina-page-button.tsx` | Replace hardcoded colors with CSS variables |
| `src/components/admin/GymPriceEditor.tsx` | Replace hardcoded colors with CSS variables |
| `src/app/(admin)/admin/page.tsx` | Replace hardcoded colors with CSS variables |
| `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` | Replace hardcoded colors with CSS variables |

---

## Color Mapping Reference

| Old Class | New Class |
|-----------|-----------|
| `text-white` | `text-[var(--foreground)]` |
| `text-white/60` | `text-[var(--muted-foreground)]` |
| `bg-zinc-900` / `bg-black` | `bg-[var(--card-bg)]` |
| `border-white/30` | `border-[var(--card-border)]` |
| `bg-white/10` (hover) | `hover:bg-[var(--button-secondary-bg)]` |
| `bg-red-600 hover:bg-red-700 text-white` (buttons) | `bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)]` |
| `hover:bg-red-900/30 text-red-400` (icon buttons) | `hover:bg-[var(--destructive)]/10 text-[var(--destructive)]` |
| `bg-red-900/30 text-red-400` (error messages) | `bg-[var(--destructive)]/10 border-[var(--destructive)]/30 text-[var(--destructive)]` |
| `bg-green-900/30 text-green-400` (success messages) | `bg-[var(--success)] text-[var(--success-foreground)]` |

---

## Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-THEME-1 | `globals.css` defines `--success` and `--success-foreground` for light, dark, and :root | Inspect CSS file |
| AC-THEME-2 | `globals.css` defines `--icon-badge-bg` for light, dark, and :root | Inspect CSS file |
| AC-THEME-3 | `@theme inline` block includes success and icon-badge-bg mappings | Inspect CSS file |
| AC-THEME-4 | Admin forms use CSS variables for labels, inputs, select elements | Visual inspection + grep for old classes |
| AC-THEME-5 | Error messages use `var(--destructive)` based colors | Visual inspection in dev tools |
| AC-THEME-6 | Success messages use `var(--success)` based colors | Visual inspection in dev tools |
| AC-THEME-7 | Destructive buttons use `var(--destructive)` based colors | Visual inspection in dev tools |
| AC-THEME-8 | No `bg-zinc-900`, `bg-black`, `text-white` hardcoded classes in refactored files | Run `grep -r "bg-zinc-900\|bg-black\|text-white" src/components/admin/` |
| AC-THEME-9 | Admin panel renders correctly in dark mode | Navigate admin routes in dark mode |
| AC-THEME-10 | Admin panel renders correctly in light mode | Toggle theme, navigate admin routes |
| AC-THEME-11 | All UI text remains in Spanish | Visual inspection of all refactored components |
