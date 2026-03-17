# Proposal: Búsqueda reactiva (search-as-you-type)

## Intent

El usuario quiere que la búsqueda de rutinas en la homepage funcione de forma reactiva, sin necesidad de presionar Enter. Actualmente, el SearchBar requiere que el usuario escriba y presione Enter para ejecutar la búsqueda. Este cambio implementará "search-as-you-type" con debounce para mejor UX y rendimiento.

## Scope

### In Scope
- Modificar el componente `SearchBar` para buscar automáticamente mientras el usuario escribe
- Implementar debounce para evitar múltiples llamadas a la API mientras escribe
- Actualizar los tests E2E existentes para cubrir el nuevo comportamiento

### Out of Scope
- Cambiar el comportamiento de búsqueda en otras páginas (admin, etc.)
- Implementar búsqueda con delay visual personalizado (solo debounce técnico)
- Modificar la API de búsqueda (`/api/rutinas`)

## Approach

Se implementará un hook personalizado con debounce que:
1. Capture el valor del input en cada cambio
2. Espere 300ms después del último carácter typed antes de navegar
3. Navegue a la URL con el parámetro de búsqueda automáticamente

Se usará el hook `useDeferredValue` de React 19 o un debounce simple con `useEffect`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/search/search-bar.tsx` | Modified | Agregar debounce y búsqueda automática |
| `tests/homepage.spec.ts` | Modified | Actualizar tests para validar search-as-you-type |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Demasiadas llamadas a la API mientras escribe | Medium | Implementar debounce de 300ms |
| UX confusa si no hay feedback visual | Low | El debounce es suficiente, la UI ya es reactiva |
| Tests existentes fallan por cambio de comportamiento | Medium | Actualizar tests antes de implementar |

## Rollback Plan

1. Revertir cambios en `src/components/search/search-bar.tsx` al código anterior con formulario y submit
2. Restaurar tests en `tests/homepage.spec.ts` que esperan comportamiento con Enter
3. No requiere migración de datos

## Dependencies

- No hay dependencias externas
- Requiere React 19 (ya disponible en el proyecto)

## Success Criteria

- [ ] El usuario puede buscar sin presionar Enter
- [ ] La búsqueda se ejecuta ~300ms después de dejar de escribir (debounce)
- [ ] El parámetro `search` aparece en la URL
- [ ] Los tests E2E existentes se actualizan oifican el nuevo comportamiento
- [ ] No hay regresiones en la funcionalidad de búsqueda existente
