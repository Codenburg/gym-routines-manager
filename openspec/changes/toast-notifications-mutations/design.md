# Design: Toast Notifications para Mutations

## Technical Approach

Estandarizar el feedback de usuario para todas las mutaciones (create/update/delete) usando `toast()` de Sonner. Cada server action retornará `FormState<T>` con `message` descriptivo, y el componente consumidor mostrará `toast.success(message)` o `toast.error(message)` según el resultado.

**Estrategia general:** Los toasts se implementan en los componentes CLIENTE que disparan las server actions, NO en las server actions mismas. Esto mantiene las actions puras y reutilizables.

## Architecture Decisions

### Decision: Dónde colocar los toasts

**Choice**: Toasts en componentes cliente (quienes llaman a las server actions)
**Alternatives considered**: 
- Toasts dentro de las server actions mismas — RECHAZADO porque mezcla infraestructura de presentación con lógica de negocio
- Wrapper hook `useMutation` con toast — RECHAZADO porque introduce abstracción innecesaria para el alcance actual
**Rationale**: Las server actions ya retornan `FormState<T>` con `success` y `message`. Los componentes pueden decidir cómo mostrar feedback (toast, inline, redirect, etc.). Mantiene separation of concerns.

### Decision: Patrón de uso de toasts con `useActionState`

**Choice**: `useEffect` que observa `state` y muestra toast cuando cambia
**Alternatives considered**:
- `onSubmit` inline con toast — RECHAZADO porque no captura errores de validación Zod que retornan `errors` en lugar de `message`
- `toast.promise()` con loading state — POSTERGADO (fuera de scope según proposal)
**Rationale**: `useEffect` captura todos los cambios de estado incluyendo validación de Zod, errores de DB, y éxito. Un solo lugar para todos los casos.

```typescript
// Patrón estándar para todos los componentes
useEffect(() => {
  if (!isPending && state.success) {
    toast.success(state.message || "Operación exitosa");
  } else if (!isPending && !state.success && state.message) {
    toast.error(state.message);
  }
}, [isPending, state.success, state.message]);
```

### Decision: Estandarizar mensajes de todas las server actions

**Choice**: Todas las 16 server actions retornarán `message` descriptivo en éxito
**Alternatives considered**: Mensajes genéricos ("Operación exitosa") — RECHAZADO porque no dan contexto al usuario
**Rationale**: Mensajes específicos como "Rutina 'Piernas' eliminada" son más útiles que "Registro eliminado". El overhead de pasar `message` es mínimo.

## Data Flow

```
User clicks "Guardar"
    │
    ▼
<form action={formAction}>  ──► Server Action
    │                              │
    │                              ▼
    │                        Valida con Zod
    │                              │
    │                              ▼
    │                        Ejecuta DB mutation
    │                              │
    │                              ▼
    │                        Retorna FormState<T>
    │                              │
    ▼                              ▼
useActionState ◄─────────────────┘
    │
    ▼
useEffect([state]) ──► toast.success(message) / toast.error(message)
    │
    ▼
UI actualiza (refresca lista, cierra modal, etc.)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/actions/rutinas.ts` | Modify | Agregar `message` exitoso a todas las funciones (5) |
| `src/app/actions/dias.ts` | Modify | Agregar `message` exitoso a todas las funciones (4) |
| `src/app/actions/ejercicios.ts` | Modify | Agregar `message` exitoso a todas las funciones (3) |
| `src/app/actions/feriados.ts` | Modify | Ya tiene toasts (no modificar) |
| `src/app/actions/gym.ts` | Modify | Ya refactorizado (no modificar más) |
| `src/app/actions/reorder.ts` | Modify | Agregar `message` exitoso |
| `src/components/admin/dia-manager.tsx` | Modify | Agregar useEffect + toast para 3 mutations |
| `src/components/admin/ejercicio-list.tsx` | Modify | Agregar useEffect + toast para delete |
| `src/components/admin/ejercicio-form.tsx` | Modify | Agregar useEffect + toast para create/update |
| `src/components/admin/rutina-form.tsx` | Modify | Agregar useEffect + toast para create/update |
| `src/components/admin/rutina-completa-form.tsx` | Modify | Agregar useEffect + toast para create |
| `src/components/admin/delete-rutina-page-button.tsx` | Modify | Agregar useEffect + toast para delete |
| `src/components/admin/rutinas-list-client.tsx` | Modify | Reemplazar `alert()` con toast |
| `src/components/admin/delete-rutina-button.tsx` | No change | Ya tiene toasts |
| `src/components/admin/FeriadoManager.tsx` | No change | Ya tiene toasts |
| `src/components/admin/GymPriceEditor.tsx` | No change | Ya tiene toast |

