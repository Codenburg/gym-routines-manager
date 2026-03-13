# Design: Simplified Routine Creation Flow

## Technical Approach

The solution implements a single-page form that creates a complete routine (rutina + dias + ejercicios) in one atomic transaction. Following the existing patterns in the codebase, we use:

1. **Server Actions** with `useActionState` for form submission
2. **Zod schemas** for client and server validation
3. **Prisma `$transaction`** for atomic database writes
4. **Client-side state** for dynamic field management (add/remove days and exercises)

This mirrors the existing `RutinaForm` pattern but extends it with nested arrays and dynamic UI.

---

## Architecture Decisions

### Decision: Form Data Structure for Nested Arrays

**Choice**: Use indexed field naming convention (`dias[0].nombre`, `dias[0].ejercicios[0].nombre`) and parse with manual object reconstruction in the server action.

**Alternatives considered**: 
- JSON string in hidden field
- Multiple separate form submissions

**Rationale**: This approach works with standard `FormData` and the existing server action pattern. The existing `RutinaForm` already uses this approach. JSON string would bypass native form validation, and separate submissions would break atomicity.

### Decision: Client-Side Dynamic State Management

**Choice**: Use React `useState` with typed arrays for days and exercises, rendering dynamic input fields.

**Alternatives considered**:
- Collapsible day components with internal state
- Single massive form with no state (just DOM manipulation)

**Rationale**: Keeping all state at the parent level simplifies submission — we just serialize the state to FormData. Collapsible components with internal state would require lifting state up anyway. The spec explicitly requires dynamic add/remove, so some client state is unavoidable.

### Decision: Server Action Returns `{ id: string }` on Success

**Choice**: On successful creation, return `{ id: string }` in `FormState<{ id: string }>` and redirect client-side to the routine detail page.

**Alternatives considered**:
- Redirect directly from server action using `redirect()`
- Return full routine object

**Rationale**: The existing pattern in `RutinaForm` uses `useEffect` to call `router.push()` after success. This keeps the form mounted during submission so error states can be displayed if needed. The redirect happens after React confirms success.

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  RutinaCompletaForm (Client Component)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ useState<DiasState[]>                                     │   │
│  │  - dias: Array<{ nombre, musculosEnfocados, ejercicios } │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ action(formData) → createRutinaCompleta                  │   │
│  │  - Extract indexed fields from FormData                  │   │
│  │  - Validate with rutinaCompletaSchema                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ prisma.$transaction (atomic)                              │   │
│  │  1. prisma.rutina.create({...})                          │   │
│  │  2. prisma.dia.createMany({data: [...]})                 │   │
│  │  3. prisma.ejercicio.createMany({data: [...]})           │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Form Field Naming Convention

For the nested structure, fields use bracket notation with indices:

```
dias[0].nombre
dias[0].musculosEnfocados
dias[0].ejercicios[0].nombre
dias[0].ejercicios[0].series
dias[0].ejercicios[0].repes
dias[1].nombre
...
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/schemas.ts` | Modify | Add `rutinaCompletaSchema`, `ejercicioSchema`, `diaSchema` with nested validation |
| `app/actions/rutinas.ts` | Modify | Add `createRutinaCompleta` server action with `prisma.$transaction` |
| `components/admin/rutina-completa-form.tsx` | Create | Main form component with dynamic days/exercises |
| `app/admin/rutinas/nueva/completa/page.tsx` | Create | Page wrapper with AuthGuard and layout |
| `components/admin/ejercicio-row.tsx` | Create | Reusable row component for exercise inputs |
| `components/admin/dia-section.tsx` | Create | Reusable section component for day with exercises |

---

## Interfaces / Contracts

### Zod Schemas (lib/schemas.ts)

