# Design: Homepage UI MVP

## Technical Approach

This design implements the homepage for the gym routines manager using Next.js App Router with Server Components. The approach leverages React 19's `use()` hook for consuming async data directly in Server Components, combined with Tailwind CSS 4 for styling. Data flows through a REST API endpoint (`/api/rutinas`) that supports search filtering via query parameters, following the GET-as-query pattern specified in the proposal.

The implementation follows a layered architecture where:
- **UI Layer** (`app/`, `components/`): Server Components for pages, presentational components for reusable UI
- **Application Layer** (`services/`): Orchestrates data fetching (future expansion)
- **Infrastructure Layer** (`app/api/`): REST endpoints for data access

This approach aligns with the Next.js 15+ paradigm of Server Components by default, streaming with Suspense, and using URL-based state for search parameters.

---

## Architecture Decisions

### Decision: Server Components for Homepage

**Choice**: Use Next.js Server Components for `app/page.tsx` and fetch data directly without client-side fetching hooks.

**Alternatives considered**:
- Client Component with `useEffect` and SWR/TanStack Query
- Client Component with `use()` hook for client-side fetching

**Rationale**: 
- Server Components eliminate the need for client-server roundtrips for initial data fetch
- Follows Next.js 15 best practice: fetch on server when possible
- Reduces JavaScript bundle size (no client-side data fetching library)
- React 19's `use()` hook allows seamless async data consumption in Server Components
- Spec requirement explicitly mandates Server Component with `use()` hook

---

### Decision: URL Search Params for Search State

**Choice**: SearchBar updates URL query parameters (`?search=term`) using GET form submission.

**Alternatives considered**:
- Client-side state with useState and client-side filtering
- Server Actions with useFormStatus for POST-based search

**Rationale**:
- URL as source of truth enables browser back/forward navigation with search preserved
- Server-side filtering is more performant for large datasets (no client-side filtering)
- GET requests are bookmarkable and shareable
- Spec explicitly requires "updates URL query parameter when user submits a search"
- No need for useFormStatus since this is a read operation, not a mutation

---

### Decision: API Route for Data Access

**Choice**: Create `/api/rutinas` route handler instead of calling Prisma directly in the Server Component.

**Alternatives considered**:
- Direct Prisma queries in Server Component
- Server Actions for data fetching

**Rationale**:
- Provides a clear separation between UI and data access layers
- Follows openspec architecture constraint: "ui MUST NOT access database or infrastructure directly"
- API route enables future client-side data fetching if needed (e.g., infinite scroll)
- Easier to add caching headers in one place
- Server Actions are better suited for mutations, not read operations

---

### Decision: Suspense with Custom Skeleton Loading

**Choice**: Use Next.js Suspense with `app/loading.tsx` containing skeleton cards matching RoutineCard layout.

**Alternatives considered**:
- Loading spinner or global loading indicator
- No loading state (blocking wait)

**Rationale**:
- Spec requires "loading state MUST display skeleton cards that match the visual structure of actual RoutineCards"
- Suspense with streaming provides progressive loading without blocking the entire page
- Skeleton cards reduce perceived wait time and prevent layout shift
- Native Next.js App Router pattern with `loading.tsx`

---

### Decision: Atomic Design for Component Structure

**Choice**: Separate components into `ui/` (atomic), `routines/` (domain), and `search/` (feature) directories.

**Alternatives considered**:
- Flat component directory with all components in one folder
- Feature-based folder structure

**Rationale**:
- Aligns with open spec structure rules and atomic design principles
- `ui/` contains primitive, reusable components (Card, Input)
- `routines/` contains business-domain components (RoutineCard, RoutineList)
- `search/` contains feature-specific components (SearchBar)
- Makes components discoverable and maintains single responsibility

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  SearchBar   │───▶│  page.tsx     │───▶│  RoutineList     │  │
│  │  (form GET)  │    │  (Server)    │    │  (Server)        │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                   │                      │            │
│         ▼                   ▼                      ▼            │
│    ?search=term    searchParams ──────────▶ RoutineCard × N    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  /api/rutinas   │
                    │  (Route Handler)│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Prisma Client  │
                    │  (PostgreSQL)  │
                    └─────────────────┘
