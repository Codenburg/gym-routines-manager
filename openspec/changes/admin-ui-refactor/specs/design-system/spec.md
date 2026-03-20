# Delta for design-system

## Purpose

This spec defines the foundational design system requirements for the admin panel UI refactor. It establishes the integrity condition, token architecture, wrapper components, and enforcement mechanisms that ALL other admin specs depend upon.

---

## INTEGRITY CONDITION

**El sistema solo funciona si se cumplen las 7 reglas SIEMPRE:**

1. **Wrappers CLOSED** (no className en AdminCard, AdminTable, AdminFormField)
2. **Semantic tokens for colors** (bg-*, text-*, border-* con tokens, no hardcoded)
3. **Semantic tokens in pseudo-selectors** (hover:, focus:, active: también usan tokens)
4. **No var() outside globals.css** (bg-[var(--)] prohibido en componentes)
5. **Icon libraries token-aware** (no hardcoded colors en iconos)
6. **No cn/clsx with external className** (si puede contener colores, prohibido)
7. **toast.promise() for mutations** (zero window.alert, zero console.error para feedback)

**Una sola excepción = precedente = degradación progresiva. No hay "por ahora" o "solo este caso".**

---

## ADDED Requirements

### Requirement: Wrapper Components Architecture

The system SHALL provide closed-wrapper components that encapsulate admin-specific UI patterns. These wrappers MUST be used for ALL admin visual elements and MUST NOT expose `className` props to prevent bypass.

The system MUST provide the following wrapper components:

- **AdminCard**: Card container with variant system
- **AdminTable**: Table container with built-in patterns
- **AdminFormField**: Form field with label/input/error pattern

---

### Requirement: Closed Wrapper Pattern

The AdminCard, AdminTable, and AdminFormField wrapper components SHALL NOT accept a `className` prop under any circumstances. These wrappers MUST be "cerrados" (closed) - they define a fixed set of props and do not allow external style overrides.

#### AdminCard Props Interface (CLOSED)

```typescript
interface AdminCardProps {
  variant: 'hero' | 'standard' | 'interactive';
  children: React.ReactNode;
  onClick?: () => void; // Only for interactive variant
}
```

The AdminCard component MUST map variants to internal styles:
- `hero`: `p-6` with `text-3xl font-bold` typography
- `standard`: `p-4` for compact display
- `interactive`: `p-4` + `hover:shadow-md hover:scale-[1.01] transition-all` + `cursor-pointer`

#### AdminTable Props Interface (CLOSED)

```typescript
interface AdminTableProps<T> {
  variant: 'default' | 'selectable';
  columns: ColumnDef<T>[];
  data: T[];
}
```

The AdminTable component MUST NOT accept any styling-related props.

#### AdminFormField Props Interface (CLOSED)

```typescript
interface AdminFormFieldProps {
  variant?: 'text' | 'select' | 'textarea';
  label: string;
  error?: string | string[];
  isPending?: boolean;
  children: React.ReactNode;
}
```

The AdminFormField component MUST NOT accept any styling-related props.

##### Scenario: Using AdminCard correctly

- GIVEN a developer needs a card component
- WHEN they use AdminCard with a valid variant (hero, standard, or interactive)
- THEN the card renders with the predefined styles for that variant
- AND the developer cannot override styles with className

##### Scenario: Attempting to override AdminCard styles

- GIVEN a developer tries to use AdminCard with className
- WHEN they write `<AdminCard className="bg-red-500 p-7" />`
- THEN ESLint rule `no-raw-classname-in-admin` reports an error
- AND the error message MUST state: "AdminCard does not accept className prop. Use variant prop instead."

##### Scenario: Attempting to override AdminTable styles

- GIVEN a developer tries to use AdminTable with className
- WHEN they write `<AdminTable className="custom-table-style" />`
- THEN ESLint rule `no-raw-classname-in-admin` reports an error
- AND the error message MUST state: "AdminTable does not accept className prop."

##### Scenario: Attempting to override AdminFormField styles

- GIVEN a developer tries to use AdminFormField with className
- WHEN they write `<AdminFormField className="mb-6" />`
- THEN ESLint rule `no-raw-classname-in-admin` reports an error
- AND the error message MUST state: "AdminFormField does not accept className prop."

---

### Requirement: Semantic Color Tokens Only

