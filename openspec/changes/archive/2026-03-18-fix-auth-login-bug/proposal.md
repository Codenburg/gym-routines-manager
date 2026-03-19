# Proposal: Fix Admin Login - Better Auth Account Configuration

## Intent

Fix a critical bug where admin login was failing with 401 "Invalid username or password" even with correct credentials.

**Root Cause**: The seed script was creating Account records with `providerId: 'username'`, but Better Auth's username plugin queries accounts with `providerId: 'credential'`.

**Problem**: After switching to Better Auth's username plugin, the login always failed because:
1. The username plugin queries: `WHERE providerId = 'credential' AND userId = ?`
2. But seed was storing: `providerId: 'username'`

This caused a silent mismatch where the user was found but no matching account with `providerId: 'credential'` existed.

## Scope

### In Scope
- Fix Account creation in seed to use `providerId: 'credential'`
- Verify login works end-to-end
- Run admin E2E tests to verify fix

### Out of Scope
- No changes to auth.ts configuration
- No changes to login page UI
- No changes to Prisma schema

## Approach

**The Fix**: Change `providerId` from `'username'` to `'credential'` in seed.ts Account creation:

```typescript
// Before (broken):
providerId: 'username'

// After (working):
providerId: 'credential'
```

**Note**: The `accountId` correctly stores the DNI (username), which is correct.

### Why This Happens

Better Auth's username plugin is designed to be compatible with the standard credential provider pattern. It queries for accounts with `providerId = 'credential'` to find password credentials, even when using username-based authentication.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/seed.ts` | Modified | Changed `providerId: 'username'` to `providerId: 'credential'` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| None | - | Simple one-word fix in seed |

## Rollback Plan

Revert the `providerId` change in seed.ts and re-run seed.

## Success Criteria

- [x] `POST /api/auth/sign-in/username` returns 200 with token and user
- [x] Admin E2E test 8.1.1 passes (login redirects to dashboard)
- [x] All other admin tests pass with proper login

## Discovery Notes

**Critical Finding**: Better Auth username plugin configuration:
- `providerId` MUST be `'credential'` (not the plugin name `'username'`)
- `accountId` stores the actual username value (DNI)
- This is because the plugin queries accounts looking for `providerId === 'credential'`

This is documented in the auth spec update.