```

**Flow Description**:

1. User navigates to `/` or submits search in SearchBar
2. `page.tsx` (Server Component) receives `searchParams` as prop
3. Server Component calls `/api/rutinas?search={term}` internally
4. API Route handler uses Prisma to query `Rutina` model with optional `contains` filter
5. API returns JSON array of routines
6. Server Component renders RoutineList with fetched data
7. RoutineList maps each routine to a RoutineCard component

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/page.tsx` | Modify | Replace Next.js boilerplate with homepage Server Component |
| `app/layout.tsx` | Modify | Update metadata (title, description) for homepage |
| `app/loading.tsx` | Create | Suspense fallback with skeleton cards |
| `app/api/rutinas/route.ts` | Create | GET endpoint returning rutinas with optional search filter |
| `components/ui/card.tsx` | Create | Atomic Card component (base primitive) |
| `components/ui/input.tsx` | Create | Atomic Input component (base primitive) |
| `components/routines/routine-card.tsx` | Create | Displays single routine with name, type, description, days |
| `components/routines/routine-list.tsx` | Create | Responsive grid of RoutineCards |
| `components/search/search-bar.tsx` | Create | Search form with URL param submission |
| `lib/prisma.ts` | Create | Singleton Prisma Client instance |

---

## Interfaces / Contracts

### TypeScript Types

```typescript
// API Response Type
interface RutinaResponse {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    dias: number;
  };
}

// RoutineCard Component Props
interface RoutineCardProps {
  rutina: {
    id: string;
    nombre: string;
    tipo: string;
    descripcion: string | null;
    diasCount: number;
  };
}

// RoutineList Component Props
interface RoutineListProps {
  rutinas: Array<{
    id: string;
    nombre: string;
    tipo: string;
    descripcion: string | null;
    diasCount: number;
  }>;
}

// SearchBar Component Props
interface SearchBarProps {
  defaultValue?: string;
}
```

### API Contract

```
GET /api/rutinas
├── Query Parameters
│   └── search (optional): string - filter by nombre (case-insensitive contains)
├── Response 200
│   └── Array<RutinaResponse>
└── Response 500
    └── { error: string }
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| API Route | Returns all rutinas without search | Manual: curl GET /api/rutinas |
| API Route | Filters by search term | Manual: curl GET /api/rutinas?search=Push |
| API Route | Handles empty results | Manual: curl GET /api/rutinas?search=nonexistent |
| API Route | Returns 500 on DB failure | Manual: stop DB, curl GET /api/rutinas |
| RoutineCard | Displays all fields correctly | Visual verification |
| RoutineCard | Handles missing description | Visual verification |
| RoutineCard | Hover state visible | Visual verification |
| RoutineList | Responsive grid (1/2/3 columns) | Resize viewport, verify layout |
| RoutineList | Empty state message | Visual verification |
| SearchBar | URL updates on submit | Type and submit, check URL |
| SearchBar | Empty search clears filter | Clear and submit, verify full list |
| Homepage | Full flow: load → search → filter | E2E verification |
| Loading | Skeleton appears during fetch | Network throttling |

**Note**: No test infrastructure is configured in this project (per `openspec/config.yaml`). Testing is performed manually or via visual verification.

---

## Migration / Rollback

### Migration Required
No database migration required. The Prisma schema already contains the `Rutina` and `Dia` models needed for this feature.

### Seed Data Required
The feature requires seed data to display routines. A seed script should be created separately (out of scope for this change).

### Rollback Plan

1. Delete `app/loading.tsx`
2. Delete `app/api/rutinas/route.ts`
3. Delete `components/ui/card.tsx`
4. Delete `components/ui/input.tsx`
5. Delete `components/routines/routine-card.tsx`
6. Delete `components/routines/routine-list.tsx`
7. Delete `components/search/search-bar.tsx`
8. Delete `lib/prisma.ts`
9. Restore `app/page.tsx` to original boilerplate
10. Restore `app/layout.tsx` metadata

---

## Open Questions

- [ ] **Seed data**: Should we create a seed script as part of this change, or handle separately?
- [ ] **Error boundary**: Should we add a custom `app/error.tsx` for error handling, or rely on default Next.js behavior?
- [ ] **Pagination**: The spec mentions implementing pagination "if necessary (future)". Should we add basic pagination now or defer?

---

## Related Artifacts

- **Proposal**: `openspec/changes/homepage-ui/proposal.md`
- **Spec**: `openspec/changes/homepage-ui/specs/homepage/spec.md`
- **Prisma Schema**: `prisma/schema.prisma` (Rutina, Dia models)