All color styling in admin components MUST use semantic tokens defined in the design system. The system MUST NOT allow hardcoded Tailwind color classes in `src/components/admin/`.

#### PROHIBITED Color Classes

The following Tailwind color classes ARE PROHIBITED in `src/components/admin/`:

| Banned Pattern | Examples |
|----------------|----------|
| Red spectrum | `red-50` through `red-900`, `red-500` |
| Orange spectrum | `orange-50` through `orange-900` |
| Amber spectrum | `amber-50` through `amber-900` |
| Yellow spectrum | `yellow-50` through `yellow-900` |
| Lime spectrum | `lime-50` through `lime-900` |
| Green spectrum | `green-50` through `green-900` |
| Emerald spectrum | `emerald-50` through `emerald-900` |
| Teal spectrum | `teal-50` through `teal-900` |
| Cyan spectrum | `cyan-50` through `cyan-900` |
| Sky spectrum | `sky-50` through `sky-900` |
| Blue spectrum | `blue-50` through `blue-900` |
| Indigo spectrum | `indigo-50` through `indigo-900` |
| Violet spectrum | `violet-50` through `violet-900` |
| Purple spectrum | `purple-50` through `purple-900` |
| Fuchsia spectrum | `fuchsia-50` through `fuchsia-900` |
| Pink spectrum | `pink-50` through `pink-900` |
| Rose spectrum | `rose-50` through `rose-900` |
| Neutral colors | `white`, `black`, `neutral-50` through `neutral-900` |
| Gray spectrum | `gray-50` through `gray-900` |
| Zinc spectrum | `zinc-50` through `zinc-900` |
| Stone spectrum | `stone-50` through `stone-900` |
| CSS Variables | `var(--anything)` in Tailwind classes |

#### ALLOWED Semantic Tokens

The following semantic tokens ARE ALLOWED:

| Token | Usage |
|-------|-------|
| `foreground` | Primary text |
| `muted-foreground` | Secondary/muted text |
| `destructive` | Error/danger actions and text |
| `destructive-foreground` | Text on destructive background |
| `primary` | Primary accent |
| `primary-foreground` | Text on primary background |
| `secondary` | Secondary accent |
| `secondary-foreground` | Text on secondary background |
| `background` | Page background |
| `muted` | Subtle backgrounds |
| `accent` | Highlight backgrounds |
| `border` | Borders |
| `input` | Input backgrounds |
| `card` | Card backgrounds |
| `card-foreground` | Card text |
| `success` | Success state (if defined in theme) |

##### Scenario: Using semantic token correctly

- GIVEN a developer needs red text for an error message
- WHEN they write `text-destructive`
- THEN the error text uses the destructive semantic token
- AND it renders correctly in both light and dark themes

##### Scenario: Attempting to use hardcoded red

- GIVEN a developer writes `text-red-500` in an admin component
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors` reports an error
- AND the error message MUST state: "Use semantic token (e.g., text-destructive) instead of hardcoded color"

##### Scenario: Attempting to use hardcoded blue

- GIVEN a developer writes `bg-blue-400` in an admin component
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors` reports an error
- AND the error message MUST state: "Use semantic token (e.g., bg-primary) instead of hardcoded color"

##### Scenario: Attempting to use white or black

- GIVEN a developer writes `text-white` or `bg-black` in an admin component
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors` reports an error
- AND the error message MUST state: "Use semantic token instead of hardcoded color"

##### Scenario: Attempting to use zinc/neutral/stone

- GIVEN a developer writes `text-zinc-900` or `bg-neutral-800` in an admin component
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors` reports an error

##### Scenario: NO var(--) in Tailwind classes

- GIVEN a developer writes `bg-[var(--my-color)]` in an admin component
- WHEN ESLint scans the file
- THEN rule `no-var-color-outside-tokens` reports an error
- AND the error message MUST state: "Use semantic token instead of CSS variable"

---

### Requirement: Semantic Tokens in Pseudo-Selectors

All color styling within pseudo-selectors (hover:, focus:, active:, group-hover:, peer-hover:, etc.) MUST use semantic tokens. Hardcoded colors in states are a critical vector de fuga (escape vector) that bypasses the semantic token system.

#### PROHIBITED State Patterns

The following patterns are PROHIBITED in `src/components/admin/`:

