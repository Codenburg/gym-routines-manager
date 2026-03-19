# Delta for UI - Admin Theme CSS Variables

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Admin Form Label Colors

The system MUST use `text-[var(--foreground)]` for form labels instead of hardcoded `text-white`.

(Previously: Form labels used `text-white` which did not adapt to theme)

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

(Previously: Select dropdowns and inputs used `bg-black`, `border-white/30`, `text-white`)

#### Scenario: Select dropdown adapts to theme

- GIVEN the admin form renders in either light or dark mode
- WHEN the tipo select dropdown is displayed
- THEN the background MUST use `bg-[var(--card-bg)]`
- AND the border MUST use `border-[var(--card-border)]`
- AND the text MUST use `text-[var(--foreground)]`

---

### Requirement: Error Message Styling

The system MUST use `bg-[var(--destructive)]/10`, `border-[var(--destructive)]/30`, and `text-[var(--destructive)]` for error message containers instead of hardcoded `bg-red-900/30`, `border-red-700/50`, and `text-red-400`.

(Previously: Error messages used `bg-red-900/30`, `border-red-700/50`, `text-red-400`)

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

(Previously: Success messages used `bg-green-900/30` and `text-green-400`)

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

(Previously: Icon buttons used `hover:bg-red-900/30` and `text-red-400`)

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

(Previously: Card backgrounds used `bg-zinc-900` or `bg-black`)

#### Scenario: Card background adapts to theme

- GIVEN an admin card component renders in either light or dark mode
- WHEN the card background is displayed
- THEN the background MUST use `bg-[var(--card-bg)]` which adapts to the current theme

---

### Requirement: Button Hover Background

The system MUST use `hover:bg-[var(--button-secondary-bg)]` for secondary button hover states instead of hardcoded `bg-white/10`.

(Previously: Secondary button hovers used `bg-white/10`)

#### Scenario: Secondary button hover in dark mode

- GIVEN a secondary button with hover state renders in dark mode
- WHEN the user hovers over the button
- THEN the hover background MUST use `hover:bg-[var(--button-secondary-bg)]`

---

### Requirement: Delete Button Destructive Styling

The system MUST use `bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)]` for destructive action buttons (e.g., "Eliminar Rutina") instead of hardcoded `bg-red-600 hover:bg-red-700 text-white`.

(Previously: Destructive buttons used `bg-red-600 hover:bg-red-700 text-white`)

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

## REMOVED Requirements

### Requirement: Hardcoded Dark Theme Colors (DEPRECATED)

The system MUST NOT use hardcoded Tailwind color classes for background, border, and text colors in admin components. All colors MUST reference CSS variables.

(Reason: Hardcoded colors break in light mode and are inconsistent with the theming system)

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
