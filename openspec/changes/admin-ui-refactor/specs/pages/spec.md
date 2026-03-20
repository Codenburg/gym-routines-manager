# Delta for pages

## Purpose

This spec defines the page-level requirements for the admin panel UI refactor, covering all admin pages: dashboard, rutinas, días, ejercicios, feriados, and configuración.

---

## ADDED Requirements

### Requirement: Dashboard Page

The admin dashboard MUST display an overview of system statistics and quick actions using the AdminCard system.

#### Scenario: Dashboard displays gym price hero card

- GIVEN the admin dashboard loads
- WHEN the gym price section renders
- THEN `<AdminCard variant="hero">` MUST be used
- AND price MUST display as `$XX.XXX` format with `text-3xl font-bold`

#### Scenario: Dashboard displays stats grid

- GIVEN the admin dashboard loads
- WHEN the stats section renders
- THEN 3 metric cards MUST display in `grid-cols-1 md:grid-cols-3` layout
- AND each card MUST use `<AdminCard variant="standard">`
- AND metrics MUST show: Total Rutinas, Total Días, Total Ejercicios

#### Scenario: Dashboard stats use semantic colors

- GIVEN dashboard stat cards render with colored icons
- WHEN icon backgrounds render
- THEN they MUST use `bg-destructive/10`, `bg-primary/10`, `bg-success/10` or similar semantic tokens
- AND icon colors MUST use `text-destructive`, `text-primary`, `text-success` or similar
- AND `bg-red-600/20` or `bg-blue-600/20` MUST NOT appear

#### Scenario: Dashboard displays quick actions

- GIVEN the dashboard loads
- WHEN quick actions section renders
- THEN action buttons MUST use proper button variants
- AND buttons MUST include icons from lucide-react
- AND primary action (Nueva Rutina) MUST use `variant="default"`

#### Scenario: Dashboard displays recent routines

- GIVEN the dashboard loads
- WHEN recent routines section renders
- THEN routines MUST display in a responsive grid
- AND each routine card MUST use `<AdminCard variant="interactive" onClick={...}>`
- AND cards MUST show routine name, tipo badge, and days count

#### Scenario: Dashboard shows empty state when no routines

- GIVEN the dashboard loads with no routines
- WHEN the recent routines section renders
- THEN `<Empty>` component MUST be used
- AND MUST show "No hay rutinas creadas" with CTA to create first routine

---

### Requirement: Rutinas List Page

The admin rutinas list page MUST display all routines in an AdminTable with search, selection, and batch actions.

#### Scenario: Rutinas table with columns

- GIVEN the rutinas list page renders
- WHEN the table renders
- THEN columns MUST be: checkboxes, Nombre, Tipo, Creador, Días, Descripción, Acciones
- AND maximum 4 priority columns SHOULD be visible on mobile (Nombre, Tipo, Días, Acciones)

#### Scenario: Table uses shadcn Table components

- GIVEN the rutinas table renders
- WHEN the table markup is generated
- THEN shadcn `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>` MUST be used
- AND raw `<table>` element MUST NOT appear

#### Scenario: Search filters rutinas

- GIVEN the user types in the search input
- WHEN the search term changes
- THEN the table MUST filter by rutina nombre, tipo, or descripción
- AND empty search MUST show all rutinas

#### Scenario: Multi-select with batch delete

- GIVEN checkboxes are available on each row
- WHEN rows are selected
- THEN batch delete bar MUST appear showing count
- AND "Eliminar seleccionadas" button MUST be visible
- AND batch delete MUST use toast.promise() for feedback

#### Scenario: Table empty state

- GIVEN no rutinas exist
- WHEN the page renders
- THEN `<Empty>` component MUST be used
- AND MUST show "No hay rutinas creadas" with CTA button to `/admin/rutinas/new`

#### Scenario: Table no results state

- GIVEN search yields no results
- WHEN the empty search state renders
- THEN `<Empty>` component MUST be used
- AND MUST show "No se encontraron resultados"

---

### Requirement: Rutina Form Page (Create/Edit)

The admin rutina form pages MUST use AdminFormField wrappers and shadcn Select component.

#### Scenario: Create rutina page uses form field wrappers

- GIVEN the rutina create/edit form renders
- WHEN fields render
- THEN `<AdminFormField label="Nombre">` MUST wrap the nombre Input
- AND `<AdminFormField label="Tipo">` MUST wrap the tipo Select
- AND `<AdminFormField label="Descripción">` MUST wrap the descripcion Textarea