## Componentes - Detalle de Cambios

### 1. `dia-manager.tsx` (3 mutations)

```typescript
// Estructura actual: createDia, updateDia, deleteDia sin toast
// Agregar useActionState y useEffect:

const [state, formAction, isPending] = useActionState(
  createDia,  // o updateDia, deleteDia según el form
  initialState
);

useEffect(() => {
  if (!isPending) {
    if (state.success) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }
}, [isPending, state.success, state.message]);
```

### 2. `ejercicio-list.tsx` (1 mutation: delete)

```typescript
// Actualmente: delete sin feedback
// Agregar useActionState para deleteEjercicio
// Mostrar toast en success/error
```

### 3. `rutina-form.tsx` (2 mutations: create, update)

```typescript
// Actualmente: usa onSuccess callback, sin toast
// Migrar a useActionState
// El callback onSuccess puede остаться para navigation
// Pero AGREGAR toast para feedback visual
```

### 4. `rutina-completa-form.tsx` (1 mutation: create)

```typescript
// Actualmente: redirect a /admin/rutinas/{id} sin toast
// Agregar toast.success antes del redirect
```

### 5. `delete-rutina-page-button.tsx` (1 mutation: delete)

```typescript
// Actualmente: silently redirects
// Agregar useActionState + toast
```

### 6. `rutinas-list-client.tsx` - Duplicate button

```typescript
// Currently: has toast.error but MISSING toast.success
// Fix: agregar toast.success(result.message) en rama success
```

### 7. `rutinas-list-client.tsx` - Eliminar alert()

```typescript
//Buscar: alert('Rutina creada') → toast.success('Rutina creada')
//Buscar: alert('Rutina eliminada') → toast.success('Rutina eliminada')
```

## Server Actions - Mensajes a Agregar

### `rutinas.ts`
| Función | Message actual | Message nuevo |
|---------|---------------|--------------|
| `createRutina` | (ninguno) | "Rutina '{nombre}' creada exitosamente" |
| `updateRutina` | (ninguno) | "Rutina '{nombre}' actualizada" |
| `duplicateRutina` | (ninguno) | "Rutina duplicada exitosamente" |
| `deleteRutina` | (ninguno) | "Rutina eliminada" |
| `createRutinaCompleta` | (ninguno) | "Rutina '{nombre}' creada con {n} días" |

### `dias.ts`
| Función | Message actual | Message nuevo |
|---------|---------------|--------------|
| `createDia` | (ninguno) | "Día agregado a la rutina" |
| `updateDia` | (ninguno) | "Día actualizado" |
| `deleteDia` | (ninguno) | "Día eliminado" |
| `reorderDias` | (ninguno) | "Orden de días actualizado" |

### `ejercicios.ts`
| Función | Message actual | Message nuevo |
|---------|---------------|--------------|
| `createEjercicio` | (ninguno) | "Ejercicio agregado" |
| `updateEjercicio` | (ninguno) | "Ejercicio actualizado" |
| `deleteEjercicio` | (ninguno) | "Ejercicio eliminado" |

### `reorder.ts`
| Función | Message actual | Message nuevo |
|---------|---------------|--------------|
| `reorderEjercicios` | (ninguno) | "Orden de ejercicios actualizado" |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Crear rutina nueva | Ver toast "Rutina 'X' creada exitosamente" |
| Manual | Editar rutina | Ver toast "Rutina 'X' actualizada" |
| Manual | Eliminar rutina | Ver toast "Rutina eliminada" |
| Manual | Duplicar rutina | Ver toast "Rutina duplicada exitosamente" |
| Manual | Crear día | Ver toast "Día agregado a la rutina" |
| Manual | Eliminar ejercicio | Ver toast "Ejercicio eliminado" |
| Manual | Error de validación | Ver toast.error con mensaje |
| Grep | `alert()` | `grep -r "alert(" src/` debe retornar 0 |

## Migration / Rollout

No se requiere migración de DB.

**Rollback:** Si algo falla, revertir los 7 archivos de componentes y 4 de server actions es suficiente.

## Open Questions

Ninguna — todas las decisiones fueron tomadas en el proposal.

## Implementation Order

1. **Fase 1:** Server actions — agregar mensajes a `rutinas.ts`, `dias.ts`, `ejercicios.ts`, `reorder.ts`
2. **Fase 2:** Componentes simples (delete buttons, lists) — `ejercicio-list.tsx`, `delete-rutina-page-button.tsx`, `rutinas-list-client.tsx`
3. **Fase 3:** Forms complejos — `rutina-form.tsx`, `rutina-completa-form.tsx`, `dia-manager.tsx`, `ejercicio-form.tsx`
4. **Fase 4:** Verificar que `alert()` fue eliminado