| Banned State Pattern | Examples |
|---------------------|----------|
| hover with hardcoded bg | `hover:bg-red-500`, `hover:bg-blue-600`, `hover:bg-zinc-700` |
| hover with hardcoded text | `hover:text-red-400`, `hover:text-blue-500` |
| focus with hardcoded ring | `focus:ring-red-500`, `focus:ring-blue-400` |
| focus with hardcoded border | `focus:border-red-500`, `focus:border-blue-500` |
| active with hardcoded bg | `active:bg-yellow-500`, `active:bg-orange-600` |
| group-hover with hardcoded bg | `group-hover:bg-purple-500`, `group-hover:bg-green-600` |

#### ALLOWED State Patterns

The following patterns are ALLOWED:

| Allowed State Pattern | Examples |
|----------------------|----------|
| hover with semantic bg | `hover:bg-destructive`, `hover:bg-destructive/20` |
| hover with semantic bg | `hover:bg-primary`, `hover:bg-primary/80` |
| hover with semantic bg | `hover:bg-muted`, `hover:bg-muted/50` |
| hover with semantic bg | `hover:bg-accent`, `hover:bg-accent/50` |
| focus with semantic ring | `focus:ring-primary`, `focus:ring-offset-background` |
| focus with semantic border | `focus:border-input`, `focus:border-primary` |
| active with semantic bg | `active:bg-accent`, `active:bg-muted` |

##### Scenario: Using hover with semantic token

- GIVEN a button needs hover state with destructive background
- WHEN developer writes `hover:bg-destructive/20`
- THEN the hover uses destructive semantic token with opacity
- AND the color is theming-aware
- AND the button remains accessible in light and dark themes

##### Scenario: Using focus with semantic token

- GIVEN an input field needs focus ring
- WHEN developer writes `focus:ring-primary`
- THEN the focus ring uses primary semantic token
- AND it renders correctly in both light and dark themes

##### Scenario: Attempting hardcoded color in hover

- GIVEN a developer writes `hover:bg-red-500`
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors-in-states` reports an error
- AND the error message MUST state: "Use semantic token (e.g., hover:bg-destructive) instead of hardcoded color in hover"

##### Scenario: Attempting hardcoded color in focus

- GIVEN a developer writes `focus:border-red-500`
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors-in-states` reports an error

##### Scenario: Attempting hardcoded color in active

- GIVEN a developer writes `active:bg-yellow-500`
- WHEN ESLint scans the file
- THEN rule `no-hardcoded-colors-in-states` reports an error

---

### Requirement: Icon Components Must Use Token Colors

All icon components used in admin MUST use semantic colors via className or currentColor. Icon libraries that hardcode colors internally bypass the semantic token system.

#### PROHIBITED Icon Patterns

The following patterns are PROHIBITED:

| Banned Pattern | Example |
|---------------|---------|
| Icon with hardcoded color prop | `<Icon color="red" />` |
| Icon with hardcoded className | `<Icon className="text-red-500" />` |
| Icon with hardcoded stroke/fill | `<LucideIcon stroke="red" />` |
| Icon with inline style color | `<Icon style={{ color: 'red' }} />` |

#### ALLOWED Icon Patterns

Icon components MUST use semantic tokens:

| Allowed Pattern | Example |
|----------------|---------|
| Icon with semantic text class | `<Icon className="text-destructive" />` |
| Icon with semantic text class | `<Icon className="text-muted-foreground" />` |
| Icon with semantic text class | `<Icon className="text-primary" />` |
| Icon with currentColor | `<Icon className="text-current" />` |

##### Scenario: Using icon with semantic token

- GIVEN an icon component for a delete action
- WHEN it is used as `<TrashIcon className="text-destructive" />`
- THEN the icon uses the destructive semantic token
- AND the icon color adapts to light/dark themes

##### Scenario: Using icon with muted-foreground

- GIVEN an icon component for a secondary action
- WHEN it is used as `<EyeIcon className="text-muted-foreground" />`
- THEN the icon uses the muted-foreground semantic token

##### Scenario: Icon with hardcoded color

- GIVEN an icon with hardcoded color like `<Icon color="red" />`
- WHEN ESLint scans the file
- THEN it reports an error about hardcoded color in icon
- AND the error message MUST state: "Use semantic token (e.g., text-destructive) instead of hardcoded color"

---

### Requirement: cn/clsx with External className Prohibited

The `cn()` or `clsx()` utility functions MUST NOT be used with externally-provided className props when color classes could be passed. This is a critical vector de fuga where hardcoded colors can bypass the semantic token system.

