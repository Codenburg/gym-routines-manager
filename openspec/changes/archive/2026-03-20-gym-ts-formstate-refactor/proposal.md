# Proposal: Refactorizar `updateGymPrice` a FormState<T>

## Intent

Unificar `updateGymPrice` en `src/app/actions/gym.ts` al patrón `FormState<T>` estandarizado del proyecto. Actualmente retorna un tipo ad-hoc `{ success: boolean; message: string; data?: { price: number } }` en lugar del `FormState<T>` definido en `src/lib/schemas.ts:138`. Esto impide usar `useActionState` (React 19) en el componente consumidor y genera inconsistencia con las demás server actions.

**Problema central:** El componente `GymPriceEditor` consume `updateGymPrice` con try/catch manual en lugar de beneficiarse del error handling tipado de `useActionState`.

## Scope

### In Scope
- Modificar signature de `updateGymPrice` a `(prevState: FormState, formData: FormData) => Promise<FormState<{ price: number }>>`
- Agregar validación Zod para `price` (número positivo, max 2 decimales)
- Migrar `GymPriceEditor` a `useActionState`
- Mantener compatibilidad de acceso: `result.success`, `result.message`, `result.data.price`

### Out of Scope
- Agregar `zodSchema` para price (no existe aún; crear en `schemas.ts` si se reutiliza en otro lugar)
- Modificar otras server actions de `gym.ts`
- Agregar tests (no hay infraestructura configurada)

## Approach

**Paso 1: Modificar `updateGymPrice` en `gym.ts`**

Nueva signature:
```typescript
export async function updateGymPrice(
  prevState: FormState<{ price: number }>,
  formData: FormData
): Promise<FormState<{ price: number }>>
```

Validación Zod inline (reutilizable si surge otro uso):
```typescript
const priceSchema = z.object({
  price: z.number()
    .positive({ message: "El precio debe ser positivo" })
    .refine(v => Number(v.toFixed(2)) === v, { message: "Máximo 2 decimales" })
});

const parsed = priceSchema.safeParse({ price: Number(formData.get("price")) });
if (!parsed.success) {
  return { success: false, errors: parsed.error.flatten().fieldErrors, message: "Error de validación" };
}
```

Retorno exitoso:
```typescript
return { success: true, data: { price: Number(gym.price) }, message: "Precio actualizado" };
```

**Paso 2: Migrar `GymPriceEditor` a `useActionState`**

```typescript
"use client";

import { useActionState } from "react";
import { updateGymPrice } from "@/app/actions/gym";

export function GymPriceEditor({ initialPrice }: GymPriceEditorProps) {
  const [state, formAction, isPending] = useActionState(updateGymPrice, {
    success: initialPrice !== null,
    data: initialPrice !== null ? { price: initialPrice } : undefined,
  });
  
  // Use state.errors.price, state.message, state.data.price
  // isPending replaces manual "saving" state management
}
```

**Paso 3: Adaptar formData del input**

El input number genera `formData.get("price")` como string, convertir a número:
```typescript
const priceValue = Number(formData.get("price"));
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/actions/gym.ts` | Modified | `updateGymPrice` con nueva signature y validación Zod |
| `src/components/admin/GymPriceEditor.tsx` | Modified | Migra a `useActionState`, elimina try/catch manual |
| `src/lib/schemas.ts` | No change | `FormState<T>` ya existe |

## Open Questions

| Question | Recommendation | Decision |
|----------|---------------|----------|
| ¿Mantener overload para backward compatibility? | No | Eliminar signature vieja, es uso interno |
| ¿Crear schema `gymPriceSchema` en schemas.ts? | No por ahora | Validación inline es suficiente para un solo uso |
| ¿Agregar validación min/max de precio? | Sí | Min 1000 ARS (gimnasio barrial), max 500000 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Componente deja de funcionar si no se adapta correctamente | Low | Seguir el patrón exacto de `createRutina` en rutinas.ts |
| Error de tipos si `useActionState` no tipa correctamente | Low | Verificar State genérico en compilación |

## Rollback Plan

1. **Revertir `gym.ts`:** Restaurar timestamp del archivo
2. **Revertir `GymPriceEditor.tsx`:** Restaurar timestamp del archivo
3. No se requiere migración de DB (solo cambio de types)

## Dependencies

- `react@19` (ya en uso) — `useActionState` disponible
- `zod` (ya en uso) — `z.number()` disponible

## Success Criteria

- [ ] `updateGymPrice` signature es `(prevState: FormState<{ price: number }>, formData: FormData)`
- [ ] `updateGymPrice` retorna `FormState<{ price: number }>`
- [ ] `GymPriceEditor` usa `useActionState` en lugar de try/catch manual
- [ ] Validación Zod rechaza precios ≤ 0 y con más de 2 decimales
- [ ] Compilación TypeScript sin errores
- [ ] ESLint sin warnings en archivos modificados
