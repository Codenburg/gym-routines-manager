# Tasks: Búsqueda unificada sin selector de tipo

## Phase 1: Types y Utilidades

- [x] 1.1 Crear `src/types/search.ts` con tipos `UnifiedSearchResult`, `RoutineSearchItem`, `TrainerSearchItem`, `ActiveFilter`
- [x] 1.2 Crear `src/lib/search-utils.ts` con funciones de ranking:
  - `rankSearchResults(results: RoutineSearchItem[], query: string): RoutineSearchItem[]`
  - `groupByTrainer(rutinas: RoutineSearchItem[]): TrainerSearchItem[]`

## Phase 2: Backend - API

- [x] 2.1 Crear `src/app/api/search/unified/route.ts`:
  - Endpoint GET que acepta parámetro `q`
  - Retorna `rutinas` y `entrenadores` con máximo 5 cada uno
  - Maneja caso sin resultados
- [x] 2.2 Modificar `src/app/api/rutinas/route.ts`:
  - Agregar parámetro `creador` para filtrar
  - Agregar paginación (`page`, `limit`)
  - Aplicar ranking a resultados
  - Retornar metadatos de paginación

## Phase 3: Frontend - Hooks

- [x] 3.1 Crear `src/hooks/use-unified-search.ts`:
  - Estado para `query`, `results`, `isLoading`
  - Función `debounce` para autocomplete
  - Estado para `activeFilters` (array de filtros)
  - Funciones: `setQuery`, `addFilter`, `removeFilter`, `clearFilters`
  - Efecto para sincronizar filtros con URL

## Phase 4: Frontend - Componentes

- [x] 4.1 Crear `src/components/search/search-autocomplete.tsx`:
  - Dropdown con dos secciones ("Rutinas", "Entrenadores")
  - Click en rutina → navegar a detalle
  - Click en entrenador → agregar filtro y cerrar
  - Manejo de caso sin resultados
- [x] 4.2 Crear `src/components/search/active-filters.tsx`:
  - Renderizar chips de filtros activos
  - Click en "X" → remover filtro
- [x] 4.3 Modificar `src/components/search/search-bar.tsx`:
  - Eliminar Select dropdown "Buscar por"
  - Integrar SearchAutocomplete
  - Integrar ActiveFilters
  - Mantener debounce de 300ms

## Phase 5: Testing / Verificación

- [ ] 5.1 Probar endpoint `/api/search/unified?q=test` en browser
- [ ] 5.2 Verificar que SearchBar no tenga dropdown "Buscar por"
- [ ] 5.3 Verificar autocomplete muestra secciones
- [ ] 5.4 Verificar filtros activos como chips
- [ ] 5.5 Verificar paginación en resultados
- [ ] 5.6 Verificar caso sin resultados

## Phase 6: Cleanup

- [ ] 6.1 Eliminar código no usado del anterior SearchBar (si aplica)
- [ ] 6.2 Verificar que no haya regresiones en otras páginas
