# Proposal: Paginación Admin Rutinas

## Intent

Implementar paginación frontend en la tabla de rutinas del panel admin usando TanStack Table. El sistema actual trae TODOS los datos y filtra en cliente, lo cual funciona bien para volúmenes pequeños-medianos. Agregar paginación con máximo 15 filas por página mejora la UX sin complejidad de backend.

**Problema**: Sin paginación, listas grandes de rutinas generan scroll excesivo y degradan performance de renderizado.

## Scope

### In Scope
- Importar `getPaginationRowModel` de `@tanstack/react-table` en `admin-table.tsx`
- Exponer `table` con métodos de paginación disponibles en `AdminTable`
- Configurar `initialState.pagination: { pageSize: 15 }` en `rutinas-list-client.tsx`
- Controles de paginación UI: botones "Anterior" / "Siguiente" + indicador "Página X de Y"
- **FIX CRÍTICO**: Checkbox header debe operar sobre TODAS las filas filtradas (`filteredRutinas`), no solo la página actual

### Out of Scope
- Backend pagination (server actions, `getRutinas()` sin cambios)
- Cache/invalidation
- API routes
- Configuración de pageSize por usuario
- Autres entidades (días, ejercicios)

## Approach

### 1. AdminTable (admin-table.tsx)

Importar `getPaginationRowModel` y agregarlo a la config de `useReactTable`:

```typescript
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, ColumnDef } from '@tanstack/react-table';

// En useReactTable:
getCoreRowModel: getCoreRowModel(),
getPaginationRowModel: getPaginationRowModel(),
```

No se necesita `initialState` aquí porque se pasa desde `rutinas-list-client.tsx`.

### 2. RutinasListClient (rutinas-list-client.tsx)

#### 2a. Config de tabla

Pasar `initialState.pagination` al componente `AdminTable`:

```tsx
<AdminTable
  variant="selectable"
  columns={columns}
  data={filteredRutinas}
  initialState={{
    pagination: { pageSize: 15 }
  }}
  // ...rest
/>
```

**CRÍTICO**: `AdminTable` debe spread `initialState` en su `useReactTable`:

```typescript
const table = useReactTable({
  // ...existing
  ...initialState,
  state: {
    ...state,
    rowSelection,
  },
});
```

#### 2b. Controles de paginación

Agregar después de la tabla:

```tsx
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

#### 2c. Fix del checkbox header

El problema: `table.getIsAllPageRowsSelected()` solo considera filas de la página actual.

Solución: Reemplazar la lógica del header checkbox para operar sobre `filteredRutinas`:

```typescript
// Computar selección sobre TODAS las filas filtradas
const allFilteredSelected = filteredRutinas.length > 0 && 
  filteredRutinas.every(row => selectedIds.includes(row.id));
const someFilteredSelected = filteredRutinas.some(row => selectedIds.includes(row.id));

// Toggle: seleccionar/deseleccionar TODAS las filtradas
const toggleAll = () => {
  if (allFilteredSelected) {
    setRowSelection(prev => {
      const next = { ...prev };
      filteredRutinas.forEach(row => delete next[row.id]);
      return next;
    });
  } else {
    setRowSelection(prev => {
      const next = { ...prev };
      filteredRutinas.forEach(row => { next[row.id] = true });
      return next;
    });
  }
};

// En el header:
header: ({ table }) => (
  <input
    type="checkbox"
    checked={allFilteredSelected}
    ref={(el) => {
      if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
    }}
    onChange={toggleAll}
    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
  />
),
```

### 3. AdminTable Props

Agregar `initialState` a `AdminTableProps`:

```typescript
interface AdminTableProps<T> {
  // ...existing
  initialState?: Partial<TableState>;
}
```

Y spread en `useReactTable`:

```typescript
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

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/admin/admin-table.tsx` | Modified | Agregar `getPaginationRowModel`, soporte `initialState` |
| `src/components/admin/rutinas-list-client.tsx` | Modified | Configurar pagination, agregar controles UI, fix checkbox header |
| `src/app/(admin)/admin/rutinas/page.tsx` | No change | Ya trae todos los datos |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Checkbox "select all" opera solo sobre página actual | Medium | Fix explícito con lógica sobre `filteredRutinas` |
| `table.getPageCount()` devuelve 0 sin datos | Low | Usar `\|\| 1` en el indicador |
| Paginación rompe con filtros vacíos | Low | `filteredRutinas` se recalcula en cada render |
| Selección se mantiene por ID (correcto) | None | `getRowId: row => row.id` ya está configurado |

## Rollback Plan

1. **Revert files**:
   ```bash
   git checkout HEAD -- src/components/admin/admin-table.tsx src/components/admin/rutinas-list-client.tsx
   ```
2. **Verificar**: Build pasa, ESLint pasa, funcionalidad de selección vuelve a estado anterior.

## Dependencies

- `@tanstack/react-table` (ya instalado - `getPaginationRowModel` disponible)
- `Button` shadcn (ya instalado)
- `filteredRutinas` computation (ya existe en `rutinas-list-client.tsx`)

## Success Criteria

- [ ] Tabla muestra máximo 15 filas por página
- [ ] Botones "Anterior" / "Siguiente" navegan correctamente
- [ ] Indicador muestra "Página X de Y" preciso
- [ ] Botón "Anterior" deshabilitado en primera página
- [ ] Botón "Siguiente" deshabilitado en última página
- [ ] Checkbox header opera sobre TODAS las filas filtradas, no solo la página
- [ ] Selección múltiple funciona correctamente con paginación
- [ ] Eliminación batch respeta selección global (no solo página actual)
- [ ] ESLint pasa, TypeScript compila, build succeeds
