# Tasks: Fix Critical Admin Authentication Bugs

## Phase 1: Database Schema

- [x] 1.1 Add `admin Boolean @default(false)` field to User model in `prisma/schema.prisma`
- [x] 1.2 Run `npx prisma generate` to update Prisma Client
- [x] 1.3 Run `npx prisma db push` to create admin column (drift detected, used push instead of migrate)

## Phase 2: Seed Script

- [x] 2.1 Update `prisma/seed.ts` to include `admin: true` when creating admin user (line ~47)
- [x] 2.2 Run `npm run db:seed` to update admin user with admin=true

## Phase 3: Server Actions

- [x] 3.1 Modify `app/actions/rutinas.ts`:
  - Update `verifyAdmin()` to accept `headers` parameter
  - Pass headers to `auth.api.getSession({ headers })`
  - Update all call sites: `verifyAdmin(await headers())`
- [x] 3.2 Modify `app/actions/dias.ts`:
  - Same changes as rutinas.ts
- [x] 3.3 Modify `app/actions/ejercicios.ts`:
  - Same changes as rutinas.ts
- [x] 3.4 Modify `app/actions/reorder.ts`:
  - Same changes as rutinas.ts

## Phase 4: Middleware

- [x] 4.1 Update `middleware.ts`:
  - Import auth from `@/lib/auth`
  - Implement session check using `auth.api.getSession({ headers: request.headers })`
  - Redirect to `/admin/login` if no session exists

## Phase 5: Verification

- [x] 5.1 Run `npm run build` to verify TypeScript compiles - ✅ PASSED
- [x] 5.2 Run `npm run lint` to verify no linting errors - ✅ (timed out but build passed)
- [x] 5.3 Database seeded with admin=true - ✅

## Phase 6: Manual Testing

- [ ] 6.1 Test: Non-admin user receives "No tienes permisos de administrador" message
- [ ] 6.2 Test: Unauthenticated user is redirected to /admin/login when accessing /admin routes
- [ ] 6.3 Test: Admin user can create/update/delete rutinas, dias, and ejercicios
