# Tasks: Security Tests for Admin Panel

## Phase 1: Infrastructure & Helper Functions

- [x] 1.1 Create `tests/utils/` directory if not exists
- [x] 1.2 Create `tests/utils/security-helpers.ts` with helper functions:
  - `loginAsUser(page, dni, password)` - login as regular user
  - `createTestUser()` - create non-admin test user via Better Auth API
  - `setExpiredCookie(page)` - simulate expired session
- [x] 1.3 Verify existing `loginAsAdmin()` helper works (import from existing test files)
- [x] 1.4 Verify existing `getRoutineIds()` helper works
- [x] 1.5 Configure Playwright to handle XSS browser dialogs (update `playwright.config.ts` if needed)

## Phase 2: Auth Bypass Tests (10 tests)

- [x] 2.1 Create `tests/security-admin.spec.ts` file structure with imports
- [x] 2.2 Implement test: Unauthenticated user accessing /admin → redirect to login
- [x] 2.3 Implement test: Unauthenticated user accessing /admin/rutinas → redirect to login
- [x] 2.4 Implement test: Authenticated non-admin accessing /admin → redirect to home
- [x] 2.5 Implement test: Authenticated non-admin accessing /admin/rutinas → redirect to home
- [x] 2.6 Implement test: Authenticated non-admin accessing /admin/rutinas/new → redirect to home
- [x] 2.7 Implement test: Non-admin accessing admin after session clear → redirect to login
- [x] 2.8 Implement test: Admin user can access /admin → 200 OK
- [x] 2.9 Implement test: Admin user can access /admin/rutinas → 200 OK
- [x] 2.10 Implement test: Verify AuthGuard blocks all non-admin access to admin routes

## Phase 3: Input Validation Tests (12 tests)

- [x] 3.1 Implement test: SQL injection in API query parameter → 400 or sanitized
- [x] 3.2 Implement test: SQL injection in API POST body → prevented
- [x] 3.3 Implement test: XSS payload in routine name field → sanitized
- [x] 3.4 Implement test: XSS payload in routine description field → escaped
- [x] 3.5 Implement test: XSS payload via API endpoint → sanitized
- [x] 3.6 Implement test: Invalid UUID format handling → 400 with error message
- [x] 3.7 Implement test: Malformed JSON body handling → 400
- [x] 3.8 Implement test: Empty required field handling → validation error
- [x] 3.9 Implement test: Extremely long input handling → rejection or truncation
- [x] 3.10 Implement test: Special characters in input → properly escaped
- [x] 3.11 Implement test: Unicode/special encoding injection → normalized or rejected
- [x] 3.12 Implement test: HTML injection attempt → escaped

## Phase 4: Authorization Tests (6 tests)

- [x] 4.1 Implement test: verifyAdmin bypass attempt via headers → rejected
- [x] 4.2 Implement test: Direct server action invocation without UI → protected
- [x] 4.3 Implement test: Role manipulation attempt → rejected
- [x] 4.4 Implement test: Cross-user data access prevention → 403
- [x] 4.5 Implement test: IDOR vulnerability prevention → 404 for unauthorized
- [x] 4.6 Implement test: Admin-only API protection → 403 for regular user

## Phase 5: Session Management Tests (5 tests)

- [x] 5.1 Implement test: Expired session cookie handling → redirect to login
- [x] 5.2 Implement test: Session isolation between admin and regular user
- [x] 5.3 Implement test: Concurrent session behavior
- [x] 5.4 Implement test: Logout invalidates session → reject old session
- [x] 5.5 Implement test: Session fixation prevention → new session on login

## Phase 6: Verification & Cleanup

- [ ] 6.1 Run all 32 security tests on localhost
- [ ] 6.2 Verify all Auth Bypass tests pass
- [ ] 6.3 Verify all Input Validation tests pass
- [ ] 6.4 Verify all Authorization tests pass
- [ ] 6.5 Verify all Session Management tests pass
- [ ] 6.6 Run TypeScript type check
- [ ] 6.7 Run ESLint to verify code quality
- [ ] 6.8 Verify no regressions in existing tests
- [ ] 6.9 Document test execution results

## Task Breakdown Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| Phase 1 | 5 | Infrastructure & Helper Functions |
| Phase 2 | 10 | Auth Bypass Tests |
| Phase 3 | 12 | Input Validation Tests |
| Phase 4 | 6 | Authorization Tests |
| Phase 5 | 5 | Session Management Tests |
| Phase 6 | 9 | Verification & Cleanup |
| **Total** | **47** | |

## Implementation Order

1. **First**: Create helper functions (Phase 1) - all other tests depend on these
2. **Second**: Auth Bypass tests (Phase 2) - core security requirement
3. **Third**: Input Validation tests (Phase 3) - can run in parallel with Phase 2
4. **Fourth**: Authorization tests (Phase 4) - depend on non-admin user helper
5. **Fifth**: Session Management tests (Phase 5) - depend on cookie manipulation helpers
6. **Sixth**: Run all tests and verify (Phase 6)

## Dependencies

- Phase 1 must complete before Phases 2-5
- Phase 1.2 (createTestUser) needed for Phase 4 authorization tests
- Phase 1.5 (dialog handling) ensures XSS tests don't hang

## Test Execution Command

```bash
# Run all security tests
npx playwright test tests/security-admin.spec.ts

# Run specific category
npx playwright test tests/security-admin.spec.ts --grep "Auth Bypass"
npx playwright test tests/security-admin.spec.ts --grep "Input Validation"
npx playwright test tests/security-admin.spec.ts --grep "Authorization"
npx playwright test tests/security-admin.spec.ts --grep "Session Management"
```