```typescript
// Nested schemas for complete routine creation
export const ejercicioSchema = z.object({
  nombre: z.string().min(1, "Nombre del ejercicio es requerido"),
  series: z.string().optional(),
  repes: z.string().optional(),
});

export const diaSchema = z.object({
  nombre: z.string().min(1, "Nombre del día es requerido"),
  musculosEnfocados: z.string().optional(),
  ejercicios: z.array(ejercicioSchema).min(1, "Al menos un ejercicio por día"),
});

export const rutinaCompletaSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  tipo: z.enum(["fuerza", "cardio", "flexibilidad", "hipertrofia"]),
  descripcion: z.string().optional(),
  dias: z.array(diaSchema).min(1, "Al menos un día es requerido"),
});

export type RutinaCompletaInput = z.infer<typeof rutinaCompletaSchema>;
```

### Server Action Signature (app/actions/rutinas.ts)

```typescript
export async function createRutinaCompleta(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // 1. Verify admin access
  // 2. Parse indexed FormData to nested object
  // 3. Validate with rutinaCompletaSchema
  // 4. Execute prisma.$transaction:
  //    - Create rutina
  //    - Create dias with orden
  //    - Create ejercicios with orden
  // 5. Revalidate paths
  // 6. Return { success: true, data: { id } }
}
```

### Form State Interface

```typescript
interface RutinaCompletaFormState extends FormState<{ id: string }> {
  errors?: {
    nombre?: string[];
    tipo?: string[];
    descripcion?: string[];
    dias?: {
      nombre?: string[];
      musculosEnfocados?: string[];
      ejercicios?: {
        nombre?: string[];
        series?: string[];
        repes?: string[];
      }[];
    }[];
  };
}
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Zod schema validation | Test valid/invalid inputs directly with schema |
| Unit | Server action logic | Mock Prisma, test transaction execution |
| Integration | Form submission flow | Test with Playwright: fill form → submit → verify redirect |
| E2E | Full user journey | Navigate to page → fill all fields → submit → verify routine in list |

### Key Test Cases

1. **AC1**: Page accessible at `/admin/rutinas/nueva/completa`
2. **AC7**: Validation error shows when submitting without routine name
3. **AC9**: Successful submission redirects to routine detail page
4. **AC11**: Transaction rolls back on database failure

---

## Migration / Rollout

No migration required. This is a net-new feature that creates new records.

**Feature Flag Consideration**: None needed — this is an additive feature with no breaking changes.

**Rollout Sequence**:
1. Deploy backend (new schema + server action)
2. Deploy frontend (new page + components)
3. Feature is immediately available at new URL

---

## Open Questions

- [ ] **Dynamic field ordering**: Should users be able to reorder days/exercises via drag-and-drop? (Not in current spec — can be added later)
- [ ] **Exercise autocomplete**: Should we suggest exercises from existing database? (Out of scope for v1)
- [ ] **Mobile layout**: The spec shows desktop layout — need to verify mobile responsiveness (future enhancement)

---

## Implementation Notes

### Day/Exercise Order Handling

The Prisma schema has `orden: Int @default(0)` on both `Dia` and `Ejercicio`. The server action should automatically assign sequential order values:

```typescript
const diasData = parsed.data.dias.map((dia, diaIndex) => ({
  rutinaId: rutina.id,
  nombre: dia.nombre,
  musculosEnfocados: dia.musculosEnfocados,
  orden: diaIndex,
  ejercicios: dia.ejercicios.map((ejercicio, ejercicioIndex) => ({
    nombre: ejercicio.nombre,
    series: ejercicio.series,
    repes: ejercicio.repes,
    orden: ejercicioIndex,
  })),
}));
```

### FormData Parsing Utility

A helper function will convert indexed FormData to nested object:

```typescript
function parseNestedFormData(formData: FormData): unknown {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of formData.entries()) {
    // Parse "dias[0].nombre" → { dias: [{ nombre: value }] }
    const match = key.match(/^([^\[]+)(.*)$/);
    if (!match) continue;
    
    const [_, root, rest] = match;
    // ... nested assignment logic
  }
  
  return result;
}
```

This is the trickiest part — a robust implementation handles:
- Missing indices (sparse arrays)
- Type coercion (string → appropriate type)
- Optional fields that aren't submitted

---

## Related Artifacts

- **Spec**: `openspec/changes/simplify-routine-creation/specs/ui/spec.md`
- **Proposal**: `openspec/proposals/simplify-routine-creation.md`
