# Proposal: Security Tests for Admin Panel

## Intent

Implement comprehensive security tests to validate that the admin panel properly protects against auth bypass, input validation vulnerabilities, and session management issues. The current middleware only checks for session cookie existence without verifying admin role, leaving `/admin/*` routes accessible to any authenticated user. Additionally, no security tests exist to catch XSS, SQL injection, CSRF, or other attack vectors.

## Scope

### In Scope
- **Auth Bypass Tests**: Middleware redirects unauthenticated users, non-admin authenticated users cannot access `/admin/*`, server actions return 403 without valid admin session
- **Input Validation Tests**: SQL injection in API params, XSS payloads in forms, invalid UUIDs handling, malformed JSON
- **Authorization Tests**: Replay attacks with stolen cookies, bypass attempts on verifyAdmin()
- **Session Tests**: Session expiration handling, concurrent session behavior

### Out of Scope
- Rate limiting implementation (separate feature)
- Performance testing
- Load testing
- Penetration testing tools integration

## Approach

Create new Playwright test file `tests/security-admin.spec.ts` following existing patterns:
- Use `test.describe` groups for each security category
- Reuse existing `loginAsAdmin()` helper and `ADMIN_EMAIL`/`ADMIN_PASSWORD` constants
- Use `page.request` for API security testing
- Add a non-admin test user helper for authorization testing

### Test Categories

1. **Auth Bypass (9 tests)**
   - Unauthenticated access to /admin/* returns 302 to login
   - Authenticated non-admin user accessing /admin/* gets redirect or 403
   - Server action called without session returns error
   - API endpoint called without auth returns 401

2. **Input Validation (12 tests)**
   - SQL injection in `/api/rutinas?id=' OR 1=1--`
   - XSS payload in routine name `<script>alert('xss')</script>`
   - Invalid UUID format handling
   - Malformed JSON body handling
   - Empty/invalid parameters

3. **Authorization (6 tests)**
   - Cookie replay with valid session but non-admin user
   - Direct server action invocation without headers
   - verifyAdmin bypass attempts

4. **Session Management (5 tests)**
   - Expired session cookie handling
   - Concurrent session detection
   - Session isolation between admin and regular user

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `tests/security-admin.spec.ts` | New | Comprehensive security test suite |
| `tests/` (fixtures) | Modified | Add non-admin user helper functions |
| `middleware.ts` | Tested | Verify auth bypass protection |
| `app/actions/*.ts` | Tested | Verify server action authorization |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests may be flaky due to timing | Medium | Use explicit waits, retry mechanisms |
| SQL injection may affect test DB | Low | Tests are read-only, use parameterization |
| XSS tests may trigger browser alerts | Low | Configure Playwright to handle dialogs |

## Rollback Plan

1. Delete `tests/security-admin.spec.ts`
2. Remove any helper functions added to test fixtures
3. Revert no changes to production code (tests only add coverage)

## Dependencies

- Playwright E2E testing infrastructure (already present)
- Existing admin credentials: admin@championgym.com / admin123
- Non-admin test user account (create in test setup or use existing)

## Success Criteria

- [ ] All 32 security tests pass on localhost
- [ ] Auth bypass tests correctly block non-admin users
- [ ] SQL injection attempts return 400 or sanitized response
- [ ] XSS payloads are escaped and not executed
- [ ] Session expiration properly redirects to login
- [ ] No false positives in authorization checks
- [ ] Tests follow existing pattern conventions in codebase