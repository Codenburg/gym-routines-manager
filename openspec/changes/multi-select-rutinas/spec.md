# Delta for Admin Panel — Multi-Select Rutinas

## Overview

This delta spec adds multi-select functionality to the rutinas table in the admin panel, enabling bulk deletion via a unified server action. The feature introduces checkbox-based selection, a conditional bulk delete button, and a single `deleteMany` server action to eliminate N+1 query issues.

---

## ADDED Requirements

### Requirement: Multi-Select State Management

The system SHALL maintain a client-side selection state as a `Set<string>` containing routine IDs.

The client component MUST use `useState<Set<string>>` with the following implementation:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Methods:
const toggleSelection = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};

const selectAll = () => {
  setSelectedIds(new Set(rutinas.map(r => r.id)));
};

const deselectAll = () => {
  setSelectedIds(new Set());
};

const isAllSelected = selectedIds.size === rutinas.length && rutinas.length > 0;
```

#### Scenario: Initial state is empty

- GIVEN the rutinas table loads
- WHEN the component mounts
- THEN `selectedIds` MUST be initialized as an empty `Set`
- AND no rows appear selected

#### Scenario: Toggle single row

- GIVEN `selectedIds` contains `[id1]`
- WHEN the user clicks the checkbox for `id2`
- THEN `selectedIds` MUST contain `[id1, id2]`

#### Scenario: Toggle deselects

- GIVEN `selectedIds` contains `[id1, id2]`
- WHEN the user clicks the checkbox for `id1`
- THEN `selectedIds` MUST contain `[id2]`

#### Scenario: Select all

- GIVEN `selectedIds` is empty
- WHEN the user clicks the header checkbox (or calls selectAll)
- THEN `selectedIds` MUST contain ALL routine IDs from the current list

#### Scenario: Deselect all

- GIVEN `selectedIds` contains `[id1, id2, id3]`
- WHEN the user deselects all
- THEN `selectedIds` MUST be empty

---

### Requirement: Checkbox Column UI

The rutinas table MUST include a checkbox column positioned at the LEFT of the "Nombre" column.

**Header Checkbox Behavior:**
- Checked state: `selectedIds.size === rutinas.length && rutinas.length > 0`
- Indeterminate state: `selectedIds.size > 0 && selectedIds.size < rutinas.length`
- onChange: if checked or indeterminate → `selectAll()`, else `deselectAll()`

**Row Checkbox Behavior:**
- Checked state: `selectedIds.has(rutina.id)`
- onChange: `toggleSelection(rutina.id)`

The system SHOULD use the shadcn `Checkbox` component for consistent styling.

#### Scenario: Header shows checked when all selected

- GIVEN all routines are selected
- WHEN the header checkbox renders
- THEN it MUST display as checked
- AND NOT as indeterminate

#### Scenario: Header shows indeterminate when partially selected

- GIVEN 2 of 5 routines are selected
- WHEN the header checkbox renders
- THEN it MUST display as indeterminate (tri-state)
- AND NOT as checked

#### Scenario: Header click selects all when indeterminate

- GIVEN 2 of 5 routines are selected
- WHEN the user clicks the indeterminate header checkbox
- THEN `selectAll()` MUST be called
- AND all 5 routines MUST now be selected

#### Scenario: Header click deselects when all checked

- GIVEN all routines are selected
- WHEN the user clicks the checked header checkbox
- THEN `deselectAll()` MUST be called
- AND no routines MUST be selected

#### Scenario: Row checkbox toggles individual selection

- GIVEN routine `id1` is NOT selected
- WHEN the user clicks the checkbox for that row
- THEN `toggleSelection(id1)` MUST be called
- AND the routine MUST appear selected

---

### Requirement: Bulk Delete Button UI

The system MUST display a "Eliminar X rutinas" button that is ONLY visible when `selectedIds.size > 0`.

**Button Requirements:**
- Text: "Eliminar X rutinas" where X equals `selectedIds.size`
- Visibility: `selectedIds.size > 0`
- Position: Prominent location (above or below the table)
- Style: destructive variant (red styling via shadcn Button)

#### Scenario: Button hidden when no selection

- GIVEN `selectedIds.size === 0`
- WHEN the component renders
- THEN the delete button MUST NOT be visible

#### Scenario: Button shows correct count

- GIVEN `selectedIds.size === 3`
- WHEN the component renders
- THEN the button text MUST be "Eliminar 3 rutinas"

#### Scenario: Button visible with one selection

- GIVEN `selectedIds.size === 1`
- WHEN the component renders
- THEN the button text MUST be "Eliminar 1 rutina"
- AND the button MUST be visible

---

### Requirement: Server Action `deleteRutinas`

The system MUST provide a server action `deleteRutinas` at `src/app/actions/rutinas.ts` that accepts a `FormData` containing a JSON string array of IDs and executes a single `deleteMany` operation.

**Signature:**
```typescript
async function deleteRutinas(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ deletedCount: number }>>
```

**Implementation Requirements:**
1. Extract `ids` from `formData.get('ids')` as JSON string array
2. Validate admin session via `verifyAdmin()`
3. If `!ids || ids.length === 0`, return `{ success: false, message: "No hay rutinas seleccionadas" }`
4. Execute: `prisma.rutina.deleteMany({ where: { id: { in: ids } } })`
5. Revalidate paths: `/admin/rutinas` and `/`
6. Return: `{ success: true, data: { deletedCount: result.count } }`
7. Wrap in try/catch, return generic error message on failure

#### Scenario: Successful bulk delete

- GIVEN the admin is authenticated
- AND `ids = ["id1", "id2", "id3"]` is passed
- WHEN `deleteRutinas` is called
- THEN exactly ONE `deleteMany` query MUST be executed
- AND `result.count` MUST equal 3
- AND return value MUST be `{ success: true, data: { deletedCount: 3 } }`

#### Scenario: Empty IDs validation

- GIVEN `ids = []` is passed
- WHEN `deleteRutinas` is called
- THEN NO database operation MUST occur
- AND return value MUST be `{ success: false, message: "No hay rutinas seleccionadas" }`

#### Scenario: Missing IDs validation

- GIVEN no `ids` field is provided in formData
- WHEN `deleteRutinas` is called
- THEN NO database operation MUST occur
- AND return value MUST be `{ success: false, message: "No hay rutinas seleccionadas" }`

#### Scenario: Unauthorized call rejected

- GIVEN the user is NOT authenticated as admin
- WHEN `deleteRutinas` is called
- THEN `{ success: false, message: "No tienes permisos de administrador" }` MUST be returned

#### Scenario: Database error handled gracefully

- GIVEN the database is unavailable
- WHEN `deleteRutinas` is called
- THEN a generic error message MUST be returned
- AND NO internal error details MUST leak to client

---

### Requirement: Delete Flow (UI to Server Action)

The system MUST implement the following user flow for bulk deletion:

1. User clicks "Eliminar X rutinas" button
2. System calls `window.confirm(\`¿Eliminar \${selectedIds.size} rutinas?\nEsta acción no se puede deshacer.\`)`
3. If confirmed:
   - Call `toast.promise(deleteRutinasAction, { loading: "Eliminando...", success: (data) => "\${data.deletedCount} rutinas eliminadas", error: "Error al eliminar" })`
4. On success:
   - Clear selection: `setSelectedIds(new Set())`
   - Trigger data refresh via `revalidatePath('/admin/rutinas')` and `revalidatePath('/')`
5. On error:
   - Toast displays error message from server

**Constraint:** The system MUST use `window.confirm()` and NOT `alert()` or a custom `useConfirm` hook.

#### Scenario: Full delete flow with confirmation accepted

- GIVEN 2 routines are selected
- WHEN the user clicks "Eliminar 2 rutinas"
- AND the user confirms in `window.confirm()`
- THEN `toast.promise()` MUST be called with loading state
- AND on success, `selectedIds` MUST be cleared
- AND the toast MUST show "2 rutinas eliminadas"

#### Scenario: Delete cancelled by user

- GIVEN 2 routines are selected
- WHEN the user clicks "Eliminar 2 rutinas"
- AND the user cancels in `window.confirm()`
- THEN NO server action MUST be called
- AND `selectedIds` MUST remain unchanged

---

### Requirement: No Client-Side Iteration for Deletions

The system MUST NOT perform client-side iteration to delete routines individually.

**Constraint:** All deletions MUST go through the single `deleteRutinas` action which executes exactly ONE `deleteMany` query.

#### Scenario: Bulk delete uses single query

- GIVEN 10 routines are selected for deletion
- WHEN the delete action executes
- THEN exactly ONE database query MUST be executed
- AND it MUST be `prisma.rutina.deleteMany({ where: { id: { in: [...] } } })`

---

## Edge Cases

### Edge Case: Empty rutinas list

- GIVEN `rutinas.length === 0`
- WHEN the table renders
- THEN header checkbox MUST be unchecked
- AND row checkboxes MUST NOT render (no rows exist)
- AND delete button MUST NOT be visible

### Edge Case: Selection after list refresh

- GIVEN user has selected routines
- WHEN the list refreshes (e.g., after filter change)
- THEN the selection state MUST be preserved in client memory
- AND selectedIds MAY contain IDs that no longer exist in the new list

### Edge Case: Rapid toggle during delete

- GIVEN the user rapidly toggles checkboxes while delete is in progress
- WHEN the delete completes
- THEN `selectedIds` MUST be cleared regardless of intermediate toggles
- AND the displayed state MUST reflect the cleared selection

### Edge Case: Delete partial overlap with current selection

- GIVEN `selectedIds = [id1, id2, id3]`
- AND user selects "Eliminar 3 rutinas"
- AND confirmation is given
- WHEN `deleteRutinas` executes with `ids = [id1, id2, id3]`
- THEN all 3 routines MUST be deleted
- AND selection MUST clear

---

## Acceptance Criteria

| ID | Criterion | Requirement |
|----|-----------|-------------|
| AC1 | `selectedIds` is a `Set<string>` initialized as empty | Multi-Select State |
| AC2 | `toggleSelection(id)` adds/removes ID from set | Multi-Select State |
| AC3 | `selectAll()` selects all routines | Multi-Select State |
| AC4 | `deselectAll()` clears selection | Multi-Select State |
| AC5 | `isAllSelected` returns true when all routines selected | Multi-Select State |
| AC6 | Checkbox column appears LEFT of "Nombre" column | Checkbox Column |
| AC7 | Header checkbox shows indeterminate when partially selected | Checkbox Column |
| AC8 | Header checkbox triggers selectAll/deselectAll | Checkbox Column |
| AC9 | Row checkbox toggles individual selection | Checkbox Column |
| AC10 | Delete button text shows "Eliminar X rutinas" | Bulk Delete Button |
| AC11 | Delete button visible ONLY when `selectedIds.size > 0` | Bulk Delete Button |
| AC12 | Delete button uses destructive variant styling | Bulk Delete Button |
| AC13 | `deleteRutinas` signature matches `FormState<T>` pattern | Server Action |
| AC14 | `deleteRutinas` extracts IDs from `formData.get('ids')` | Server Action |
| AC15 | Empty IDs return validation error message | Server Action |
| AC16 | `deleteRutinas` executes single `deleteMany` query | Server Action |
| AC17 | Successful delete returns `deletedCount` | Server Action |
| AC18 | `window.confirm()` is used for confirmation | Delete Flow |
| AC19 | `toast.promise()` provides loading/success/error states | Delete Flow |
| AC20 | Selection clears after successful deletion | Delete Flow |
| AC21 | Data refreshes after deletion via revalidatePath | Delete Flow |
| AC22 | NO client-side iteration for deletions | Constraint |
| AC23 | Individual `deleteRutina` action remains unchanged | Constraint |
| AC24 | ESLint passes, TypeScript compiles, build succeeds | Technical |

---

## Technical Notes

### Files Affected

| File | Change |
|------|--------|
| `src/components/admin/rutinas-list-client.tsx` | Add selection state, checkboxes, bulk delete UI |
| `src/app/actions/rutinas.ts` | Add `deleteRutinas` server action |
| `components.json` | Add shadcn checkbox |

### Dependencies

- `sonner@2.0.7` — already installed, `toast.promise()` available
- `shadcn checkbox` — requires installation via `npx shadcn@latest add checkbox`

### FormState Type (from `src/lib/schemas.ts`)

```typescript
export interface FormState<T = void> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}
```
