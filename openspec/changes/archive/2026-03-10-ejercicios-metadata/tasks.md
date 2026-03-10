# Tasks: Metadata de Series y Repeticiones

## Phase 1: Schema y Migration

- [x] 1.1 Modify `prisma/schema.prisma` to add series and repes fields to Ejercicio model
  - Add `series String?` (optional)
  - Add `repes String?` (optional)
  - Both should be nullable

- [x] 1.2 Create Prisma migration
  - Run `npx prisma migrate dev --name add_ejercicio_metadata`

- [x] 1.3 Regenerate Prisma client
  - Run `npx prisma generate`

## Phase 2: Seed Data

- [x] 2.1 Update `prisma/seed.ts` to include series and repes
  - Add realistic values like "3x12", "4x10", "3x12 - 1x10"
  - Vary the values per exercise type

- [x] 2.2 Run seed to populate new data
  - Run `npm run db:seed`

## Phase 3: API Updates

- [x] 3.1 Update `app/api/rutinas/[id]/route.ts`
  - Include series and repes in ejercicio response

- [x] 3.2 Update `app/api/rutinas/[id]/dias/[diaId]/route.ts`
  - Include series and repes in ejercicio response

## Phase 4: UI Updates

- [x] 4.1 Update `app/rutinas/[id]/page.tsx`
  - Display series x repes format for each ejercicio
  - Show "NxN" or "NxN - NxN" format

- [x] 4.2 Update `app/rutinas/[id]/dias/[diaId]/page.tsx`
  - Display series x repes format for each ejercicio

## Phase 5: Testing

- [x] 5.1 Run existing tests to ensure no regressions
- [x] 5.2 Verify data displays correctly in browser

## Phase 6: Verification

- [x] 6.1 Run TypeScript type check
- [x] 6.2 Run ESLint
- [x] 6.3 Run playwright tests
- [x] 6.4 Manual verification:
  - Check API response includes series/repes
  - Check UI displays "3x12" format correctly
