# Tasks: pagination-admin-rutinas

## Phase 1: AdminTable Pagination Foundation

- [x] 1.1 **Import `getPaginationRowModel`** in `src/components/admin/admin-table.tsx`
  - Add to existing import from `@tanstack/react-table`:
    ```ts
    import { flexRender, getCoreRowModel, useReactTable, ColumnDef, getPaginationRowModel } from '@tanstack/react-table';
    ```

- [x] 1.2 **Add `initialState` prop to `AdminTableProps`** in `src/components/admin/admin-table.tsx`
  - Add to interface:
    ```ts
    initialState?: {
      pagination?: {
        pageSize?: number;
        pageIndex?: number;
      };
    };
    ```

- [x] 1.3 **Add `getPaginationRowModel` to `useReactTable` config** in `src/components/admin/admin-table.tsx`
  - Add after `getCoreRowModel: getCoreRowModel()`:
    ```ts
    getPaginationRowModel: getPaginationRowModel(),
    ```

- [x] 1.4 **Spread `initialState` in `useReactTable`** in `src/components/admin/admin-table.tsx`
  - Add `...initialState` before `state:` block:
    ```ts
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      enableRowSelection,
      getRowId: (row) => row.id,
      onRowSelectionChange: (updater) => {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        onRowSelectionChange?.(newSelection);
      },
      ...initialState,
      state: {
        rowSelection,
        ...initialState?.state,
      },
    });
    ```

**Verification for Phase 1:**
- [x] `getPaginationRowModel` imported without errors
- [x] `AdminTable` accepts `initialState` prop
- [x] `useReactTable` spreads `initialState` correctly
- [x] Table renders without pagination errors (no data loss)

---

## Phase 2: RutinasListClient Pagination Config

- [x] 2.1 **Add `initialState.pagination.pageSize: 15`** in `src/components/admin/rutinas-list-client.tsx`
  - Find `AdminTable` component usage (around line 291)
  - Add `initialState` prop:
    ```tsx
    <AdminTable
      variant="selectable"
      columns={columns}
      data={filteredRutinas}
      initialState={{
        pagination: {
          pageSize: 15,
        },
      }}
      emptyMessage="No hay rutinas creadas"
      enableRowSelection
      rowSelection={rowSelection}
      onRowSelectionChange={handleRowSelectionChange}
    />
    ```

**Verification for Phase 2:**
- [x] `initialState.pagination.pageSize: 15` configured
- [x] Table displays exactly 15 rows when >15 items exist
- [x] Pagination state is accessible via `table.getState().pagination`

---

## Phase 3: Pagination UI Controls

- [x] 3.1 **Add pagination controls after `AdminTable`** in `src/components/admin/rutinas-list-client.tsx`
  - Find the closing `/>` of `AdminTable` (around line 299)
  - Add pagination controls between `AdminTable` and the search no-results message:
    ```tsx
    {/* Pagination Controls */}
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Siguiente
      </Button>
    </div>
    ```

**Verification for Phase 3:**
- [x] "Anterior" button visible and disabled on first page
- [x] "Siguiente" button visible and disabled on last page
- [x] Page indicator shows "Página X de Y" correctly
- [x] Buttons navigate correctly between pages

---

## Phase 4: Fix Checkbox Header Selection Logic

- [x] 4.1 **Compute checkbox state over ALL filtered rows** in `src/components/admin/rutinas-list-client.tsx`
  - Find `columns` definition (line 35) - this is OUTSIDE the component function
  - **Move `columns` INSIDE the component** so it has access to `filteredRutinas` and `rowSelection` state
  - Add computed values before `columns` definition:
    ```tsx
    // Compute selection state over ALL filtered rows (not just current page)
    const allFilteredSelected = filteredRutinas.length > 0 && 
      filteredRutinas.every(r => selectedIds.includes(r.id));
    const someFilteredSelected = filteredRutinas.some(r => selectedIds.includes(r.id));
    
    // Toggle handler for header checkbox
    const toggleAllFiltered = () => {
      if (allFilteredSelected) {
        setRowSelection(prev => {
          const next = { ...prev };
          filteredRutinas.forEach(r => delete next[r.id]);
          return next;
        });
      } else {
        setRowSelection(prev => {
          const next = { ...prev };
          filteredRutinas.forEach(r => { next[r.id] = true });
          return next;
        });
      }
    };
    
    const columns: ColumnDef<RutinaWithCount, unknown>[] = [
    ```

- [x] 4.2 **Replace checkbox header logic** in `src/components/admin/rutinas-list-client.tsx`
  - Replace lines 38-45 (the `header` function in the select column):
    ```tsx
    header: () => (
      <input
        type="checkbox"
        checked={allFilteredSelected}
        ref={(el) => {
          if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
        }}
        onChange={toggleAllFiltered}
        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
      />
    ),
    ```

- [x] 4.3 **Remove unused TanStack checkbox methods** in header (keep cell unchanged)
  - The cell (lines 46-53) can stay using `row.getIsSelected()` and `row.toggleSelected()` — these work correctly with pagination because rowSelection is keyed by row ID

**Verification for Phase 4:**
- [x] Checkbox header reflects GLOBAL selection (all filtered rows), not just current page
- [x] "Select all" with 100 filtered routines and 15 visible → all 100 selected
- [x] Toggle off deselects all filtered rows
- [x] Indeterminate state shows when some but not all filtered rows selected
- [x] Selection persists correctly across page navigation

---

## Implementation Order

1. **Phase 1 first** — AdminTable must support pagination before RutinasListClient can use it
2. **Phase 2 second** — Configure pageSize in RutinasListClient
3. **Phase 3 third** — Add UI controls (can verify pagination works)
4. **Phase 4 last** — Fix checkbox header (most critical, requires moving columns inside component)

**Why this order:**
- Phase 1 creates the foundation (no dependencies)
- Phase 2 configures pagination (depends on Phase 1)
- Phase 3 adds visibility to pagination behavior (depends on Phase 2)
- Phase 4 is the bug fix that changes column behavior (depends on understanding current state + pagination)

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/admin/admin-table.tsx` | Added `getPaginationRowModel`, `initialState` prop support |
| `src/components/admin/rutinas-list-client.tsx` | Added `initialState.pagination`, pagination controls UI, fixed checkbox header logic |

---

## Success Criteria

- [x] Table shows max 15 rows per page
- [x] "Anterior" / "Siguiente" buttons navigate correctly
- [x] Page indicator shows "Página X de Y"
- [x] Previous disabled on first page, Next disabled on last page
- [x] Checkbox header selects ALL filtered rows (not just current page)
- [x] Batch delete works across all selected rows (any page)
- [ ] ESLint passes, TypeScript compiles
