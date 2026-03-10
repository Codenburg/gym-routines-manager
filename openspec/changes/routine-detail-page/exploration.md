# Exploration: Routine Detail Pages

## Current State

The project is a Next.js 15 App Router application with Prisma + PostgreSQL. Currently:

### Existing Architecture
- **Homepage**: `app/page.tsx` - Server Component que fetch a `/api/rutinas`
- **API**: `app/api/rutinas/route.ts` - Solo tiene `GET /api/rutinas` (lista con filtro search)
- **Data Model**: Schema Prisma con relaciones bien definidas:
  - `Rutina` → tiene muchos `Dia` (onDelete: Cascade)
  - `Dia` → tiene muchos `Ejercicio` (onDelete: Cascade)
- **Components**: Card, Input, RoutineCard, RoutineList, SearchBar (en `components/ui/` y `components/routines/`)
- **Styling**: Tailwind CSS con tema oscuro (slate-900 background)

### Gap Analysis
1. **No existe endpoint para detalle**: No hay `GET /api/rutinas/[id]`
2. **No existe routing dinámico**: No hay `app/rutinas/[id]/page.tsx`
3. **RoutineCard no es navegable**: Tiene `cursor-pointer` pero no tiene `Link` de Next.js

## Affected Areas

| File | Why It's Affected |
|------|-------------------|
| `app/api/rutinas/route.ts` | Need new GET endpoint for single routine |
| `app/rutinas/[id]/page.tsx` | NEW - Detail page to create |
| `components/routines/routine-card.tsx` | Need to add Link wrapper |
| `components/routines/` | NEW - Components for Day/Exercise display |
| `prisma/schema.prisma` | Already has relations - no changes needed |

## Approaches

### Approach 1: Minimal - Add API + Page (Recommended)
- Create `app/api/rutinas/[id]/route.ts` with `GET` that returns rutina + dias + ejercicios
- Create `app/rutinas/[id]/page.tsx` as Server Component
- Add `Link` to RoutineCard

**Pros:**
- Sigue patrones existentes (mismo approach que homepage)
- Server Components para data fetching directo
- No necesita cliente state management

**Cons:**
- Repite estructura similar a homepage

**Effort:** Medium

### Approach 2: With Suspense Boundaries
- Same as Approach 1 but add Suspense per day/exercise
- Each day could load independently

**Pros:**
- Better perceived performance for routines with many days
- Progressive loading

**Cons:**
- More complex setup
- May be over-engineered for initial version

**Effort:** High

### Approach 3: Client-side Fetch
- Fetch from client in `useEffect` or with React 19 `use()`
- Maintain current loading states

**Pros:**
- More control over loading states
- Can implement optimistic UI

**Cons:**
- Contradicts existing server-first patterns
- More client-side JavaScript

**Effort:** Medium (but not recommended)

## Recommendation

**Approach 1: Minimal** - Follow the existing patterns:
1. Create `GET /api/rutinas/[id]` that uses Prisma `include` for dias.ejercicios
2. Create `app/rutinas/[id]/page.tsx` - Server Component que fetch a la API (o llama Prisma directamente)
3. Wrap RoutineCard with Next.js `Link`
4. Create simple DayList/ExerciseList components

This maintains consistency with the homepage architecture.

## Risks

- **No error handling for non-existent IDs**: Need 404 handling in new page
- **Performance**: Large routines with many exercises could be slow (mitigate with pagination later if needed)
- **No navigation back**: Need to add "volver" link in detail page

## Ready for Proposal

**Yes.** The exploration is complete. The change requires:

1. New API route: `app/api/rutinas/[id]/route.ts`
2. New page: `app/rutinas/[id]/page.tsx`
3. Update RoutineCard to be navigable
4. Optional: New components for Day/Exercise display (could inline initially)

The approach should follow the existing server-first pattern used in the homepage.
