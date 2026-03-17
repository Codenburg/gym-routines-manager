# Tasks: Búsqueda reactiva (search-as-you-type)

## Phase 1: Core Implementation

- [x] 1.1 Modificar `src/components/search/search-bar.tsx` - eliminar el `<form>` y el `onSubmit`
- [x] 1.2 Agregar estado para el valor con debounce usando `useEffect` con `setTimeout`
- [x] 1.3 Implementar cleanup del timeout en el useEffect para cancelar búsquedas pendientes
- [x] 1.4 Navegar automáticamente después de 300ms de inactividad usando `router.push`

## Phase 2: Testing

- [x] 2.1 Actualizar test "4.7 - updates URL on search" - ya no requiere `press('Enter')`
- [x] 2.2 Actualizar test "4.8 - search with special characters" - ya no requiere `press('Enter')`
- [x] 2.3 Actualizar test "4.9 - clears search when empty" - ya no requiere `press('Enter')`
- [x] 2.4 Agregar nuevo test: debounce evita múltiples búsquedas rápidas
- [x] 2.5 Verificar que todos los tests pasan con `npm test`

## Phase 3: Verification

- [x] 3.1 Ejecutar TypeScript type check: `npx tsc --noEmit`
- [x] 3.2 Ejecutar ESLint: `npx eslint .`
- [ ] 3.3 Verificar manualmente que la búsqueda funciona sin Enter en dev server