#### Scenario: Tipo select uses shadcn Select

- GIVEN the tipo field renders
- WHEN the dropdown opens
- THEN shadcn `<Select>` components MUST be used
- AND options MUST be: fuerza, cardio, flexibilidad, hipertrofia
- AND raw `<select>` element MUST NOT appear

#### Scenario: Form validation errors display inline

- GIVEN form submission fails validation
- WHEN errors return from server action
- THEN error messages MUST appear below affected fields
- AND form MUST NOT be cleared

#### Scenario: Form submission shows toast

- GIVEN form is submitted successfully
- WHEN the server action succeeds
- THEN toast.success("Rutina creada/actualizada exitosamente") MUST appear
- AND page MUST redirect to rutinas list

---

### Requirement: Día Detail Page

The admin día detail page MUST display exercises for a specific day using AdminCard for interactive exercise rows.

#### Scenario: Día page displays day header

- GIVEN the día detail page loads
- WHEN the header renders
- THEN page header pattern MUST be used (title, description, back link)

#### Scenario: Día page displays exercise list

- GIVEN the día detail page loads
- WHEN the exercise list renders
- THEN AdminTable or list of AdminCard variant="interactive" MUST be used
- AND each row MUST show: nombre, series, repes, actions

#### Scenario: Add exercise uses form field pattern

- GIVEN the add exercise form renders
- WHEN fields render
- THEN AdminFormField pattern MUST be used
- AND shadcn Select MUST be used for exercise selection

---

### Requirement: Feriados Page

The admin feriados page MUST display holidays with CRUD operations using AdminCard and AdminTable patterns.

#### Scenario: Feriados page header

- GIVEN the feriados page loads
- WHEN the page header renders
- THEN title MUST be "Feriados" with `text-2xl font-semibold`
- AND description with count of holidays

#### Scenario: Feriados list displays

- GIVEN feriados exist
- WHEN the list renders
- THEN each holiday MUST be in an AdminCard
- AND MUST show: fecha, nombre, país
- AND actions for edit/delete

#### Scenario: Add/delete holidays shows toast

- GIVEN a holiday is created or deleted
- WHEN the action completes
- THEN toast.promise() MUST show appropriate success/error message

---

### Requirement: Configuración Page

The admin configuración page (if exists) MUST use consistent page patterns and AdminCard wrappers.

#### Scenario: Config page uses page header

- GIVEN the configuración page loads
- WHEN the page header renders
- THEN page header pattern MUST be followed

#### Scenario: Config settings use AdminCard

- GIVEN settings sections render
- WHEN each section renders
- THEN AdminCard wrappers MUST be used

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/app/(admin)/admin/page.tsx` | MODIFY - Use AdminCard, semantic tokens, Empty |
| `src/app/(admin)/admin/rutinas/page.tsx` | MODIFY - Use AdminTable, page header |
| `src/app/(admin)/admin/rutinas/new/page.tsx` | MODIFY - Use AdminFormField, shadcn Select |
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | MODIFY - Use AdminCard, AdminFormField |
| `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` | MODIFY - Use AdminCard, AdminFormField |
| `src/app/(admin)/admin/feriados/page.tsx` | MODIFY - Use AdminCard, AdminTable |
| `src/components/admin/rutinas-list-client.tsx` | MODIFY - Use AdminTable |
| `src/components/admin/rutina-form.tsx` | MODIFY - Use AdminFormField, shadcn Select |
| `src/components/admin/dia-manager.tsx` | MODIFY - Use AdminCard |
| `src/components/admin/ejercicio-list.tsx` | MODIFY - Use AdminCard |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| AP1 | Dashboard uses AdminCard with correct variants | Visual inspection |
| AP2 | Dashboard stats use semantic colors (no bg-red-600/20) | Grep for hardcoded colors |
| AP3 | Dashboard recent routines use interactive AdminCard | Code review |
| AP4 | Rutinas list uses AdminTable (not raw table) | Code review |
| AP5 | Rutinas form uses AdminFormField wrappers | Code review |
| AP6 | Form tipo uses shadcn Select (not raw select) | Code review |
| AP7 | Empty states use shadcn Empty component | Code review |
| AP8 | All mutations use toast.promise() | Code review |
| AP9 | Page header pattern follows spec | Visual inspection |
| AP10 | Responsive grids adapt to viewport | Mobile test |
