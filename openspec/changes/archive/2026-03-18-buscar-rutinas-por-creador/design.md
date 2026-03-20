# Design: Buscar rutinas por creador

## Technical Approach

Agregar un parámetro `searchBy` al endpoint GET /api/rutinas y un Select dropdown en el SearchBar para elegir el tipo de búsqueda.

## Architecture Decisions

### Decision: Search parameter handling

**Choice**: Agregar parámetro `searchBy` con valores `nombre` o `creador`
**Alternatives considered**: 
- Buscar en ambos campos con OR: más flexible pero menos preciso para el usuario
- Dos endpoints separados: `/api/rutinas/search-by-name` y `/api/rutinas/search-by-creator`
**Rationale**: Mantiene la API simple y RESTful, permite al usuario controlar exactamente qué busca

### Decision: Frontend state management for search type

**Choice**: Usar URL query params para persistir el search type
**Alternatives considered**: 
- Local state con useState: se pierde al recargar
- LocalStorage: overkill para una preferencia simple
**Rationale**: Mantiene consistencia con el resto del search (search query ya está en URL), permite share URLs con el filtro aplicado

## Data Flow

```
User types in SearchBar
        │
        ▼
SearchBar updates local state + URL params
        │
        ▼
Page reads ?search=X&searchBy=Y from URL
        │
        ▼
API fetch with params → GET /api/rutinas?search=X&searchBy=Y
        │
        ▼
Backend builds WHERE clause based on searchBy
        │
        ▼
Prisma query → filtered results
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/rutinas/route.ts` | Modify | Agregar filtro por `creador` basado en `searchBy` param |
| `src/components/search/search-bar.tsx` | Modify | Agregar Select dropdown para elegir tipo de búsqueda |
| `src/components/ui/select.tsx` | (existing) | Usar componente shadcn existente |

## Interfaces / Contracts

### API Endpoint Change

```typescript
// GET /api/rutinas?search=Marcelo&searchBy=creador

interface GetRutinasParams {
  search?: string;
  searchBy?: 'nombre' | 'creador'; // default: 'nombre'
}
```

### SearchBar Component Change

```typescript
interface SearchBarProps {
  defaultValue?: string;
  defaultSearchBy?: 'nombre' | 'creador'; // new prop
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| API | Filtro por creador retorna resultados correctos | Manual con curl o Postman |
| API | Backward compatibility con search sin searchBy | Manual |
| UI | Dropdown cambia el query param en URL | Manual |

## Migration / Rollout

No migration required. El parámetro `searchBy` es opcional y el default es `nombre`, manteniendo backward compatibility.

## Open Questions

Ninguno. El cambio es simple y directo.
