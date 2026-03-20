# Tasks: Multi-Select Rutinas

## Overview

Implementation tasks for adding checkbox-based multi-select and bulk delete functionality to the admin rutinas table.

**Change**: multi-select-rutinas  
**Spec**: `openspec/changes/multi-select-rutinas/spec.md`  
**Design**: `openspec/changes/multi-select-rutinas/design.md`

---

## Phase 1: Infrastructure

- [ ] 1.1 Install shadcn checkbox component by running:
  ```bash
  npx shadcn@latest add checkbox -y
  ```
  **Verification**: Confirm `src/components/ui/checkbox.tsx` is created with default shadcn export

---

## Phase 2: Server Action

- [ ] 2.1 Add `deleteRutinas` server action to `src/app/actions/rutinas.ts`
  - Insert after line 307 (after existing `deleteRutina` function)
  - **Reference**: Design section "3. File: `src/app/actions/rutinas.ts`" (lines 231-284)
  - **Reference**: Spec requirement "Requirement: Server Action `deleteRutinas`" (lines 160-216)

  Implementation requirements:
  - Signature: `(prevState: FormState, formData: FormData) => Promise<FormState<{ deletedCount: number }>>`
  - Extract `ids` from `formData.get("ids")` as JSON string array
  - Validate admin session via `verifyAdmin()`
  - Return error `{ success: false, message: "No hay rutinas seleccionadas" }` if `!ids || ids.length === 0`
  - Execute single atomic `prisma.rutina.deleteMany({ where: { id: { in: ids } } })`
  - Call `revalidateRutinasCache()`, `revalidatePath("/admin/dashboard")`, `revalidatePath("/admin/rutinas")`
  - Return `{ success: true, data: { deletedCount: result.count } }`
  - Wrap in try/catch with generic error message (NO internal details leaked)

  **Critical constraint**: NO loops, NO individual deletes — exactly ONE `deleteMany` query

---

## Phase 3: Client Component

- [ ] 3.1 Add imports to `src/components/admin/rutinas-list-client.tsx`
  - **Reference**: Design section "1.3 Import Required Modules" (lines 122-126)
  - Add `useRef` import from "react"
  - Add `deleteRutinas` import from "@/app/actions/rutinas"

- [ ] 3.2 Add selection state and helper functions
  - **Reference**: Design section "1.1 Add Selection State" (lines 76-93)
  - **Reference**: Spec requirement "Requirement: Multi-Select State Management" (lines 11-73)

  ```typescript
  // After existing useState declarations (after line 27)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Selection helper functions
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(rutinas.map((r) => r.id)));
  const deselectAll = () => setSelectedIds(new Set());
  const isAllSelected = selectedIds.size === rutinas.length && rutinas.length > 0;
  const isSelected = (id: string) => selectedIds.has(id);
  ```

  **Critical constraint**: ALWAYS create new Set — NEVER mutate existing Set

