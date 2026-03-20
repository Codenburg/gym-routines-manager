# Design: Singleton Gym Configuration

## Technical Approach

This design implements a singleton Gym configuration in the database with a public read API and admin-only write API. The approach uses Prisma ORM for database operations, follows existing API route patterns from `feriados/route.ts`, and creates a client-side admin component for price editing. The `informacion/page.tsx` will fetch the price at runtime instead of using hardcoded values.

## Architecture Decisions

### Decision: Gym ID as String "gym" instead of UUID

**Choice**: Use fixed string ID "gym" for the singleton Gym record
**Alternatives considered**: UUID with unique constraint, auto-increment integer
**Rationale**: The spec explicitly requires a fixed singleton pattern. Using a string ID "gym" makes it impossible to accidentally create multiple gym records and simplifies the upsert logic in both seed and API.

### Decision: Decimal for price storage

**Choice**: Prisma `Decimal` type for price field
**Alternatives considered**: Float, Integer (cents), String
**Rationale**: The spec requires at least 2 decimal places of precision. Float can cause floating-point errors. Integer (cents) adds conversion overhead. Decimal provides exact arithmetic and is the recommended type for monetary values in databases.

### Decision: Auto-create gym on GET request

**Choice**: GET /api/gym creates default gym if not exists
**Alternatives considered**: Return 404, require manual seed
**Rationale**: Spec requires auto-creation with default price 0. This ensures the API always returns a valid response and prevents breaking changes if the database is fresh.

### Decision: Use existing auth pattern from feriados route

**Choice**: Copy `verifyAdmin` function pattern from `api/feriados/route.ts`
**Alternatives considered**: Create middleware, use session directly
**Rationale**: Maintains consistency across the codebase. The pattern is proven and follows the same error handling approach.

### Decision: Client-side price editor component

**Choice**: Create `GymPriceEditor` client component with local state management
**Alternatives considered**: Server action with form, useQuery + mutations
**Rationale**: Simple local state is sufficient for a single-field edit. Follows the pattern from `feriado-manager.tsx` which uses client-side state with server actions.

## Data Flow

### GET /api/gym Flow

```
Client GET /api/gym
    │
    ▼
API Route Handler
    │
    ▼
Prisma FindUnique(gym)
    │
    ├──▶ Found ──▶ Return 200 with Gym object
    │
    └──▶ Not Found ──▶ Prisma Create({ id: "gym", price: 0 })
                          │
                          ▼
                     Return 200 with new Gym object
```

### PATCH /api/gym Flow

```
Client PATCH /api/gym { price: 50000 }
    │
    ▼
API Route Handler
    │
    ▼
verifyAdmin(session)
    │
    ├──▶ Not Authorized ──▶ Return 401/403
    │
    └──▶ Authorized ──▶ Validate price (positive number)
                            │
                            ├──▶ Invalid ──▶ Return 400
                            │
                            └──▶ Valid ──▶ Prisma Update
                                              │
                                              ▼
                                         Return 200 with updated Gym
```

### Frontend Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      informacion/page.tsx                   │
│                   (Server Component)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   GET /api/gym ─────────────────┐                           │
│                                 │                           │
│                                 ▼                           │
│                    Display formatted price                  │
│                    "$45.000"                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              src/components/admin/gym-price-editor.tsx     │
│                   (Client Component)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   State: loading → display → editing → saving → display    │
│                                                             │
│   GET /api/gym ──► Display price                          │
│         │                                                    │
│         ▼                                                    │
│   Click "Editar precio" ──► Show input                     │
│         │                                                    │
│         ▼                                                    │
│   PATCH /api/gym ──► Refetch ──► Display new price        │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add Gym model with id, price (Decimal), createdAt, updatedAt; modify Feriado to add gymId with default "gym" and relation |
| `prisma/seed.ts` | Modify | Add gym upsert logic after user creation, before routines |
| `src/app/api/gym/route.ts` | Create | GET returns singleton, PATCH updates price (admin only) |
| `src/components/admin/gym-price-editor.tsx` | Create | Client component with edit states |
| `src/app/admin/page.tsx` | Modify | Add GymPriceEditor component to admin dashboard |
| `src/app/informacion/page.tsx` | Modify | Replace hardcoded "$45.000" with API fetch |

## Interfaces / Contracts

### Prisma Schema

```prisma
model Gym {
  id        String   @id @default("gym")
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  feriados Feriado[]
}

model Feriado {
  id        String   @id @default(uuid())
  fecha     DateTime
  gymId     String   @default("gym")
  createdAt DateTime @default(now())

  gym       Gym      @relation(fields: [gymId], references: [id], onDelete: Cascade)

  @@index([gymId])
}
```

### API Response Types

```typescript
interface GymResponse {
  id: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface GymUpdateRequest {
  price: number;
}

interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}
```

### Component States

```typescript
type GymEditorState = 'loading' | 'display' | 'editing' | 'saving' | 'error';

interface GymPriceEditorState {
  price: number | null;
  isEditing: boolean;
  inputValue: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}
```

## Migration / Rollout

### Migration Strategy

1. **Create migration**: `npx prisma migrate dev --name add_gym_singleton`
2. **Apply migration**: Prisma will:
   - Create new `Gym` table
   - Add `gymId` column to `Feriado` with default "gym"
   - Create foreign key constraint with cascade delete
   - Create index on `gymId`
3. **Seed data**: Run `npx prisma db seed` to create default gym

### Handling Existing Feriados

The migration adds `gymId` column with default "gym". All existing `Feriado` records will automatically get `gymId = "gym"` because:
- The default is applied during ALTER TABLE
- No data migration script needed

### Rollback Plan

1. `npx prisma migrate dev --name revert_gym_singleton` (reverts schema)
2. Delete `src/app/api/gym/route.ts`
3. Revert `src/app/informacion/page.tsx` to hardcoded value
4. Delete `src/components/admin/gym-price-editor.tsx`
5. Remove from `src/app/admin/page.tsx`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Zod validation for price | Test positive, zero, negative, non-numeric inputs |
| Integration | API endpoints | Test GET (200, empty DB), PATCH (auth, validation, success) |
| E2E | Admin flow | Manual: click edit, enter price, save, verify display |

### API Test Cases

- `GET /api/gym` returns 200 with price when gym exists
- `GET /api/gym` creates default gym when none exists
- `PATCH /api/gym` returns 401 without session
- `PATCH /api/gym` returns 403 for non-admin user
- `PATCH /api/gym` returns 400 for negative price
- `PATCH /api/gym` returns 400 for non-numeric price
- `PATCH /api/gym` returns 200 and updates price for admin

## Open Questions

- [ ] Should the gym editor be in a separate admin page or added to existing admin dashboard? — *Decision: Add to existing admin/page.tsx dashboard for simplicity*
- [ ] Should we add revalidation of `/informacion` after price change? — *Yes, use `revalidatePath('/informacion')` in API route after PATCH*
- [ ] Should price formatting use locale-aware formatting? — *Yes, use `Intl.NumberFormat` with `es-AR` locale for "$45.000" format*
