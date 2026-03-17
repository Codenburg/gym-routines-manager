# Technical Design: home-page-routines-list

## 1. Technical Approach

### Overview
Modify the Home page to display nested hierarchy: Rutinas → Días → Ejercicios. The `RoutineCard` will expand to show days inline, with each day clickable to navigate to the day detail page.

### Implementation Strategy
- **Backend**: Extend API `/api/rutinas` to include nested `dias` array with exercises
- **Frontend**: Modify `RoutineCard` to render expandable `DayCard` components
- **Navigation**: Days link to `/rutinas/[id]/dias/[diaId]` (already exists)

---

## 2. Architecture Decisions

| Decision | Rationale |
|----------|------------|
| **Include full nested data in GET `/api/rutinas`** | Single request loads all data needed for home page. Trade-off: larger payload but eliminates N+1 queries when expanding cards. |
| **Days expanded by default** | Spec requirement. Use CSS accordion pattern with local state (no global state needed). |
| **Keep `diasCount` for backward compatibility** | Existing consumers may rely on it; preserve API contract. |
| **Reuse existing day detail route** | Avoid creating new routes; leverage existing `/rutinas/[id]/dias/[diaId]`. |
| **Client-side expand/collapse state** | Each card independent; no need for global state management. |

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Home Page     │────▶│  API /rutinas    │────▶│   Prisma DB     │
│  (Server Comp)  │     │ (Extended)       │     │                 │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│ RoutineList     │     │ Response:        │
│ (Client Comp)   │     │ { ..., dias: [   │
└────────┬────────┘     │   { id, nombre,  │
         │              │     musculos,    │
         ▼              │     ejercicios:  │
┌─────────────────┐     │     [...] } ] }  │
│ RoutineCard     │     └──────────────────┘
│ ├─ DayCard 1    │
│ ├─ DayCard 2    │     Link to:
│ └─ DayCard 3    │     /rutinas/[id]/dias/[diaId]
└─────────────────┘
```

---

## 3. File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `app/api/rutinas/route.ts` | MODIFY | Add `include: { dias: { include: { ejercicios: true } } }` to query |
| `app/page.tsx` | MODIFY | Update `Rutina` interface to include `dias` array |
| `components/routines/routine-card.tsx` | MODIFY | Add expand/collapse state, render `DayCard` components |
| `components/routines/routine-list.tsx` | MODIFY | Update `Rutina` interface to match new API response |
| `components/routines/day-card.tsx` | **CREATE** | New component for day display with exercise preview |
| `types/rutina.ts` | **CREATE** | Shared TypeScript interfaces (optional, for consistency) |

---

## 4. TypeScript Interfaces

```typescript
// Ejercicio interface (shared across components)
interface Ejercicio {
  id: string;
  nombre: string;
  series: string | null;
  repes: string | null;
  orden: number;
}

// Dia interface
interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  orden: number;
  ejercicios: Ejercicio[];
}

// Extended Rutina interface (Home page)
interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  diasCount: number;       // Preserved for backward compatibility
  dias: Dia[];             // NEW: nested days with exercises
}
```

---

## 5. API Response Contract

### GET `/api/rutinas`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "nombre": "Push Day",
    "tipo": "Fuerza",
    "descripcion": "Pecho, hombros y tríceps",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "diasCount": 2,
    "dias": [
      {
        "id": "uuid",
        "nombre": "Día 1 - Pecho",
        "musculosEnfocados": "Pectorales",
        "orden": 0,
        "ejercicios": [
          { "id": "uuid", "nombre": "Press banca", "series": "4x10", "repes": "8-12", "orden": 0 },
          { "id": "uuid", "nombre": "Press inclinado", "series": "3x10", "repes": "8-12", "orden": 1 }
        ]
      }
    ]
  }
]
```

---

## 6. Component Specifications

### DayCard Component

```typescript
interface DayCardProps {
  dia: Dia;
  rutinaId: string;
}

export function DayCard({ dia, rutinaId }: DayCardProps) {
  const href = `/rutinas/${rutinaId}/dias/${dia.id}`;
  
  return (
    <Link href={href} className="block">
      {/* Day header with nombre and muscle focus */}
      {/* Exercise preview list (max 3) */}
      {/* Show "+X more" if > 3 exercises */}
    </Link>
  );
}
```

### RoutineCard Modifications

- Add `useState<boolean>` for `isExpanded` (default: `true`)
- Render days section with collapse/expand toggle
- Each day rendered as `DayCard`

---

## 7. Testing Strategy

### Unit Tests
- `DayCard` renders correct day info and href
- `RoutineCard` expand/collapse toggles correctly
- API response transformation handles empty arrays

### Integration Tests
- Home page renders all routines with nested days
- Clicking day navigates to correct URL
- Empty states display properly (no days, no exercises)

### E2E (optional)
- Flow: Home → Click day → Day detail page

---

## 8. Migration / Rollback Plan

### Migration Steps
1. **Deploy API** - Add nested `dias` to response (backward compatible, adds fields)
2. **Deploy FE** - Update interfaces, create `DayCard`, modify `RoutineCard`
3. **Verify** - Check home page renders correctly with expanded days

### Rollback Plan
- Revert API to return only `diasCount` (field removal is backward compatible for consumers expecting fewer fields)
- Revert `RoutineCard` to previous version (hide days section)
- No database migration needed (schema unchanged)

### Risk Assessment
- **Low Risk**: API adds fields only; no breaking changes
- **Performance**: Larger JSON payload. Monitor with 100+ routines.
- **Mitigation**: Add pagination if payload exceeds 500KB

---

## 9. Acceptance Criteria

- [ ] API `/api/rutinas` returns `dias` array with nested `ejercicios`
- [ ] `diasCount` still present in response
- [ ] `RoutineCard` displays days expanded by default
- [ ] Days are clickable and navigate to `/rutinas/[id]/dias/[diaId]`
- [ ] Each day shows exercise preview (name + series)
- [ ] UI matches existing design system (slate-900 bg, blue accents)
- [ ] No console errors on page load
