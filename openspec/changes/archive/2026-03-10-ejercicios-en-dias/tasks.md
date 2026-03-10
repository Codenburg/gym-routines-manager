# Tasks: Ejercicios en Días de Rutina

## Phase 1: Seed Data (Foundation)

- [x] 1.1 Update `prisma/seed.ts` to add ejercicios to each day
  - Add 3-5 exercises per day with realistic gym exercise names
  - Set orden field sequentially (1, 2, 3...)
  - Include different muscle group exercises per day type

## Phase 2: API Implementation

- [x] 2.1 Create `app/api/rutinas/[id]/dias/[diaId]/route.ts`
  - Implement GET handler for single day with ejercicios
  - Include validation for routine ID matching day
  - Return 404 if day not found
  - Handle 500 errors gracefully

## Phase 3: UI - Make Day Cards Clickable

- [x] 3.1 Modify `app/rutinas/[id]/page.tsx`
  - Wrap day cards in Next.js Link component
  - Link to `/rutinas/[id]/dias/[diaId]`
  - Add cursor-pointer and hover styles for clickable appearance
  - Show exercise count per day (e.g., "5 ejercicios")

## Phase 4: UI - Day Detail Page

- [x] 4.1 Create `app/rutinas/[id]/dias/[diaId]/page.tsx`
  - Fetch day data via API
  - Display day name as heading
  - Display muscle groups (if set)
  - Display exercise list ordered by orden field
  - Show empty state if no exercises
  - Add back button linking to parent routine

## Phase 5: Testing

- [x] 5.1 Write API tests for `GET /api/rutinas/[id]/dias/[diaId]`
  - Test 200 response with correct structure
  - Test 404 for non-existent day
  - Test 500 for server errors
  - Test ordering of exercises

- [x] 5.2 Write E2E tests for day detail page
  - Test navigation from routine detail to day detail
  - Test exercise list display
  - Test empty state
  - Test back navigation

- [x] 5.3 Update existing tests if needed
  - Update routine detail tests to reflect new clickable behavior

## Phase 6: Verification

- [x] 6.1 Run TypeScript type check
- [x] 6.2 Run ESLint
- [x] 6.3 Run playwright tests
- [x] 6.4 Manual verification:
  - Navigate to a routine detail page
  - Click on a day card
  - Verify day detail page shows exercises
  - Click back and verify returns to routine
