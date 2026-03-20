# Delta for components

## Purpose

This spec defines the component-level requirements for the admin panel UI refactor, including shadcn component adoption, wrapper component patterns, and button/form/table/card systems.

---

## ADDED Requirements

### Requirement: shadcn Component Adoption

The system MUST use shadcn/ui components for ALL admin UI elements. The system MUST NOT use raw HTML elements that have shadcn equivalents.

The following shadcn components MUST be used:

| Component | Must Use For | Must NOT Use |
|-----------|--------------|--------------|
| `Table` | Tabular data display | Raw `<table>` element |
| `Select` | Dropdown selections | Raw `<select>` element |
| `DropdownMenu` | Profile dropdown, context menus | Custom dropdown implementations |
| `Empty` | Empty state messages | Custom styled divs |
| `Badge` | Tags, status indicators | Custom styled spans |
| `Avatar` | User profile pictures | Custom image circles |
| `Skeleton` | Loading placeholders | Custom shimmer divs |
| `Separator` | Section dividers | Custom border dividers |
| `Breadcrumb` | Navigation path | Custom text navigation |

#### Scenario: Tabular data uses shadcn Table

- GIVEN the rutinas list page renders
- WHEN the table of rutinas displays
- THEN `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>` MUST be used
- AND raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` MUST NOT appear

#### Scenario: Select dropdown uses shadcn Select

- GIVEN the rutina form renders the tipo dropdown
- WHEN the dropdown displays
- THEN shadcn `<Select>` components MUST be used
- AND raw `<select>` element MUST NOT appear

#### Scenario: Profile dropdown uses DropdownMenu

- GIVEN the admin header renders the profile menu
- WHEN the profile button is clicked
- THEN shadcn `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>` MUST be used
- AND custom dropdown implementations with useState and divs MUST NOT appear

#### Scenario: Empty state uses Empty component

- GIVEN the rutinas list has no rutinas
- WHEN the empty state renders
- THEN shadcn `Empty` component MUST be used
- AND custom styled divs with placeholder icons MUST NOT appear

#### Scenario: Type badges use Badge component

- GIVEN a rutina type is displayed (e.g., "fuerza", "cardio")
- WHEN the badge renders
- THEN shadcn `<Badge>` component MUST be used
- AND custom styled spans with background colors MUST NOT appear

---

### Requirement: AdminCard Wrapper System

The system MUST provide an AdminCard wrapper component that encapsulates card styling and interaction patterns. All card-like elements in admin MUST use this wrapper.

#### AdminCard Props Interface

```typescript
interface AdminCardProps {
  variant: 'hero' | 'standard' | 'interactive';
  children: React.ReactNode;
  onClick?: () => void; // Only for interactive variant
}
```

#### Scenario: Hero card for dominant content

- GIVEN the gym price editor section renders
- WHEN the price display card renders
- THEN `<AdminCard variant="hero">` MUST be used
- AND the price value MUST have `text-3xl font-bold` typography

#### Scenario: Standard card for metrics

- GIVEN the dashboard stats cards render
- WHEN each stat card renders
- THEN `<AdminCard variant="standard">` MUST be used
- AND each card MUST have `p-4` padding

#### Scenario: Interactive card for navigation

- GIVEN recent routines section renders routine cards
- WHEN each routine card renders
- THEN `<AdminCard variant="interactive" onClick={handleClick}>` MUST be used
- AND cards MUST have hover effects (`hover:shadow-md hover:scale-[1.01]`)
- AND cards MUST have `cursor-pointer`

#### Scenario: Interactive card hover uses semantic tokens

- GIVEN an interactive card needs background color change on hover
- WHEN the card variant is implemented
- THEN hover effects MUST use semantic tokens (e.g., `hover:bg-accent`)
- AND hardcoded colors like `hover:bg-zinc-700` are PROHIBITED

#### Scenario: Interactive card hover group actions

- GIVEN an interactive card has child action buttons
- WHEN the card is hovered
- THEN child actions MUST use semantic tokens for hover states
- AND `group-hover:bg-red-500` style patterns are PROHIBITED

#### Scenario: AdminCard does NOT accept className

- GIVEN a developer attempts to override AdminCard styling
- WHEN they write `<AdminCard className="bg-red-500 p-7" />`
- THEN the className prop MUST NOT exist on AdminCard interface
- AND ESLint rule `no-raw-classname-in-admin` MUST report an error
- AND the developer MUST use a different variant or request a new one

---

### Requirement: AdminTable Wrapper System

The system MUST provide an AdminTable wrapper component that encapsulates table styling, sticky headers, row selection, and action patterns.

#### AdminTable Props Interface

```typescript
interface AdminTableProps<T> {
  variant: 'default' | 'selectable';
  columns: ColumnDef<T>[]; // TanStack Table columns
  data: T[];
}
```

#### Scenario: Table with sticky header

- GIVEN AdminTable renders with column headers
- WHEN the table scrolls
- THEN the header row MUST be sticky at the top
- AND header MUST have `bg-muted/50` or similar background

#### Scenario: Table with row hover

- GIVEN AdminTable renders with data rows
- WHEN a row is hovered
- THEN the row background MUST change to `hover:bg-muted/50`

#### Scenario: Table with group-based row actions

- GIVEN AdminTable renders with action buttons per row
- WHEN a row is not hovered
- THEN action buttons MUST have `opacity-0`
- WHEN a row is hovered
- THEN action buttons MUST have `opacity-100` via `group-hover` pattern

#### Scenario: Table with multi-select

- GIVEN AdminTable is used with `variant="selectable"`
- WHEN rows render
- THEN checkboxes MUST appear in the first column
- AND "Select All" functionality MUST be available
- AND batch actions MUST appear when rows are selected

#### Scenario: AdminTable does NOT accept className

- GIVEN a developer attempts to override AdminTable styling
- WHEN they write `<AdminTable className="custom-table-style" />`
- THEN the className prop MUST NOT exist on AdminTable interface
- AND ESLint rule `no-raw-classname-in-admin` MUST report an error
- AND the developer MUST use the variant prop or request enhancement

---

### Requirement: AdminFormField Wrapper System

The system MUST provide an AdminFormField wrapper component that encapsulates label, input, and error message patterns.

#### AdminFormField Props Interface

```typescript
interface AdminFormFieldProps {
  variant?: 'text' | 'select' | 'textarea';
  label: string;
  error?: string | string[];
  isPending?: boolean;
  children: React.ReactNode;
}
```

#### Scenario: FormField renders with label above input

- GIVEN AdminFormField wraps an input element
- WHEN the field renders
- THEN the label MUST appear above the input
- AND label MUST have `text-sm font-medium`

#### Scenario: FormField renders with error message

- GIVEN AdminFormField wraps an input with a validation error
- WHEN the field renders
- THEN the error message MUST appear below the input
- AND error text MUST be `text-destructive text-xs`

#### Scenario: FormField handles disabled state

- GIVEN AdminFormField is used while form is submitting
- WHEN `isPending={true}` is passed
- THEN the wrapped input MUST be disabled

#### Scenario: FormField provides consistent spacing

- GIVEN multiple AdminFormField components render in a form
- WHEN fields render
- THEN vertical spacing between fields MUST be `space-y-4`

#### Scenario: AdminFormField does NOT accept className

- GIVEN a developer attempts to override AdminFormField styling
- WHEN they write `<AdminFormField className="mb-6" />`
- THEN the className prop MUST NOT exist on AdminFormField interface
- AND ESLint rule `no-raw-classname-in-admin` MUST report an error
- AND the developer MUST use the variant prop or request enhancement

---

### Requirement: Button Hierarchy System

The system MUST use a consistent button hierarchy throughout the admin panel based on visual prominence.

#### Button Variants and Usage

| Variant | Use Case | Priority |
|---------|----------|----------|
| `variant="default"` | Primary actions (Crear, Guardar) | Highest |
| `variant="secondary"` | Secondary actions (Cancelar, Ver lista) | Medium |
| `variant="ghost"` | Tertiary actions (Settings, Filters) | Low |
| `variant="destructive"` | Destructive actions (Eliminar) | Critical |
| `variant="outline"` | Alternative secondary actions | Medium |

#### Scenario: Primary action uses default variant

- GIVEN "Crear Rutina" button renders
- WHEN the button displays
- THEN `variant="default"` MUST be used
- AND the button MUST be visually prominent

#### Scenario: Destructive action uses destructive variant

- GIVEN "Eliminar Rutina" button renders
- WHEN the button displays
- THEN `variant="destructive"` MUST be used
- AND button MUST use `bg-destructive` colors

#### Scenario: Cancel uses secondary variant

- GIVEN "Cancelar" button renders next to primary action
- WHEN the button displays
- THEN `variant="secondary"` SHOULD be used
- AND button MUST NOT compete visually with primary action

#### Scenario: Action buttons use consistent sizes

- GIVEN buttons render throughout admin pages
- WHEN sizes are chosen
- THEN sizes SHOULD be consistent: `sm`, `default`, `lg`, or `icon`
- AND arbitrary sizes like `text-[13px]` MUST NOT be used

#### Scenario: Button hover uses semantic tokens

- GIVEN a button needs hover state
- WHEN the button variant is implemented
- THEN hover effects MUST use semantic tokens (e.g., `hover:bg-primary/80`, `hover:opacity-90`)
- AND hardcoded colors like `hover:bg-blue-600` are PROHIBITED

#### Scenario: Button focus uses semantic tokens

- GIVEN a button needs focus ring
- WHEN the button variant is implemented
- THEN focus ring MUST use semantic tokens (e.g., `focus:ring-primary`, `focus:ring-offset-background`)
- AND hardcoded colors like `focus:ring-red-500` are PROHIBITED

#### Scenario: Button active uses semantic tokens

- GIVEN a button needs active state
- WHEN the button variant is implemented
- THEN active effects MUST use semantic tokens (e.g., `active:bg-accent`)
- AND hardcoded colors like `active:bg-yellow-500` are PROHIBITED

---

### Requirement: Loading States with Skeletons

The system MUST use shadcn `Skeleton` component for loading states instead of spinners or custom shimmer animations.

#### Scenario: Card loading state

- GIVEN a card is loading its data
- WHEN the card renders during loading
- THEN `Skeleton` components MUST be used as placeholders
- AND skeleton shapes MUST match the content layout

#### Scenario: Table loading state

- GIVEN a table is loading its data
- WHEN the table renders during loading
- THEN rows of `Skeleton` cells MUST be displayed
- AND the number of skeleton rows SHOULD match typical page size (5-10)

#### Scenario: Form disabled during submission

- GIVEN a form is being submitted
- WHEN the submit button is clicked
- THEN the button MUST show loading state (`disabled={isPending}`)
- AND form inputs MAY be disabled during submission

---

### Requirement: Empty States

The system MUST use shadcn `Empty` component for empty state messages with consistent styling and optional CTA button.

#### Scenario: Empty rutinas list

- GIVEN the rutinas list page has no rutinas
- WHEN the empty state renders
- THEN shadcn `<Empty>` component MUST be used
- AND MUST include an icon, title "No hay rutinas", description, and CTA button

#### Scenario: Empty search results

- GIVEN a search yields no results
- WHEN the empty state renders
- THEN `<Empty>` MUST be used with message "No se encontraron resultados"

---

### Requirement: Error States

The system MUST display error states using non-blocking toast or inline messages, NOT blocking dialogs.

#### Scenario: Error fetching data

- GIVEN data fetch fails
- WHEN the error is displayed
- THEN a toast.error() SHOULD be shown
- AND the page MAY show cached data with an error indicator

#### Scenario: Validation error in form

- GIVEN form validation fails
- WHEN the error is displayed
- THEN error messages MUST appear inline below affected fields
- AND form MUST NOT be blocked from editing

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/rutinas-list-client.tsx` | MODIFY - Replace `<table>` with shadcn Table |
| `src/components/admin/rutina-form.tsx` | MODIFY - Replace `<select>` with shadcn Select |
| `src/components/admin/admin-layout.tsx` | MODIFY - Replace custom dropdown with DropdownMenu |
| `src/components/admin/admin-card.tsx` | NEW - AdminCard wrapper |
| `src/components/admin/admin-table.tsx` | NEW - AdminTable wrapper |
| `src/components/admin/admin-form-field.tsx` | NEW - AdminFormField wrapper |
| `src/app/(admin)/admin/page.tsx` | MODIFY - Use AdminCard, shadcn Empty for empty states |
| `src/components/admin/dia-manager.tsx` | MODIFY - Use AdminCard and form patterns |
| `src/components/admin/ejercicio-list.tsx` | MODIFY - Use AdminTable pattern |
| `src/components/admin/feriado-manager.tsx` | MODIFY - Use AdminCard, form patterns |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | Raw `<table>` not used in admin components | Grep for `<table>` in admin |
| AC2 | Raw `<select>` not used in admin components | Grep for `<select>` in admin |
| AC3 | Custom dropdown not used - DropdownMenu used | Code review |
| AC4 | shadcn Empty used for empty states | Code review |
| AC5 | shadcn Badge used for tags | Code review |
| AC6 | AdminCard wrapper exists and used | Grep for AdminCard usage |
| AC7 | AdminTable wrapper exists and used | Grep for AdminTable usage |
| AC8 | AdminFormField wrapper exists and used | Grep for AdminFormField usage |
| AC9 | Button variants follow hierarchy | Visual inspection |
| AC10 | Skeletons used for loading states | Code review |