#### PROHIBITED Patterns

```typescript
// ❌ PROHIBITED - external className can contain colors
cn(baseClasses, userProvidedClassName)
cn("px-4 py-2", className) // if className can have colors

// ❌ PROHIBITED - clsx with external input
clsx(["bg-primary", props.className])
```

#### ALLOWED Patterns

```typescript
// ✅ ALLOWED - cn with only predefined classes
cn("px-4 py-2 bg-primary text-primary-foreground")

// ✅ ALLOWED - fixed classes only, no external input
const buttonClasses = "px-4 py-2 bg-destructive text-destructive-foreground"
```

##### Scenario: cn with external className that could contain colors

- GIVEN a component uses `cn(baseClasses, className)` where className is external
- WHEN the component is used with `className="text-red-500"`
- THEN hardcoded color bypasses the semantic token system
- AND ESLint MUST report an error

##### Scenario: Component should use predefined classes only

- GIVEN a Button component needs styling
- WHEN the styling is implemented
- THEN only predefined semantic token classes MUST be used
- AND no external className input that could contain colors is allowed

---

#### Scenario: AdminCard renders with hero variant

- GIVEN an admin page needs to display the gym price as dominant content
- WHEN `<AdminCard variant="hero">` is rendered
- THEN the card MUST have `p-6` padding and `text-3xl font-bold` typography for the price value

#### Scenario: AdminCard renders with standard variant

- GIVEN an admin page needs to display a metric card (e.g., total rutinas count)
- WHEN `<AdminCard variant="standard">` is rendered
- THEN the card MUST have `p-4` padding for compact display

#### Scenario: AdminCard renders with interactive variant

- GIVEN an admin page needs a clickable card that navigates to routine detail
- WHEN `<AdminCard variant="interactive" onClick={handleClick}>` is rendered
- THEN the card MUST have `hover:shadow-md hover:scale-[1.01] transition-all` styles
- AND MUST have `cursor-pointer` for affordance

#### Scenario: AdminCard does not expose className

- GIVEN a developer tries to add custom styles via className prop
- WHEN the component is used
- THEN the className prop MUST NOT exist on AdminCard interface
- AND any styling needs MUST be addressed by adding a new variant

#### Scenario: AdminTable renders with sticky header

- GIVEN an admin page needs to display a table of rutinas
- WHEN `<AdminTable>` is rendered with column headers
- THEN the table header MUST be sticky (`sticky top-0`)
- AND row hover MUST show `hover:bg-muted/50` background

#### Scenario: AdminTable group-based row actions

- GIVEN an admin page displays a table with row actions (edit, delete, duplicate)
- WHEN the row is not hovered
- THEN the action buttons MUST have `opacity-0`
- WHEN the row is hovered
- THEN the action buttons MUST have `opacity-100` with `group-hover:opacity-100` transition

#### Scenario: AdminTable multi-select with batch delete

- GIVEN an admin page displays selectable table rows
- WHEN `<AdminTable>` is used with selection enabled
- THEN checkboxes MUST appear in the first column
- AND batch delete actions MUST be available when rows are selected

#### Scenario: AdminFormField renders with label, input, and error

- GIVEN an admin form needs a text input field
- WHEN `<AdminFormField label="Nombre" error={state.errors?.nombre}>` wraps an input
- THEN the label MUST display with `text-sm font-medium`
- AND the error message MUST display below the input when error is present

#### Scenario: AdminFormField handles disabled state

- GIVEN an admin form field is rendered while a mutation is pending
- WHEN `<AdminFormField>` is used
- THEN the wrapped input MUST be disabled when `isPending={true}` is passed

---

### Requirement: Semantic Token Architecture

The system MUST use Tailwind semantic token classes instead of hardcoded colors or custom CSS variables. All admin components MUST use the shadcn/tailwind.css design tokens.

Admin components MUST use the following semantic token mappings:

