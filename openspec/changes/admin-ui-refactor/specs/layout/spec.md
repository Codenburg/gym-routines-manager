# Delta for layout

## Purpose

This spec defines the layout system requirements for the admin panel UI refactor, including header structure, page container constraints, spacing systems, and responsive behavior.

---

## ADDED Requirements

### Requirement: Fixed Header Layout

The system MUST implement a fixed header pattern for the admin layout that provides consistent navigation and user context across all admin pages.

The header MUST contain:
- Logo/home link on the left
- Application title "Champion Gym" centered
- Profile dropdown on the right

#### Scenario: Header is fixed at top

- GIVEN an admin user scrolls down a long page (e.g., rutinas list)
- WHEN the page is scrolled
- THEN the header MUST remain fixed at `sticky top-0`
- AND z-index MUST be at least 40 to stay above content

#### Scenario: Header shows profile dropdown

- GIVEN an authenticated admin is on any admin page
- WHEN the header renders
- THEN the profile dropdown MUST be visible on the right side
- AND MUST display the admin's name with a User icon

---

### Requirement: Page Container System

The system MUST use a consistent page container with `max-w-7xl mx-auto px-6` for content centering. The system MUST NOT use `max-w-4xl` as that is too narrow for admin dashboards.

#### Scenario: Content centered with max-w-7xl

- GIVEN an admin page loads
- WHEN the content area renders
- THEN the container MUST have `max-w-7xl`
- AND MUST have `mx-auto` for horizontal centering
- AND MUST have `px-6` horizontal padding

#### Scenario: max-w-4xl replaced with max-w-7xl

- GIVEN admin-layout.tsx is refactored
- WHEN the content div renders
- THEN the class `max-w-4xl` MUST NOT be present
- AND `max-w-7xl` MUST be used instead

---

### Requirement: Section Spacing System

The system MUST use consistent vertical spacing between page sections. Content sections MUST be separated by `space-y-6` or `space-y-8`.

#### Scenario: Dashboard sections have consistent spacing

- GIVEN the admin dashboard page renders
- WHEN sections render (price editor, stats, quick actions, recent routines)
- THEN adjacent sections MUST have `space-y-6` or `space-y-8` between them
- AND there MUST NOT be inconsistent spacing (e.g., one section with `mb-4` and another with `mb-8`)

---

### Requirement: Page Header Pattern

The system MUST implement a uniform page header pattern for all admin pages. Each page MUST have:

- Title with `text-2xl font-semibold`
- Optional description with `text-sm text-muted-foreground`
- Optional action buttons aligned right

#### Scenario: Page with title, description, and actions

- GIVEN the rutinas list page renders
- WHEN the page header renders
- THEN the title MUST be "Rutinas" with `text-2xl font-semibold`
- AND the description MUST be "Gestiona las rutinas del gimnasio" with `text-sm text-muted-foreground`
- AND the "Nueva Rutina" button MUST be aligned to the right

#### Scenario: Page with title and actions only

- GIVEN the gym price editor section renders
- WHEN the section header renders
- THEN the title MUST be "Precio del Gym" with `text-xl font-bold`
- AND the edit/save button MUST be aligned to the right

---

### Requirement: Responsive Grid System

The system MUST use adaptive grids that collapse to single column on mobile and expand on larger screens.

#### Scenario: Stats grid collapses on mobile

- GIVEN the stats cards grid renders on a mobile device
- WHEN the viewport is < 768px
- THEN the grid MUST be `grid-cols-1` (single column)

#### Scenario: Stats grid expands on tablet

- GIVEN the stats cards grid renders on a tablet
- WHEN the viewport is >= 768px
- THEN the grid MUST be `grid-cols-2`

#### Scenario: Stats grid expands on desktop

- GIVEN the stats cards grid renders on a desktop
- WHEN the viewport is >= 1024px
- THEN the grid MUST be `grid-cols-3`

#### Scenario: Recent routines grid adapts

- GIVEN the recent routines grid renders
- WHEN viewport is mobile (< 768px)
- THEN grid MUST be `grid-cols-1`
- WHEN viewport is tablet (768px - 1023px)
- THEN grid MUST be `grid-cols-2`
- WHEN viewport is desktop (>= 1024px)
- THEN grid MUST be `grid-cols-3`

---

### Requirement: Table Horizontal Scroll on Mobile

The system MUST ensure tables can scroll horizontally on small viewports to prevent layout breaks.

#### Scenario: Table scrolls horizontally on mobile

- GIVEN a table with many columns renders on mobile
- WHEN the viewport width is too narrow for all columns
- THEN the table container MUST have `overflow-x-auto`
- AND MUST maintain `min-w-full` on the table element

---

### Requirement: Full-width Buttons on Mobile

The system MUST render action buttons as full-width on mobile devices for better touch targets.

#### Scenario: Quick action buttons on mobile

- GIVEN quick action buttons render on a mobile device
- WHEN the buttons are primary actions (e.g., "Nueva Rutina")
- THEN on mobile (< 640px) the buttons SHOULD be `w-full`
- AND on larger screens the buttons MAY return to inline style

---

### Requirement: Spacing Tokens

The system MUST use consistent spacing values throughout the admin layout. Arbitrary spacing values MUST NOT be used.

#### Scenario: Consistent spacing between form fields

- GIVEN a form renders multiple fields
- WHEN fields render
- THEN the vertical spacing between fields MUST use `space-y-4`
- AND MUST NOT use arbitrary values like `space-y-[18px]`

#### Scenario: Consistent card padding

- GIVEN an AdminCard with standard variant renders
- WHEN the card renders
- THEN padding MUST be `p-4`
- AND MUST NOT use `p-5` or `p-3` unless as a deliberate new variant

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/admin-layout.tsx` | MODIFY - Change max-w-4xl to max-w-7xl |
| `src/app/(admin)/admin/page.tsx` | MODIFY - Use consistent spacing and grid |
| `src/app/(admin)/admin/rutinas/page.tsx` | MODIFY - Use page header pattern |
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | MODIFY - Use page header pattern |
| `src/app/(admin)/admin/feriados/page.tsx` | MODIFY - Use page header pattern |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| AL1 | Header is sticky with z-40 | Visual inspection |
| AL2 | Content uses max-w-7xl mx-auto px-6 | Visual inspection |
| AL3 | max-w-4xl is NOT used in admin layout | Grep for max-w-4xl |
| AL4 | Section spacing is consistent (space-y-6 or space-y-8) | Visual inspection |
| AL5 | Page header pattern matches spec | Visual inspection |
| AL6 | Stats grid is responsive (1 col mobile, 2 tablet, 3 desktop) | Responsive test |
| AL7 | Tables scroll horizontally on mobile | Mobile test |
| AL8 | Buttons are full-width on mobile | Mobile test |