- [ ] 3.3 Add `handleBulkDelete` async handler
  - **Reference**: Design section "1.2 Add Bulk Delete Handler" (lines 98-117)
  - **Reference**: Spec requirement "Requirement: Delete Flow (UI to Server Action)" (lines 219-251)

  ```typescript
  // After handleDuplicate function (after line 55)
  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selectedIds.size} rutinas?\nEsta acción no se puede deshacer.`)) {
      return;
    }

    const formData = new FormData();
    formData.set("ids", JSON.stringify([...selectedIds]));

    toast.promise(deleteRutinas({ success: false }, formData), {
      loading: "Eliminando rutinas...",
      success: (data) => {
        setSelectedIds(new Set());
        router.refresh();
        return `${data.deletedCount} rutinas eliminadas`;
      },
      error: (err) => err.message || "Error al eliminar rutinas",
    });
  };
  ```

  **Critical constraint**: Pass promise DIRECTLY to `toast.promise()` — NO intermediate wrapper functions

- [ ] 3.4 Add checkbox column to table header
  - **Reference**: Design section "1.4 Add Checkbox Column to Table Header" (lines 130-141)
  - **Reference**: Spec requirement "Requirement: Checkbox Column UI" (lines 77-126)
  - Insert new `<th>` at LEFT of existing "Nombre" column header

  ```typescript
  <th className="w-12 px-6 py-4">
    <Checkbox
      checked={isAllSelected ? true : selectedIds.size > 0 ? "indeterminate" : false}
      onCheckedChange={(checked) => {
        if (checked === true) selectAll();
        else deselectAll();
      }}
      aria-label="Seleccionar todas"
    />
  </th>
  ```

  **Logic requirements**:
  - `checked={true}` when all selected
  - `checked="indeterminate"` when partially selected (`selectedIds.size > 0 && selectedIds.size < rutinas.length`)
  - `checked={false}` when none selected
  - onChange: if checked or indeterminate → `selectAll()`, else `deselectAll()`

- [ ] 3.5 Add checkbox to each table row
  - **Reference**: Design section "1.5 Add Checkbox to Each Table Row" (lines 146-155)
  - Insert new `<td>` as first column (before "Nombre" column)

  ```typescript
  <td className="w-12 px-6 py-4">
    <Checkbox
      checked={isSelected(rutina.id)}
      onCheckedChange={() => toggleSelection(rutina.id)}
      aria-label={`Seleccionar ${rutina.nombre}`}
    />
  </td>
  ```

- [ ] 3.6 Add bulk delete UI section
  - **Reference**: Design section "1.6 Add Bulk Delete Button" (lines 159-181)
  - **Reference**: Spec requirement "Requirement: Bulk Delete Button UI" (lines 129-157)
  - Position: Before the table, after the search input div (around line 77)

  ```typescript
  {selectedIds.size > 0 && (
    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
      <span className="text-sm text-destructive font-medium">
        {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
      </span>
      <button
        type="button"
        onClick={handleBulkDelete}
        className="ml-auto px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors"
      >
        Eliminar seleccionadas
      </button>
      <button
        type="button"
        onClick={deselectAll}
        className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancelar
      </button>
    </div>
  )}
  ```

  **Visibility constraint**: ONLY visible when `selectedIds.size > 0`

---

## Phase 4: Verification

- [ ] 4.1 Verify TypeScript compilation
  ```bash
  npx tsc --noEmit
  ```

- [ ] 4.2 Verify ESLint passes
  ```bash
  npm run lint
  ```

- [ ] 4.3 Verify shadcn checkbox component exists and exports Checkbox correctly

- [ ] 4.4 Test selection scenarios (manual or automated):
  - Initial state: no rows selected
  - Toggle single row: checkbox toggles individual ID
  - Select all: header checkbox selects all visible routines
  - Deselect all: clears selection
  - Header indeterminate: shows when partially selected

- [ ] 4.5 Test bulk delete flow:
  - Button visible only when `selectedIds.size > 0`
  - `window.confirm()` dialog appears
  - Cancel does NOT trigger delete
  - Confirm triggers `toast.promise()` with loading state
  - Success clears selection and refreshes table
  - Error shows error toast

- [ ] 4.6 Verify no regression: individual `deleteRutina` action still works

---

## Dependency Graph

```
Phase 1 (checkbox install)
       │
       ▼
Phase 2 (deleteRutinas server action)
       │
       ▼
Phase 3 (client component changes)
       │
       ▼
Phase 4 (verification)
```

---

## File Changes Summary

| File | Change Type |
|------|-------------|
| `src/components/ui/checkbox.tsx` | **NEW** (shadcn generated) |
| `src/app/actions/rutinas.ts` | Modified (+45 lines) |
| `src/components/admin/rutinas-list-client.tsx` | Modified (+43 lines) |
| `components.json` | Modified |
| `package.json` | Modified (+dependencies) |
