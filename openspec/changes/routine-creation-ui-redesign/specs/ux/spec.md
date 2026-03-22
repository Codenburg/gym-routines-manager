# Delta for ux

## Purpose

This spec defines the user experience requirements for the routine creation UI redesign. It describes user flows, interactions, micro-interactions, and the overall cognitive load reduction achieved through the new component patterns.

---

## ADDED Requirements

### Requirement: Reduced Cognitive Load via Collapsible Sections

The system SHALL reduce cognitive load by displaying days as collapsed sections by default. Users MUST be able to expand only the day they are actively editing, keeping the interface scannable.

#### Scenario: Initial form load with multiple days

- GIVEN a user creates a new routine with 4 days
- WHEN the form loads
- THEN all days SHOULD be collapsed by default
- AND the user sees a scannable list of day headers
- AND only the day they are actively editing needs to be expanded

#### Scenario: Scanning available days

- GIVEN a user wants to see which days have exercises
- WHEN they view the form
- THEN collapsed headers MUST show day name and exercise count (if applicable)
- AND the user does NOT need to expand to scan the structure

---

### Requirement: Descriptive Placeholder Guidance

The system SHALL provide descriptive placeholders that guide users on what to enter. Generic placeholders like "Ej: Sentadillas con barra" help users understand expected input format.

#### Placeholder Requirements by Mode

| Input | Light Mode Placeholder | Dark Mode Placeholder |
|-------|----------------------|----------------------|
| Routine name | "Nombre de la rutina..." | "Nombre de la rutina..." |
| Exercise name | "Ej: Sentadillas con barra" | "Ej: Press de banca" |
| Day name | "Ej: Tren inferior" | "Ej: Tren superior" |

#### Scenario: Placeholder guides exercise input

- GIVEN a user adds a new exercise to a day
- WHEN the exercise row renders
- THEN the placeholder MUST display "Ej: Sentadillas con barra" (light) or "Ej: Press de banca" (dark)
- AND the user immediately understands the expected input format

#### Scenario: Placeholder differentiates by theme

