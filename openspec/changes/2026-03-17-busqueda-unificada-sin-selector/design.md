# Design: Búsqueda unificada sin selector de tipo

## Technical Approach

Se implementará una solución de búsqueda unificada que:
1. Crea un nuevo endpoint `/api/search/unified` para el autocomplete
2. Modifica el endpoint existente `/api/rutinas` para aceptar filtros combinados y paginación
3. Reemplaza el SearchBar actual con un componente de autocomplete
4. Agrega un sistema de filtros activos con chips

## Architecture Decisions

### Decision: Endpoint separado para autocomplete vs resultados completos

**Choice**: Crear `/api/search/unified` específico para autocomplete
**Alternatives considered**: Reutilizar `/api/rutinas` con parámetros adicionales
**Rationale**: El autocomplete necesita datos livianos (solo ID, nombre, creador) y paginación diferente (top 5). Un endpoint separado permite optimizar cada caso de uso.

### Decision: Búsqueda con ILIKE en lugar de FTS

**Choice**: Usar ILIKE de Prisma para búsqueda case-insensitive
**Alternatives considered**: PostgreSQL Full-Text Search (tsvector)
**Rationale**: ILIKE es suficiente para el volumen de datos actual y más simple de implementar. FTS agregaría complejidad innecesaria para el caso de uso. Se puede migrar a FTS si el volumen crece significativamente.

### Decision: Estado de filtros en URL

**Choice**: Los filtros activos se reflejan en la URL (query params)
**Alternatives considered**: Estado local solo en React
**Rationale**: Permite compartir URLs con filtros aplicados, navegación con back/forward, y bookmarking.

### Decision: Ranking implementado en aplicación (no SQL)

**Choice**: Implementar ranking en TypeScript después de recibir resultados
**Alternatives considered**: ORDER BY CASE en SQL
**Rationale**: El ranking es más legible y mantenible en código. El volumen de datos es pequeño, el overhead es insignificante.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         SearchBar                               │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Input       │───▶│ useDebounced    │───▶│ /api/search  │  │
│  │ (onChange)  │    │ Value (300ms)   │    │ /unified     │  │
│  └─────────────┘    └─────────────────┘    └──────┬───────┘  │
│         │                                            │          │
│         │         ┌─────────────────┐              │          │
│         └────────▶│ ActiveFilters   │◀─────────────┘          │
│                   │ (Chips)         │                         │
│                   └────────┬────────┘                         │
│                            │                                   │
│                            ▼                                   │
│                   ┌─────────────────┐                         │
│                   │ /api/rutinas    │                         │
│                   │ ?search=...     │                         │
│                   │ &creador=...    │                         │
│                   │ &page=...       │                         │
│                   └────────┬────────┘                         │
│                            │                                   │
│                            ▼                                   │
│                   ┌─────────────────┐                         │
│                   │ RoutineList     │                         │
│                   │ (with results)  │                         │
│                   └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/search.ts` | Create | Tipos para UnifiedSearchResult, SearchResult, ActiveFilter |
| `src/app/api/search/unified/route.ts` | Create | Endpoint para autocomplete |
| `src/app/api/rutinas/route.ts` | Modify | Agregar paginación, filtro creador, ranking |
| `src/components/search/search-autocomplete.tsx` | Create | Componente de autocomplete con secciones |
| `src/components/search/active-filters.tsx` | Create | Componente de chips de filtros activos |
| `src/components/search/search-bar.tsx` | Modify | Eliminar Select, integrar autocomplete |
| `src/hooks/use-unified-search.ts` | Create | Hook con debounce, estado de filtros |
| `src/lib/search-utils.ts` | Create | Funciones de ranking y utilidades |

## Interfaces / Contracts

```typescript
// Tipos principales
interface UnifiedSearchResult {
  rutinas: RoutineSearchItem[];
  trainers: TrainerSearchItem[];
  message?: string;
}

interface RoutineSearchItem {
  id: string;
  nombre: string;
  creador: string | null;
}

interface TrainerSearchItem {
  nombre: string; //唯一值
  count: number;  // 该教练的routine数量
}

interface ActiveFilter {
  type: "entrenador";
  value: string;
  label: string;
}

interface SearchParams {
  q?: string;           // Término de búsqueda (para autocomplete)
  search?: string;     // Término de búsqueda (para resultados)
  creador?: string;    // Filtro por creador
  page?: number;
  limit?: number;
}
```

## API Contracts

### GET /api/search/unified

**Query Parameters:**
- `q` (required): Término de búsqueda

**Response 200:**
```json
{
  "rutinas": [
    { "id": "uuid", "nombre": "Rutina Full Body", "creador": "Juan Pérez" }
  ],
  "entrenadores": [
    { "nombre": "Juan Pérez", "count": 5 }
  ]
}
```

### GET /api/rutinas (modificado)

**Nuevos Query Parameters:**
- `creador` (optional): Filtrar por creador específico
- `page` (optional, default: 1): Número de página
- `limit` (optional, default: 12): Resultados por página

**Response incluye paginación:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 12,
    "totalPages": 9
  }
}
```

## Migration / Rollout

No se requiere migración de datos. Los cambios son puramente de aplicación.

**Fases:**
1. Crear nuevos endpoints y tipos
2. Actualizar SearchBar con autocomplete
3. Agregar sistema de filtros activos
4. Verificar backward compatibility

## Open Questions

- [ ] ¿Cuántos resultados mostrar por página? (propuesto: 12)
- [ ] ¿Máximo resultados en autocomplete? (propuesto: 5 por sección)
- [ ] ¿Necesitamos cachear resultados de autocomplete?