| Purpose | Must Use | Must NOT Use |
|---------|----------|--------------|
| Card background | `bg-card` | `bg-zinc-900`, `bg-black`, `var(--card-bg)` |
| Card border | `border-border` | `border-white/30`, `var(--card-border)` |
| Text primary | `text-foreground` | `text-white`, `text-zinc-900` |
| Text muted | `text-muted-foreground` | `text-white/60`, `text-zinc-400` |
| Button primary | `bg-primary text-primary-foreground` | `bg-[var(--button-primary-bg)]` |
| Button secondary | `bg-secondary text-secondary-foreground` | `bg-[var(--button-secondary-bg)]` |
| Destructive | `bg-destructive text-destructive-foreground` | `bg-red-600`, `bg-[var(--destructive)]` |
| Success | `bg-success text-success-foreground` | `bg-green-600`, `bg-[var(--success)]` |
| Error/bg | `bg-destructive/10 text-destructive` | `bg-red-900/30 text-red-400` |
| Input background | `bg-background` | `bg-[var(--input-bg)]` |
| Hover state | `hover:bg-accent` | `hover:bg-white/10` |

#### Scenario: Card component uses semantic tokens

- GIVEN an AdminCard component is rendered
- WHEN the card displays
- THEN the background MUST use `bg-card`
- AND the border MUST use `border-border`
- AND the text MUST use `text-foreground` / `text-muted-foreground`

#### Scenario: Button uses semantic tokens

- GIVEN a destructive delete button is rendered in admin
- WHEN the button displays
- THEN the background MUST use `bg-destructive`
- AND the text MUST use `text-destructive-foreground`
- AND hover MUST use `hover:opacity-90`

#### Scenario: Dashboard stat cards use semantic tokens

- GIVEN the dashboard displays stat cards with colored icons
- WHEN the stat card renders
- THEN icon backgrounds MUST use semantic tokens (e.g., `bg-destructive/10`, `bg-primary/10`)
- AND icon colors MUST use semantic tokens (e.g., `text-destructive`, `text-primary`)

#### Scenario: NO hardcoded color values in admin components

- GIVEN any admin component file is saved
- THEN `bg-red-600`, `bg-blue-600`, `bg-green-600` MUST NOT appear
- AND `text-white`, `text-zinc-900` MUST NOT appear for non-interactive purposes
- AND `var(--button-secondary-bg)` and similar custom vars MUST NOT appear

---

### Requirement: Toast Notification Integration

The system MUST use `toast.promise()` from `sonner` for ALL mutation feedback. The system MUST NOT use `window.alert`, `window.confirm`, or `console.error` for user-facing feedback.

All server action mutations MUST follow this pattern:

```typescript
const promise = serverAction(formData);
toast.promise(promise, {
  loading: "Operation in progress...",
  success: (result) => "Success message",
  error: (err) => err.message || "Error message"
});
```

#### Scenario: Create action shows toast on success

- GIVEN an admin clicks "Crear Rutina" button
- WHEN the createRutina server action succeeds
- THEN a success toast MUST display: "Rutina creada exitosamente"

#### Scenario: Create action shows toast on error

- GIVEN an admin submits an invalid form
- WHEN the createRutina server action returns an error
- THEN an error toast MUST display with the error message

#### Scenario: Bulk delete shows toast with count

- GIVEN an admin selects 3 rutinas and clicks "Eliminar seleccionadas"
- WHEN the deleteRutinas server action succeeds
- THEN the success toast MUST display: "3 rutinas eliminadas"

#### Scenario: NO window.alert for user feedback

- GIVEN any admin component code is written
- THEN `window.alert` MUST NOT appear in the code
- AND `window.confirm` MUST NOT appear in the code (use shadcn AlertDialog instead)

#### Scenario: NO console.error for user-facing errors

- GIVEN an error occurs during a mutation
- WHEN handling the error
- THEN `console.error` MUST NOT be used to inform users
- AND a toast.error() MUST be displayed instead

---

### Requirement: Enforcement Mechanisms

The system MUST provide automated enforcement to prevent integrity condition violations. This includes ESLint rules and code review checklist.

#### Requirement: ESLint Rules

The project ESLint configuration MUST include rules that prevent integrity violations:

1. **no-raw-classname-in-admin**: Disallow `className` prop on components whose names start with `Admin` (AdminCard, AdminTable, AdminFormField, etc.)
2. **no-hardcoded-colors**: Disallow hardcoded Tailwind color classes (red-*, blue-*, zinc-*, white, black, etc.) in `src/components/admin/`
3. **no-hardcoded-colors-in-states**: Disallow hardcoded colors in pseudo-selectors (hover:, focus:, active:, group-hover:, peer-hover:, etc.) in `src/components/admin/`
4. **no-var-color-outside-tokens**: Disallow `var(--` in Tailwind class attributes in admin components (except globals.css tokens)
5. **no-window-alert**: Disallow `window.alert` and `window.confirm`
6. **no-console-error**: Disallow `console.error` with message strings