- GIVEN a user switches from light to dark mode
- WHEN the form re-renders
- THEN the placeholders MUST update to theme-appropriate examples
- AND the placeholder color MUST use `--color-placeholder` (#6b7280) in dark mode

---

### Requirement: Chip Selection for Routine Type

The system SHALL replace dropdown selection with chip-based selection for routine type. This provides immediate visual feedback and reduces the number of clicks required.

#### Scenario: Selecting routine type via chips

- GIVEN a user sees the routine type section
- WHEN they view the options
- THEN all available types are visible immediately (Fuerza, Cardio, Flexibilidad, Hipertrofia)
- AND no dropdown click is required
- AND the selected type is visually prominent

#### Scenario: Changing routine type

- GIVEN a user has selected "Fuerza"
- WHEN they decide to change to "Cardio"
- THEN they click the Cardio chip
- AND the selection changes immediately
- AND Fuerza chip returns to unselected state

---

### Requirement: Micro-Interactions

The system SHALL provide subtle micro-interactions that give feedback without overwhelming the user.

#### Micro-Interaction Requirements

| Interaction | Feedback |
|-------------|----------|
| Chip hover | Border color transitions to `--color-accent` (100ms) |
| Chip select | Background fills with `--color-accent` (150ms) |
| Day expand | Chevron rotates 90deg (150-200ms ease-out) |
| Delete hover | Icon color transitions to `--color-error` (100ms) |
| Input focus | Border + ring using `--color-accent` (instant) |

#### Scenario: Chip selection micro-interaction

- GIVEN a user clicks a chip
- WHEN the selection occurs
- THEN there MUST be a smooth color transition (100-150ms)
- AND the user perceives immediate feedback without jarring changes

#### Scenario: Delete button feedback

- GIVEN a user hovers over a delete icon on an exercise
- WHEN the hover occurs
- THEN the icon color MUST transition to `--color-error`
- AND the transition MUST be smooth (100ms)

---

### Requirement: Error State Visibility

The system SHALL display validation errors in a subtle but visible way, especially in dark mode where errors can be lost.

#### Error Display Requirements

| Mode | Error Border | Error Text |
|------|-------------|------------|
| Light mode | `--color-error` (#ef4444) | `--color-error` text |
| Dark mode | `--color-error` (#ef4444) subtle border | `--color-error` text |

#### Scenario: Error state in dark mode

- GIVEN a user in dark mode has a validation error
- WHEN the error displays
- THEN the input border MUST use `--color-error` (#ef4444)
- AND the error border MUST be subtle (not thick or overwhelming)
- AND error text MUST be visible against dark background

---

### Requirement: Form Submission Feedback

The system SHALL provide toast feedback for form submission success or failure.

#### Scenario: Successful routine creation

- GIVEN an admin clicks "Crear Rutina"
- WHEN the server action succeeds
- THEN a success toast MUST display: "Rutina creada exitosamente"
- AND the user SHOULD be redirected to the routine list

#### Scenario: Failed routine creation

- GIVEN an admin submits an invalid form
- WHEN the server action fails
- THEN an error toast MUST display with the error message
- AND form state MUST be preserved for user to correct

---

### Requirement: Keyboard Accessibility

All interactive elements MUST be keyboard accessible following WCAG 2.1 AA guidelines.

#### Keyboard Navigation Requirements

| Component | Tab Order | Keys | Action |
|-----------|-----------|------|--------|
| ChipSelector | Sequential through chips | Enter/Space | Select chip |
| DiaSection header | After chips | Enter/Space | Toggle expand/collapse |
| DiaSection header | After chips | Arrow Up/Down | Navigate between days |
| EjercicioRow | Within expanded day | Tab | Navigate between inputs |
| Delete buttons | Last in row | Enter/Space | Delete item |
| Submit button | Last in form | Enter (in form) | Submit form |

#### Scenario: Keyboard navigation through chips

- GIVEN a user navigates via Tab key
- WHEN focus lands on first chip
- AND they press Arrow Right
- THEN focus MUST move to the next chip
- AND focus visual indicator MUST be visible

#### Scenario: Keyboard collapse/expand

- GIVEN a user has focus on a DiaSection header
- WHEN they press Enter or Space
- THEN the section MUST toggle expand/collapse
- AND focus indicator MUST remain on the header

---

### Requirement: Responsive Behavior

The form MUST be usable on tablet and desktop viewports. Mobile is out of scope for this redesign.

#### Responsive Requirements

| Breakpoint | Behavior |
|------------|----------|
| Desktop (1024px+) | Full layout with side-by-side elements |
| Tablet (768px-1023px) | Reduced padding, smaller chips |

#### Scenario: Tablet viewport

- GIVEN a user views the form on a tablet
- WHEN the viewport is 768px-1023px
- THEN chips MAY use smaller padding
- AND input widths MAY adjust to available space

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/rutina-completa-form.tsx` | MODIFY - UX improvements, keyboard handlers |
| `src/components/admin/chip-selector.tsx` | **NEW** - Keyboard support |
| `src/components/admin/dia-section.tsx` | MODIFY - Animation, keyboard support |
| `src/components/admin/ejercicio-row.tsx` | MODIFY - Keyboard support |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| RCU1 | Days are collapsed by default on new form | Visual inspection |
| RCU2 | Placeholders are descriptive and theme-appropriate | Visual inspection |
| RCU3 | Chip selection requires no dropdown click | Usability test |
| RCU4 | Micro-interactions provide smooth feedback | Visual inspection |
| RCU5 | Error states visible in both themes | Manual validation |
| RCU6 | Toast feedback on form submission | Manual test |
| RCU7 | All interactive elements keyboard accessible | Keyboard test |
| RCU8 | Tab order is logical | Keyboard navigation test |
| RCU9 | Responsive layout works on tablet | Responsive test |
