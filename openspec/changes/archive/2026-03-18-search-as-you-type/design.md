# Design: Búsqueda reactiva (search-as-you-type)

## Technical Approach

Se implementará un componente `SearchBar` que utiliza un debounce con `useEffect` para ejecutar la búsqueda automáticamente después de que el usuario deje de escribir durante 300ms. Se eliminará el formulario y el submit manual.

## Architecture Decisions

### Decision: Debounce con useEffect en lugar de useDeferredValue

**Choice**: Usar un `useEffect` con `setTimeout` para implementar el debounce
**Alternatives considered**: 
- `useDeferredValue` de React 19 - no es ideal porque solo diferisce el render, no la acción
- Librería externa como `use-debounce` - añadiría dependencia innecesaria
**Rationale**: Es una implementación simple y nativa que no requiere dependencias adicionales. El proyecto ya usa React 19 pero useEffect con timeout es más directo para este caso de uso.

### Decision: 300ms de delay

**Choice**: 300ms de debounce
**Alternatives considered**: 
- 500ms - demasiado lento para UX
- 100-200ms - podría generar demasiadas llamadas
**Rationale**: 300ms es un balance entre responsividad y eficiencia. Es el estándar de la industria para search-as-you-type.

## Data Flow

```
User types → onChange → setValue → useEffect(timeout 300ms) → createQueryString → router.push → Page receives searchParams → API fetch
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/search/search-bar.tsx` | Modify | Eliminar form, agregar debounce con useEffect |
| `tests/homepage.spec.ts` | Modify | Actualizar tests para validar nuevo comportamiento |

## Interfaces / Contracts

```typescript
interface SearchBarProps {
  defaultValue?: string;
}
```

El componente ahora:
- No usa `<form>` ni `onSubmit`
- Usa `useEffect` con cleanup para cancelar timeouts previos
- Dispara `router.push` automáticamente después del debounce

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E | Search sin Enter funciona | Test que escriba y verifique URL sin press Enter |
| E2E | Debounce evita múltiples llamadas | Escribir rápido y verificar una sola navegación |
| E2E | Limpiar búsqueda | Borrar texto y verificar URL sin search param |

## Migration / Rollback

No requiere migración de datos. El cambio es puramente de UI/client-side.

## Open Questions

- ¿Se debe mantener la funcionalidad de "presionar Enter" como fallback? → Decisión: NO, eliminamos el form completamente para simplificar
- ¿Debe mostrarse un indicador de "buscando"? → Decisión: NO, la página es suficientemente reactiva
