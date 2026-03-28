# Design: pagination-admin-rutinas

## Technical Approach

Implementación de paginación frontend via TanStack Table en admin/rutinas. Se agrega `getPaginationRowModel` al `AdminTable` genérico y se configura `initialState.pagination.pageSize = 15` desde `RutinasListClient`. El checkbox header existente (`getIsAllPageRowsSelected`/`toggleAllPageRowsSelected`) opera correctamente sobre la página actual sin cambios.

## Architecture Decisions

### Decision: Usar `getPaginationRowModel()` en lugar de paginación custom

**Choice**: `getPaginationRowModel()` de TanStack Table  
**Alternatives considered**: Estado custom en React, URL params para página, pagination hook custom  
**Rationale**: 
- TanStack Table maneja TODO el estado de paginación internamente: `pageIndex`, `pageSize`, `pageCount`
- No requiere estado adicional en React — se accede via `table.getState().pagination`
- `getPaginationRowModel` automaticamente filtra `data` por página antes de pasar a `getRowModel`
- El `table.getRowModel().rows` ya contiene solo las filas de la página actual — el resto del código (render, rowSelection) funciona sin cambios
- Mantiene consistencia con el patrón existente de la tabla (usa `getCoreRowModel` del mismo modo)

### Decision: `initialState.pagination.pageSize = 15` en el cliente

**Choice**: Definir `pageSize` en `initialState` dentro de `RutinasListClient`  
**Alternatives considered**: Prop en `AdminTable`, constante global, config externa  
**Rationale**:
- Cada tabla de admin puede tener diferentes necesidades de paginación (rutinas ≠ usuarios por ejemplo)
- Mantiene `AdminTable` genérico sin asumir pageSize específico
- `initialState` es el mecanismo idiomatico de TanStack Table para valores default
- Si en el futuro se necesita persistencia de página en URL, el estado de paginación ya existe y es accesible

### Decision: El checkbox header NO necesita cambios

**Choice**: Mantener `table.getIsAllPageRowsSelected()` y `table.toggleAllPageRowsSelected()`  
**Alternatives considered**: `getIsAllRowsSelected()` que opera sobre todo el dataset filtrado  
**Rationale**:
- `getIsAllPageRowsSelected()` retorna `true` si TODAS las filas de la **página actual** están seleccionadas
- `toggleAllPageRowsSelected()` togglea todas las filas de la **página actual**
- Esto es el comportamiento ESPERADO por el usuario: checkbox del header selecciona las filas visibles en esa página
- Si el usuario quiere seleccionar todas las filas de todas las páginas para un "select all" global, necesitaríamos UI adicional (y la pregunta de qué hacer con filtros activos)
- **Importante**: `filteredRutinas` se pasa a la tabla, no `rutinas`. La paginación opera sobre `filteredRutinas`, entonces el checkbox opera sobre las filas filtradas y paginadas — exactamente lo que el usuario espera

## Data Flow

```
RutinasListClient
├── rutinas (props) ─────────────────────┐
│                                        │
├── filteredRutinas (useState filtering) ──→ AdminTable.data
│   └── searchTerm (useState)            │       │
│                                         │       ▼
│                                         │  useReactTable
│                                         │       │
└─────────────────────────────────────────┤       │
                                          │       ├── getCoreRowModel()
                                          │       ├── getPaginationRowModel() ← NUEVO
                                          │       ├── getRowId: row.id
                                          │       │
                                          │       ▼
                                          │  table.getRowModel().rows ← solo página actual
                                          │       │
                                          │       ▼
                                          │  Render rows + pagination controls
                                          │
└──────────────────────────────────────────┴──→ AdminTable
```

