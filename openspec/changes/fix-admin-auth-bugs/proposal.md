# Proposal: Fix Critical Admin Authentication Bugs

## Intent

Fix three critical bugs that completely break admin authentication in the application:

1. **Bug 1**: Server actions (`rutinas.ts`, `dias.ts`, `ejercicios.ts`, `reorder.ts`) call `auth.api.getSession()` without passing `headers` - the session check always fails because cookies aren't sent
2. **Bug 2**: Prisma User model lacks an `admin` boolean field - admin check `user?.admin` is always `undefined`
3. **Bug 3**: Middleware is completely disabled (no-op returning `NextResponse.next()`) - no auth protection at route level

## Scope

### In Scope
- Add `admin` boolean field to User model in `prisma/schema.prisma`
- Add `admin: true` to admin user creation in `prisma/seed.ts`
- Fix `verifyAdmin()` function in all server actions to pass headers to `auth.api.getSession()`
- Re-enable middleware with proper session checking and redirect for unauthenticated users

### Out of Scope
- Any UI changes to admin pages
- Additional admin roles or permissions beyond boolean flag
- Session refresh token logic

## Approach

1. **Database Schema**: Add `admin Boolean @default(false)` to User model
2. **Seed Script**: Update admin user creation to include `admin: true`
3. **Server Actions**: Modify verifyAdmin() to use `auth.api.getSession({ headers })` with proper headers passed from the server action context
4. **Middleware**: Implement proper auth checking that redirects unauthenticated users to login

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `admin` field to User model |
| `prisma/seed.ts` | Modified | Add `admin: true` to admin user |
| `app/actions/rutinas.ts` | Modified | Fix verifyAdmin() to pass headers |
| `app/actions/dias.ts` | Modified | Fix verifyAdmin() to pass headers |
| `app/actions/ejercicios.ts` | Modified | Fix verifyAdmin() to pass headers |
| `app/actions/reorder.ts` | Modified | Fix verifyAdmin() to pass headers |
| `middleware.ts` | Modified | Re-enable with proper auth checking |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking database migration | Medium | Generate new migration, test on dev DB first |
| Cookie/headers not working in server actions | Low | Test thoroughly after fix |
| Middleware causing redirect loops | Low | Test with clean browser session |

## Rollback Plan

1. Revert `prisma/schema.prisma` - remove `admin` field
2. Revert `prisma/seed.ts` - remove `admin` from create
3. Revert all server actions - remove headers parameter
4. Revert `middleware.ts` - return to `NextResponse.next()`

## Dependencies

- Requires running `npx prisma generate` and `npx prisma migrate dev` after schema change
- Requires re-seeding database to create admin user with admin=true

## Success Criteria

- [ ] Admin user can create/update/delete rutinas from admin panel
- [ ] Admin user can create/update/delete dias from admin panel  
- [ ] Admin user can create/update/delete ejercicios from admin panel
- [ ] Non-admin users receive "No tienes permisos de administrador" message
- [ ] Unauthenticated users are redirected to login from /admin routes
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