#### Scenario: ESLint catches className on AdminCard

- GIVEN a developer writes `<AdminCard className="custom-styles">`
- WHEN ESLint runs
- THEN an error MUST be reported: "AdminCard does not accept className prop. Use variant prop instead."

#### Scenario: ESLint catches hardcoded bg-red-600

- GIVEN a developer writes `className="bg-red-600/20"` in an admin component
- WHEN ESLint runs
- THEN an error MUST be reported: "Use semantic token (e.g., bg-destructive/10) instead of hardcoded color"

#### Scenario: ESLint catches window.alert

- GIVEN a developer writes `window.alert("Error")`
- WHEN ESLint runs
- THEN an error MUST be reported: "Use toast.error() instead of window.alert"

#### Scenario: ESLint catches hardcoded color in hover

- GIVEN a developer writes `hover:bg-red-500` in an admin component
- WHEN ESLint runs
- THEN an error MUST be reported: "Use semantic token (e.g., hover:bg-destructive) instead of hardcoded color in hover"

#### Scenario: ESLint catches hardcoded color in focus

- GIVEN a developer writes `focus:ring-blue-400` in an admin component
- WHEN ESLint runs
- THEN an error MUST be reported: "Use semantic token (e.g., focus:ring-primary) instead of hardcoded color in focus"

#### Scenario: ESLint catches hardcoded color in active

- GIVEN a developer writes `active:bg-yellow-500` in an admin component
- WHEN ESLint runs
- THEN an error MUST be reported: "Use semantic token instead of hardcoded color in active"

---

### Requirement: Exception Process

The system MUST define a formal process for handling cases not covered by the design system. Exceptions MUST NOT be handled by bypassing wrappers or using hardcoded values.

#### Scenario: New variant needed for AdminCard

- GIVEN a legitimate use case requires AdminCard to display a badge count
- WHEN the existing variants (hero, standard, interactive) don't support this
- THEN a developer MUST open an issue describing the use case
- AND the issue MUST be evaluated for adding a new variant to AdminCard
- AND the variant MUST be implemented in the wrapper, not via className

#### Scenario: New color token needed

- GIVEN a legitimate use case requires a color not covered by semantic tokens
- WHEN the existing tokens don't support this
- THEN a developer MUST open an issue describing the use case
- AND the issue MUST be evaluated for adding a new semantic token to the design system
- AND the token MUST be added to globals.css with light/dark theme support

#### Scenario: Rejected exception - using className to bypass

- GIVEN a developer claims a style cannot be achieved with existing variants
- WHEN the style is achievable with a new variant or existing tokens
- THEN the exception request MUST be rejected
- AND the developer MUST implement a proper variant

---

### Requirement: Onboarding Documentation

The system MUST provide documentation for new developers explaining the integrity condition and its rationale.

#### Scenario: New developer reads design system docs

- GIVEN a new developer joins the project
- WHEN they read the admin design system documentation
- THEN they MUST understand the 3 integrity rules
- AND they MUST understand that wrappers must be used
- AND they MUST understand the exception process

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/admin-card.tsx` | NEW - AdminCard wrapper component |
| `src/components/admin/admin-table.tsx` | NEW - AdminTable wrapper component |
| `src/components/admin/admin-form-field.tsx` | NEW - AdminFormField wrapper component |
| `eslint.config.mjs` | MODIFY - Add integrity enforcement rules |
| `docs/admin-design-system.md` | NEW - Onboarding documentation |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| ADS1 | AdminCard component exists with hero, standard, interactive variants | Unit test + visual inspection |
| ADS2 | AdminTable component exists with sticky header, hover states, selection | Unit test + visual inspection |
| ADS3 | AdminFormField component exists with label, input, error pattern | Unit test + visual inspection |
| ADS4 | All admin components use semantic tokens (no hardcoded colors) | ESLint grep for forbidden patterns |
| ADS5 | All mutations use toast.promise() pattern | Code review + grep |
| ADS6 | No window.alert/window.confirm in admin code | ESLint rule enforcement |
| ADS7 | ESLint rules detect className on Admin* components | ESLint test case |
| ADS8 | Exception process documented | Manual review of docs |
