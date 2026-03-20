# Proposal: Toast Notifications para Mutations

## Intent

Eliminar todos los `alert()` del codebase y estandarizar el feedback de usuario para mutaciones (créate, update, delete) mediante toasts de éxito/error usando Sonner. Actualmente, las 16 server actions no retornan feedback consistente y los componentes que las invocan no muestran confirmación visual al usuario.

**Problema central:** El usuario realiza una acción (crear rutina, eliminar ejercicio) y no recibe confirmación de que la operación succeedió o falló. En `rutinas-list-client.tsx` se usa `alert()` como fallback, lo cual es una anti-patrón en React.

## Scope

### In Scope
- Modificar las 16 server actions para retornar `FormState<T>` consistente con `{ success: boolean, message: string, data?: T }`
- Reemplazar `alert()` en `rutinas-list-client.tsx` con `toast()`
- Agregar toasts de éxito/error en todos los componentes que disparan mutations
- Unificar `gym.ts` (`updateGymPrice`) con el patrón `FormState<T>`

### Out of Scope
- Implementar `toast.promise()` con loading state (futura iteración)
- Agregar notifications push push/browser nativas
- Modificar el layout principal (Toaster ya existe en `layout.tsx`)

## Approach

**Paso 1: Estandarizar retorno de Server Actions**

Crear schema Zod unificado para `FormState<T>`:

```typescript
// types/form-state.ts
export function createFormState<T>(data?: T, message?: string): FormState<T> {
  return { success: true, message, data }
}

export function createFormError(message: string, code?: string): FormState<null> {
  return { success: false, message, errors: {} }
}
```

**Paso 2: Modificar server actions (16 funciones)**

Para cada archivo en `actions/`:
- `rutinas.ts`: createRutina, updateRutina, duplicateRutina, deleteRutina, createRutinaCompleta
- `dias.ts`: createDia, updateDia, deleteDia, reorderDias
- `ejercicios.ts`: createEjercicio, updateEjercicio, deleteEjercicio
- `feriados.ts`: createFeriado, deleteFeriado
- `gym.ts`: updateGymPrice (unificar con FormState)
- `reorder.ts`: reorderEjercicios

**Paso 3: Agregar toasts en componentes**

Patrón en componentes con `useForm` + server action:

```typescript
// Opción A: useEffect + useActionState (React 19)
useEffect(() => {
  if (state?.message) {
    if (state.success) toast.success(state.message)
    else toast.error(state.message)
  }
}, [state])

// Opción B: onSubmit con toast inline
const onSubmit = async (data) => {
  const result = await action(data)
  if (result.success) toast.success(result.message)
  else toast.error(result.message)
}
```

**Paso 4: Eliminar alert()**

En `rutinas-list-client.tsx`, reemplazar:
- Línea 46: `alert('Rutina creada')` → `toast.success('Rutina creada')`
- Línea 50: `alert('Rutina eliminada')` → `toast.success('Rutina eliminada')`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `actions/rutinas.ts` | Modified | 5 funciones con retorno FormState |
| `actions/dias.ts` | Modified | 4 funciones con retorno FormState |
| `actions/ejercicios.ts` | Modified | 3 funciones con retorno FormState |
| `actions/feriados.ts` | Modified | 2 funciones con retorno FormState |
| `actions/gym.ts` | Modified | 1 función unificada con FormState |
| `actions/reorder.ts` | Modified | 1 función con retorno FormState |
| `rutinas-list-client.tsx` | Modified | Eliminar alert(), usar toast |
| `rutina-completa-form.tsx` | Modified | Agregar toast post-create |
| `dia-manager.tsx` | Modified | Agregar toast en 3 mutations |
| `ejercicio-list.tsx` | Modified | Agregar toast en 3 mutations |
| `FeriadoForm` | Modified | Agregar toast en create/delete |
| `GymConfigForm` | Modified | Agregar toast post-update |
| `types/form-state.ts` | New | Schema unificado para retorno |

## Open Questions

| Question | Recommendation | Decision |
|----------|---------------|----------|
| ¿Usar `toast.promise()` con loading state? | No por ahora | Postergar para iteración 2 |
| ¿Unificar `gym.ts` con FormState? | Sí, mantener consistencia | Unificar |
| ¿Manejar toasts en componente o wrapper? | En componente (useActionState) | Componente |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking changes en consumo de server actions | Low | Solo cambiar estructura, no lógica de negocio |
| Toast spam si múltiples mutations rapidas | Low | Debounce o coalescing en componentes |
| Inconsistencia temporal durante migración | Medium | Modificar actions y componentes en mismo PR |

## Rollback Plan

1. **Revertir server actions:** Restore timestamps de los 6 archivos en `actions/`
2. **Revertir componentes:** Restore timestamps de los 6 componentes en `components/`
3. **Eliminar `types/form-state.ts` si fue creado**
4. No se requiere migración de DB

## Dependencies

- `sonner@2.0.7` (ya instalado)
- `toast` de `sonner` disponible globalmente via `components/ui/toaster.tsx`

## Success Criteria

- [ ] `grep -r "alert(" src/` retorna 0 resultados
- [ ] Las 16 server actions retornan `{ success: boolean, message: string, data?: T }`
- [ ] Los 6 componentes de mutation muestran toast en éxito y error
- [ ] No hay regressions en funcionalidad existente (testeo manual de CRUD rutinas, días, ejercicios)
- [ ] Toaster permanece en `layout.tsx` sin cambios
