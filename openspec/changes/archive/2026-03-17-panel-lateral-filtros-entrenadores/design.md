# Design: Panel lateral con filtros de entrenadores

## Technical Approach

Implementar un sistema de búsqueda separado donde:
1. Un input central filtra rutinas por nombre con debounce 300ms
2. Un panel lateral muestra trainers con checkboxes de selección múltiple
3. La API de rutinas acepta parámetros combinados: `?search=X&trainers=A,B`
4. Una nueva API proporciona la lista de trainers con contadores

## Architecture Decisions

### Decision: Ubicación del estado de filtros

**Choice**: Usar URL como fuente de verdad para los filtros
**Alternatives considered**: Estado local en componente, Zustand store
**Rationale**: Mantiene consistencia con el patrón existente en `useUnifiedSearch`. Permite bookmarks y share de URLs.

### Decision: Formato de parámetro trainers

**Choice**: Comma-separated string (`trainers=Juan,Maria`)
**Alternatives considered**: Array en query string (`trainers[]=Juan&trainers[]=Maria`), JSON encode
**Rationale**: Simpler para debugging y coincide con el patrón de la API existente (`creador` ya usa string)

### Decision: Nuevo endpoint vs extensión de API existente

**Choice**: Crear nuevo endpoint `/api/trainers`
**Alternatives considered**: Extender `/api/rutinas` para devolver trainers
**Rationale**: Separación de responsabilidades. El endpoint de rutinas es para paginación y listados, no para metadatos de filtros.

### Decision: No usar Zustand para estado de filtros

**Choice**: Mantener el patrón actual de `useUnifiedSearch` con URL
**Alternatives considered**: Crear un Zustand store para filtros
**Rationale**: Evitar complejidad adicional. El hook actual ya funciona bien para sincronización con URL.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         page.tsx                                │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Server Component   │  │    Client Components             │ │
│  │                     │  │  ┌────────────┐ ┌──────────────┐  │ │
│  │  getRutinas() ──────┼──┼─►│ SearchBar  │ │ TrainerSidebar│  │ │
│  │  getTrainers() ────┼──┼─►│            │ │              │  │ │
│  │                     │  │  └─────┬──────┘ └──────┬───────┘  │ │
│  │  Pass props to      │  │        │              │          │ │
│  │  RoutineListWrapper │  │        ▼              ▼          │ │
│  │                     │  │  ┌─────────────────────────────┐   │ │
│  │                     │  │  │    useUnifiedSearch        │   │ │
│  │                     │  │  │  - query: string           │   │ │
│  │                     │  │  │  - trainerFilters: []      │   │ │
│  │                     │  │  │  - setQuery()              │   │ │
│  │                     │  │  │  - toggleTrainerFilter()   │   │ │
│  │                     │  │  └────────────┬──────────────┘   │ │
│  │                     │  │               │                  │ │
│  │                     │  │               ▼                  │ │
│  │                     │  │  Router.push(?search=X&trainers) │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
│                                                                 │
│  GET /api/rutinas?search=X&trainers=A,B                        │
│  ├── Parse query params                                        │
│  ├── WHERE nombre ILIKE %X%                                    │
│  └── WHERE creador IN (A, B)  ← NEW                            │
│                                                                 │
│  GET /api/trainers (NEW)                                       │
│  ├── SELECT creador, COUNT(*) as count                         │
│  └── GROUP BY creador                                          │
└─────────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/trainers/route.ts` | Create | New API endpoint returning trainers with routine counts |
| `src/app/api/rutinas/route.ts` | Modify | Add `trainers` parameter support with IN clause filtering |
| `src/components/search/trainer-sidebar.tsx` | Create | Sidebar component with trainer checkboxes |
| `src/components/search/search-input.tsx` | Create | Simplified search input without autocomplete |
| `src/components/search/search-bar.tsx` | Modify | Replace SearchAutocomplete with SearchInput |
| `src/components/search/search-autocomplete.tsx` | Delete | Remove autocomplete component |
| `src/components/search/active-filters.tsx` | Modify | Support trainer filter chips |
| `src/hooks/use-unified-search.ts` | Modify | Add trainer filter state and URL sync |
| `src/app/page.tsx` | Modify | Integrate TrainerSidebar, fetch trainers list |
| `src/types/search.ts` | Modify | Add TrainerFilter type if needed |

## Interfaces / Contracts

### New API: GET /api/trainers

```typescript
// Response
interface TrainerCount {
  nombre: string;  // trainer name (creador)
  count: number;  // number of routines
}

// Response example
[
  { "nombre": "Juan", "count": 5 },
  { "nombre": "Maria", "count": 3 }
]
```

### Modified API: GET /api/rutinas

```typescript
// Query parameters (NEW)
interface RutinasParams {
  search?: string;     // existing: filter by nombre ILIKE
  creador?: string;    // existing: filter by exact creator
  trainers?: string;   // NEW: comma-separated list, filter by creator IN list
  page?: number;
  limit?: number;
}

// Example: /api/rutinas?search=full&trainers=Juan,Maria
// Generates: WHERE nombre ILIKE %full% AND creador IN ('Juan', 'Maria')
```

### TrainerSidebar Component

```typescript
interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerSidebarProps {
  trainers: Trainer[];
  selectedTrainers: string[];
  onToggleTrainer: (name: string) => void;
  onClearAll: () => void;
}
```

### useUnifiedSearch (Modified)

```typescript
interface UseUnifiedSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  trainerFilters: string[];
  toggleTrainerFilter: (name: string) => void;
  clearTrainerFilters: () => void;
  activeFilters: ActiveFilter[];
  removeFilter: (filter: ActiveFilter) => void;
  clearFilters: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| API | `/api/trainers` returns correct data | Manual verification via curl/browser |
| API | `/api/rutinas?trainers=X` filters correctly | Manual verification |
| UI | TrainerSidebar renders trainers with counts | Visual verification |
| UI | Checkbox toggle updates URL params | Manual interaction |
| UI | Debounce delays search execution | Manual timing |
| E2E | Full flow: search + filter + pagination | Playwright (existing) |

## Migration / Rollback

No se requiere migración de datos. El cambio es aditivo:
- La API existente sigue funcionando (backward compatible)
- Los parámetros nuevos son opcionales
- El autocomplete se elimina pero no afecta datos

Rollback:
```bash
# Revertir cambios de código
git checkout -- src/app/page.tsx
git checkout -- src/app/api/rutinas/route.ts
git checkout -- src/components/search/search-autocomplete.tsx
rm src/app/api/trainers/route.ts
rm src/components/search/trainer-sidebar.tsx
rm src/components/search/search-input.tsx
```

## Open Questions

- [ ] ¿El sidebar debe estar a la izquierda o derecha? (Pendiente: typically left)
- [ ] ¿Cuántos trainers mostrar antes de paginar? (Sugerido: 20, luego scroll)
- [ ] ¿Mantener el filtro por tipo de rutina? (Spec dice NO, pero confirmar)
