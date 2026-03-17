# Proposal: Búsqueda unificada sin selector de tipo

## Intent

El usuario quiere eliminar el dropdown "Buscar por" y tener una única caja de búsqueda que busque simultáneamente en `routine.nombre` y `trainer.nombre` (creador de la rutina), con autocomplete mostrando resultados en secciones y filtros activos tipo chips.

## Scope

### In Scope
- Backend: Búsqueda full-text con ILIKE o FTS que retorne resultados combinados de rutinas y entrenadores
- Ranking de resultados:
  - Match exacto en routine.nombre (prioridad 1)
  - Match parcial en routine.nombre (prioridad 2)
  - Match exacto en trainer.nombre (prioridad 3)
  - Match parcial en trainer.nombre (prioridad 4)
- Frontend: Autocomplete con secciones "Rutinas" y "Entrenadores"
- Al seleccionar entrenador → filtrar rutinas por ese trainer
- Chips/filtros activos con opción de remover (ej: "Entrenador: Juan Pérez")
- Debounce 300ms (ya implementado)
- Paginación

### Out of Scope
- Búsqueda en otras páginas (admin panel)
- Historial de búsquedas
- Búsqueda avanzada con filtros adicionales (tipo, fecha, etc.)

## Approach

Se implementará:
1. Nueva endpoint de API `/api/search/unified` que retorna resultados combinados con ranking
2. Componente de Autocomplete que muestra resultados en dos secciones
3. Sistema de filtros activos con chips
4. Paginación en los resultados

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/rutinas/route.ts` | Modified | Actualizar para aceptar búsqueda combinada y paginación |
| `src/app/api/search/route.ts` | Create | Nueva endpoint de búsqueda unificada |
| `src/components/search/search-bar.tsx` | Modified | Eliminar dropdown, agregar autocomplete |
| `src/components/search/search-autocomplete.tsx` | Create | Nuevo componente de autocomplete |
| `src/components/search/active-filters.tsx` | Create | Componente de chips/filtros activos |
| `src/hooks/use-unified-search.ts` | Create | Hook para búsqueda unificada con estado |
| `src/types/search.ts` | Create | Tipos para resultados de búsqueda |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Performance con FTS en grandes datasets | Medium | Usar índices apropiados, paginación |
| UX confuse si hay muchos resultados | Low | Limitar resultados en autocomplete (top 10 por sección) |
| Regresión en búsqueda existente | Medium | Mantener backward compatibility en API existente |

## Rollback Plan

1. Revertir cambios en SearchBar al dropdown anterior
2. Eliminar nueva endpoint de API
3. Restaurar comportamiento original de `/api/rutinas`
4. No requiere migración de datos

## Dependencies

- React 19 (ya disponible)
- shadcn/ui components (ya instalados)
- Prisma 7 (ya disponible)

## Success Criteria

- [ ] El dropdown "Buscar por" está eliminado
- [ ] La búsqueda busca en nombre de rutina y nombre de creador
- [ ] Los resultados se muestran en secciones "Rutinas" y "Entrenadores"
- [ ] Al seleccionar un entrenador, se filtran rutinas por ese entrenador
- [ ] Los filtros activos se muestran como chips con opción de remover
- [ ] La búsqueda tiene debounce de 300ms
- [ ] Los resultados están paginados
- [ ] Sin resultados → mensaje con sugerencias
- [ ] Términos ambiguos → ambas secciones visibles
