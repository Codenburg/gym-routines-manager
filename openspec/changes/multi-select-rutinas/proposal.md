# Proposal: Multi-Select Rutinas

## Intent

Implementar selección múltiple en la tabla de rutinas del panel admin con eliminación masiva via server action unificada. El objetivo es permitir a los administradores seleccionar una o varias rutinas y eliminarlas en una sola operación, mejorando la eficiencia del flujo de trabajo.

**Problema**: Actualmente, eliminar múltiples rutinas requiere iterar individualmente, lo cual es lento y genera N queries a la base de datos.

## Scope

### In Scope
- Estado de selección `Set<string>` en `rutinas-list-client.tsx` con métodos `toggle`, `selectAll`, `deselectAll`, `isSelected`
- Columna de checkboxes en la tabla (header + row) usando shadcn checkbox
- Server action `deleteRutinas(prevState, formData)` que acepta array de IDs y ejecuta UN `deleteMany`
- Botón "Eliminar" condicional (visible solo si `selectedIds.size > 0`)
- Confirmación con `window.confirm()` nativo
- Toast promise feedback con `toast.promise()`
- Limpieza de selección post-eliminación exitosa

### Out of Scope
- Modificación del flujo de eliminación individual (la action `deleteRutina` existente no cambia)
- Selección por rango (shift+click)
- Persistencia de selección entre navegaciones
- Eliminación de otros entidades (días, ejercicios)

## Approach

### 1. Client State (rutinas-list-client.tsx)
Agregar `useState<Set<string>>` para `selectedIds` en el componente padre. Métodos auxiliares:
```typescript
const toggle = (id: string) => setSelectedIds(prev => {...prev, [id]: !prev.has(id)})
const selectAll = () => setSelectedIds(new Set(rutinas.map(r => r.id)))
const deselectAll = () => setSelectedIds(new Set())
const isSelected = (id: string) => selectedIds.has(id)
```

### 2. Checkbox Column
- **Header**: Checkbox que toggla `selectAll`/`deselectAll`. Estado checked = todos seleccionados.
- **Row**: Checkbox por cada rutina. Estado checked = `selectedIds.has(rutina.id)`.
- Instalar checkbox: `npx shadcn@latest add checkbox`

### 3. Server Action `deleteRutinas`
Ubicación: `src/app/actions/rutinas.ts`

```typescript
export async function deleteRutinas(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ deletedCount: number }>> {
  // 1. Verify admin
  // 2. Extract `ids` from formData as JSON string array
  // 3. Validate array not empty
  // 4. Execute: prisma.rutina.deleteMany({ where: { id: { in: ids } } })
  // 5. Revalidate paths
  // 6. Return { success: true, data: { deletedCount }, message: "X rutinas eliminadas" }
}
```

**Constraint CRÍTICO**: UNA SOLA query `deleteMany` - PROHIBIDO iterar con `delete` individual.

### 4. Delete UI Flow
1. Botón "Eliminar" visible solo si `selectedIds.size > 0`
2. Click → `window.confirm("¿Eliminar X rutinas seleccionadas?")`
3. Confirmar → `toast.promise(deleteRutinasAction, { loading, success, error })`
4. On success: `selectedIds.clear()`, `router.refresh()`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/actions/rutinas.ts` | Modified | Add `deleteRutinas` server action |
| `src/components/admin/rutinas-list-client.tsx` | Modified | Add selection state, checkboxes, bulk delete UI |
| `package.json` / `components.json` | Modified | Add shadcn checkbox component |
| `src/hooks/use-confirm.ts` | No change | Using `window.confirm()` explicitly (not this hook) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Selection state grows large causing re-render issues | Low | Set is small, routine IDs are strings |
| Race condition on fast toggle + delete | Low | Clear selection only on successful delete |
| Missing checkbox installation causing build failure | Medium | Explicitly note shadcn add command in tasks |
| Conflicting with existing `deleteRutina` individual action | None | New action is separate, old one unchanged |

## Rollback Plan

1. **Revert file changes**: `git checkout HEAD -- src/app/actions/rutinas.ts src/components/admin/rutinas-list-client.tsx`
2. **Remove checkbox**: `npx shadcn@latest remove checkbox`
3. **Clear selection state**: Remove `selectedIds` state and checkboxes from table

## Dependencies

- `sonner@2.0.7` (already installed - `toast.promise()` available)
- `shadcn checkbox` (needs installation)
- Prisma cascade delete (already configured - deleting rutina cascades to dias/ejercicios)
- `FormState<T>` pattern (already exists in `src/lib/schemas.ts`)

## Success Criteria

- [ ] User can select multiple rutinas via checkboxes
- [ ] "Select all" checkbox toggles all rows
- [ ] Bulk delete button appears only when `selectedIds.size > 0`
- [ ] `window.confirm()` is used for confirmation (not alert, not useConfirm hook)
- [ ] `toast.promise()` shows loading/success/error states
- [ ] `deleteRutinas` executes exactly ONE `deleteMany` query
- [ ] Selection clears after successful deletion
- [ ] Individual delete flow (`deleteRutina`) remains unchanged
- [ ] ESLint passes, TypeScript compiles, build succeeds
