# Tasks: Simplified Routine Creation Flow

## Phase 1: Schema Definitions

- [ ] 1.1 Add `ejercicioSchema` to `lib/schemas.ts` with fields: nombre (required), series (optional), repes (optional)
- [ ] 1.2 Add `diaSchema` to `lib/schemas.ts` with fields: nombre (required), musculosEnfocados (optional), ejercicios (array of ejercicioSchema, min 1)
- [ ] 1.3 Add `rutinaCompletaSchema` to `lib/schemas.ts` with fields: nombre (required), tipo (enum), descripcion (optional), dias (array of diaSchema, min 1)
- [ ] 1.4 Export `RutinaCompletaInput` type inferred from `rutinaCompletaSchema`

## Phase 2: Server Action

- [ ] 2.1 Add helper function `parseNestedFormData` in `app/actions/rutinas.ts` to convert indexed FormData (`dias[0].nombre`) to nested object structure
- [ ] 2.2 Add `createRutinaCompleta` server action function with:
  - Admin access verification (reuse existing `verifyAdmin` helper)
  - Parse nested FormData
  - Validate with `rutinaCompletaSchema`
  - Execute `prisma.$transaction` with: create rutina → create dias → create ejercicios
  - Assign sequential `orden` values to days and exercises
  - Revalidate paths on success
  - Return `{ success: true, data: { id } }` on success

## Phase 3: Reusable UI Components

- [ ] 3.1 Create `components/admin/ejercicio-row.tsx` with:
  - Props: index (number), onRemove callback, defaultValues (optional)
  - Input fields for nombre, series, repes with proper name attributes (`dias[${diaIndex}].ejercicios[${index}].*`)
  - Remove button with callback to parent
  - Error display for nested validation errors

- [ ] 3.2 Create `components/admin/dia-section.tsx` with:
  - Props: index (number), onRemove callback, onAddExercise callback, ejercicios array, errors (optional)
  - Input fields for nombre, musculosEnfocados
  - Renders list of EjercicioRow components
  - "Agregar Ejercicio" button that calls onAddExercise
  - Remove button for the entire day

## Phase 4: Main Form Component

- [ ] 4.1 Create `components/admin/rutina-completa-form.tsx` with:
  - Client-side state using `useState` for days and ejercicios arrays
  - useActionState hook binding to `createRutinaCompleta` server action
  - Dynamic add/remove handlers for days and exercises
  - Form fields for routine: nombre, tipo (select dropdown), descripcion
  - Renders list of DiaSection components
  - "Agregar Día" button
  - Cancel button linking to `/admin/rutinas`
  - Submit button with loading state
  - Inline validation error display
  - Success handler that redirects to `/admin/rutinas/[id]`

## Phase 5: Page Wrapper

- [ ] 5.1 Create `app/admin/rutinas/nueva/completa/page.tsx` with:
  - AuthGuard wrapper
  - Header with back link to `/admin/rutinas`
  - Title "Nueva Rutina Completa"
  - RutinaCompletaForm component
  - Layout matching existing admin pages

## Phase 6: Testing

- [ ] 6.1 Test: Navigate to `/admin/rutinas/nueva/completa` - page loads with form
- [ ] 6.2 Test: Submit without routine name - validation error shows "Nombre es requerido"
- [ ] 6.3 Test: Click "+ Agregar Día" - new day section appears
- [ ] 6.4 Test: Click delete on day - day is removed
- [ ] 6.5 Test: Click "+ Agregar Ejercicio" in a day - new exercise row appears
- [ ] 6.6 Test: Submit with valid data - redirect to routine detail page
- [ ] 6.7 Test: Verify database has rutina, dias, and ejercicios created correctly
- [ ] 6.8 Test: Verify orden fields are assigned sequentially (0, 1, 2...)

## Implementation Order

1. **Phase 1 first** - Schemas are the foundation that both server action and client components depend on
2. **Phase 2 second** - Server action is independent of UI, testable in isolation
3. **Phase 3 third** - Reusable components don't depend on the main form
4. **Phase 4 fourth** - Main form composes components from Phase 3
5. **Phase 5 last** - Page wrapper is just glue code
6. **Phase 6 throughout** - Test as you build

## Notes

- The FormData parsing logic is the trickiest part - test edge cases like sparse arrays and optional fields
- Follow the existing pattern in `RutinaForm` for form submission and error handling
- Use existing UI components (Button, Input, Textarea) from `@/components/ui`
- Maintain consistency with existing admin page styling (zinc-900 background, white text, etc.)
