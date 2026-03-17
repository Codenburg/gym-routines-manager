# Tasks: Singleton Gym Configuration

## Phase 1: Database & Infrastructure

- [ ] 1.1 Add Gym model to `prisma/schema.prisma` with id (String, default "gym"), price (Decimal), createdAt, updatedAt; add relation to Feriado with onDelete Cascade
- [ ] 1.2 Modify Feriado model in `prisma/schema.prisma` to add gymId (String, default "gym"), index on gymId, and relation to Gym
- [ ] 1.3 Run `npx prisma migrate dev --name add_gym_singleton` to create migration
- [ ] 1.4 Run `npx prisma generate` to regenerate Prisma client with new schema
- [ ] 1.5 Add gym upsert to `prisma/seed.ts` after user creation (use price 45000), ensure upsert behavior (use upsert, not create)

## Phase 2: API Layer

- [ ] 2.1 Create `src/app/api/gym/route.ts` with GET handler that returns singleton gym, auto-creates if not exists with price 0
- [ ] 2.2 Add PATCH handler to `src/app/api/gym/route.ts` with admin auth (copy verifyAdmin pattern from `api/feriados/route.ts`)
- [ ] 2.3 Add Zod validation for price in PATCH (positive number, required)
- [ ] 2.4 Add `revalidatePath('/informacion')` after successful PATCH update

## Phase 3: Frontend Components

- [ ] 3.1 Create `src/components/admin/gym-price-editor.tsx` as client component with states: loading, display, editing, saving, error
- [ ] 3.2 Implement fetch from GET /api/gym on component mount
- [ ] 3.3 Implement edit mode with numeric input, save/cancel buttons
- [ ] 3.4 Implement PATCH request on save with proper error handling
- [ ] 3.5 Format price using Intl.NumberFormat with es-AR locale (e.g., "$45.000")
- [ ] 3.6 Add loading skeleton state while fetching

## Phase 4: Integration

- [ ] 4.1 Add GymPriceEditor component to `src/app/admin/page.tsx` (add new "Configuración" section or integrate into existing layout)
- [ ] 4.2 Modify `src/app/informacion/page.tsx` to fetch price from GET /api/gym instead of hardcoded "$45.000"
- [ ] 4.3 Use Intl.NumberFormat es-AR for displaying price in informacion page
- [ ] 4.4 Add Suspense wrapper with skeleton for informacion page price section
- [ ] 4.5 Search for any remaining hardcoded prices in codebase (grep for "45.000" or "$45000") and remove

## Phase 5: Verification

- [ ] 5.1 Run TypeScript type check: `npx tsc --noEmit`
- [ ] 5.2 Run ESLint: `npm run lint`
- [ ] 5.3 Test GET /api/gym returns 200 with gym object
- [ ] 5.4 Test GET /api/gym auto-creates gym when none exists (should return default price 0)
- [ ] 5.5 Test PATCH /api/gym returns 401 without session
- [ ] 5.6 Test PATCH /api/gym returns 403 for non-admin user
- [ ] 5.7 Test PATCH /api/gym returns 400 for negative price
- [ ] 5.8 Test PATCH /api/gym returns 200 and updates price for admin
- [ ] 5.9 Verify informacion page displays price from API
- [ ] 5.10 Verify admin page allows editing and persists price
- [ ] 5.11 Verify no hardcoded "$45.000" exists in source files

## Implementation Notes

### Dependency Order
Database changes (Phase 1) MUST complete before API (Phase 2) can be tested, as the API depends on the Prisma schema. Frontend (Phase 3) depends on API being functional. Integration (Phase 4) brings everything together.

### Key Files
- `prisma/schema.prisma` - Gym model, Feriado modification
- `prisma/seed.ts` - Gym upsert
- `src/app/api/gym/route.ts` - GET/PATCH endpoints
- `src/components/admin/gym-price-editor.tsx` - Admin editor component
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/informacion/page.tsx` - Public info page

### Decimal Handling
Prisma returns Decimal as a Decimal.js object. Convert to number for JSON API response: `Number(gym.price)` or use `.toNumber()`.