**Key point**: `filteredRutinas` (no `rutinas`) se pasa a `AdminTable`. La paginación opera sobre `filteredRutinas`, entonces búsqueda + paginación funcionan correctamente juntas.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/admin-table.tsx` | Modify | Agregar `getPaginationRowModel` import y config |
| `src/components/admin/rutinas-list-client.tsx` | Modify | Agregar `initialState.pagination`, pagination controls |

### admin-table.tsx

```diff
import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from '@tanstack/react-table';
+ import { getPaginationRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
+ getPaginationRowModel: getPaginationRowModel(),
  enableRowSelection,
  getRowId: (row) => row.id,
```

**Note**: `AdminTable` queda genérico. La prop `initialState.pagination` viene del cliente que lo usa.

### rutinas-list-client.tsx

```diff
  const table = useReactTable({
    data: filteredRutinas,
    columns,
+   initialState: {
+     pagination: {
+       pageSize: 15,
+     },
+   },
  });

// En el checkbox header, el código existente YA usa getIsAllPageRowsSelected()
// que opera sobre la página actual — no necesita cambios.

/* Agregar después de AdminTable: */
+ {/* Pagination Controls */}
+ <div className="flex items-center justify-between px-4 py-3 border-t border-border">
+   <p className="text-sm text-muted-foreground">
+     Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
+   </p>
+   <div className="flex gap-2">
+     <Button
+       variant="outline"
+       size="sm"
+       onClick={() => table.previousPage()}
+       disabled={!table.getCanPreviousPage()}
+     >
+       Anterior
+     </Button>
+     <Button
+       variant="outline"
+       size="sm"
+       onClick={() => table.nextPage()}
+       disabled={!table.getCanNextPage()}
+     >
+       Siguiente
+     </Button>
+   </div>
+ </div>
```

**Sobre el checkbox header**: El código existente (líneas 41-43) usa `table.getIsAllPageRowsSelected()` y `table.toggleAllPageRowsSelected()`. Estos métodos de TanStack Table operan sobre la página actual cuando hay pagination state. NO necesitan cambios.

## Data Model

No hay cambios en el modelo de datos. La paginación es puramente de frontend.

**Estado de paginación** (accesible via `table.getState().pagination`):
```typescript
{
  pageIndex: number;      // 0-based
  pageSize: number;       // 15
}
```

**Row selection**: Se preserva via `getRowId: row.id` (ya existe). Cuando el usuario cambia de página, las filas seleccionadas se mantienen porque el ID es estable.

## Edge Cases

### 0 resultados
- `table.getPageCount()` retorna `0`
- `table.getState().pagination.pageIndex` es `0`
- UI: "Página 1 de 1" con ambos botones deshabilitados (no hay previousPage ni nextPage disponibles)

### 1 página
- `table.getCanPreviousPage()` → `false` (pageIndex = 0, no hay anterior)
- `table.getCanNextPage()` → `false` (pageIndex = 0, pageCount = 1)
- Ambos botones deshabilitados

### Búsqueda activa + paginación
- `filteredRutinas` se recalcula en cada render cuando `searchTerm` cambia
- El filtro se aplica ANTES de la paginación (correcto)
- Si el usuario está en página 3 y busca algo que solo tiene 1 página, `pageIndex` se resetea a 0 automáticamente por TanStack Table
- **Check**: ¿TanStack Table resetea pageIndex cuando los datos cambian? SÍ, cuando el `data` array reference cambia, el pagination state se mantiene pero `pageCount` se recalcula. El usuario podría quedar en pageIndex=3 con pageCount=1. Para manejar esto, usar `autoResetPageIndex: true` (default behavior) o resetear manualmente si es necesario.

### selectedIds + paginación
- `selectedIds` se deriva de `Object.keys(rowSelection)` — se mantiene sincronizado con el estado de selección
- Si el usuario selecciona filas en página 1, va a página 2, selecciona más, y vuelve a página 1, la selección se preserva (rowSelection es `{[rowId]: true}`)
- El batch delete opera sobre `selectedIds` (todas las filas seleccionadas en todas las páginas)

## Dependencies

Ninguna nueva. TanStack Table ya está instalado.

## Open Questions

Ninguna. El diseño es straightforward.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Component | Pagination controls visibility and behavior | Render with >15 items, verify page 1 shows items 1-15, next page shows 16-30 |
| Component | Previous/Next buttons disabled at boundaries | Render with 5 items (1 page) — both disabled; with 20 items — verify prev disabled on page 1, next disabled on page 2 |
| Component | Page indicator shows correct info | "Página X de Y" matches actual state |
| Integration | Search + pagination interaction | Search that returns >1 page, verify pagination resets to page 1 |
| Integration | Row selection persists across pages | Select item on page 1, go to page 2, return to page 1, verify selection preserved |
| Integration | Batch delete with multi-page selection | Select items across pages, batch delete, verify all selected items deleted |
