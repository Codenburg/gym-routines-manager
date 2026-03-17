# Proposal: Panel lateral con filtros de entrenadores

## Intent

Separar la funcionalidad de búsqueda en dos componentes diferenciados para mejorar la experiencia de usuario:
1. **Input principal (centro)**: Solo búsqueda por nombre de rutina (`routine.name`)
2. **Panel lateral (sidebar)**: Lista de entrenadores como filtros seleccionables

El usuario quiere eliminar el autocomplete que mezcla rutinas y entrenadores, y en su lugar tener una lista lateral dedicada a filtrar por trainer con checkboxes de selección múltiple.

## Scope

### In Scope
- Input de búsqueda centrado que filtra solo por `routine.name`
- Panel lateral con lista scrollable de `trainer.name`
- Checkboxes de selección múltiple en la sidebar
- Contador de rutinas por cada entrenador
- Opción "Todos" para resetear filtros
- Chips activos arriba de los resultados
- Debounce 300ms en el input de búsqueda
- Query parametrizada: `WHERE routine.name ILIKE %q% AND trainer_id IN (...)`
- Paginación en los resultados de rutinas

### Out of Scope
- Autocomplete (se elimina completamente)
- Selector de tipo de rutina existente (se elimina)
- Búsqueda por creador en el input principal
- Modificación de la API de búsqueda unificada (`/api/search/unified`)

## Approach

### Arquitectura Propuesta
1. **API `/api/rutinas`**: Agregar parámetro `trainers` (array de nombres) para filtrar por múltiples entrenadores
2. **Nueva API `/api/trainers`**: Endpoint para obtener lista de trainers con contador de rutinas
3. **Componente `TrainerSidebar`**: Panel lateral con checkboxes y contadores
4. **Simplificar `SearchBar`**: Solo input de texto con debounce, sin autocomplete
5. **Actualizar `useUnifiedSearch`**: Manejar filtros de trainers desde URL

### Flujo de Datos
```
User Input → useUnifiedSearch → URL params → Server Component → API /rutinas?search=X&trainers=A,B
                                           → API /trainers (para sidebar)
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/rutinas/route.ts` | Modified | Agregar parámetro `trainers` para filtrado múltiple |
| `src/app/api/trainers/route.ts` | New | Endpoint para obtener trainers con contadores |
| `src/components/search/search-bar.tsx` | Modified | Simplificar, eliminar autocomplete |
| `src/components/search/search-autocomplete.tsx` | Removed | Eliminar componente |
| `src/components/search/trainer-sidebar.tsx` | New | Panel lateral con filtros |
| `src/hooks/use-unified-search.ts` | Modified | Manejar filtros de trainers |
| `src/app/page.tsx` | Modified | Integrar sidebar y layout con filtros |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking API existente | Low | Mantener backward compatibility, solo agregar параметр |
| Performance con muchos trainers | Low | Lazy load y paginación si es necesario |
| Estado de filtros en URL | Medium | Sincronizar con useUnifiedSearch existente |

## Rollback Plan

1. Revertir cambios en `src/app/page.tsx` para restaurar layout original
2. Restaurar `SearchAutocomplete` desde el historial de git
3. Eliminar parámetro `trainers` de la API
4. Deshacer cambios en `use-unified-search.ts`

## Dependencies

- Ninguna dependencia externa nueva
- Se basa en la estructura existente de Prisma y Next.js

## Success Criteria

- [ ] Input de búsqueda filtra rutinas por nombre con debounce 300ms
- [ ] Panel lateral muestra lista de trainers con checkboxes
- [ ] Cada trainer muestra contador de rutinas
- [ ] Opción "Todos" limpia los filtros de trainers
- [ ] Filtros activos se muestran como chips
- [ ] La query API usa parámetros: `?search=X&trainers=A,B`
- [ ] Paginación funciona correctamente
- [ ] Autocomplete eliminado completamente
- [ ] Selector de tipo eliminado
