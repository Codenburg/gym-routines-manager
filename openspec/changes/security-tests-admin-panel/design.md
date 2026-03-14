# Design: Security Tests for Admin Panel

## Technical Approach

Implement comprehensive security tests using Playwright E2E testing framework. Tests will be organized into 4 categories matching the spec requirements, reusing existing helper functions and following established test patterns from `admin-e2e.spec.ts` and `admin-panel.spec.ts`.

The approach leverages:
- Existing `loginAsAdmin()` helper for authenticated admin tests
- Existing `getRoutineIds()` helper for routine-specific tests
- Playwright's `page.request` API for API security testing
- Non-admin test user fixture for authorization testing

## Architecture Decisions

### Decision: Test File Organization

**Choice**: Single test file `tests/security-admin.spec.ts` with test.describe groups
**Alternatives considered**: Multiple files by category, separate helper files
**Rationale**: Single file keeps related tests together, matches existing pattern in codebase (admin-e2e.spec.ts has 8 test groups). Test.describe blocks provide natural categorization and shared context.

### Decision: Non-Admin User Creation Strategy

**Choice**: Create non-admin user in test setup using Better Auth sign-up API
**Alternatives considered**: 
- Seed script with pre-created users
- Use existing test user if available
- Mock user session
**Rationale**: Using actual auth flow ensures tests validate real behavior. Better Auth provides sign-up endpoint. Tests will create user on first run and reuse in subsequent tests.

### Decision: SQL Injection Test Approach

**Choice**: Send payloads via API endpoint using page.request, expect 400 or sanitized response
**Alternatives considered**: Test via UI form submission
**Rationale**: API testing is more direct and faster. Tests verify server-side validation, not UI handling. All existing tests use `page.request` for API validation.

### Decision: XSS Test Verification

**Choice**: Submit payload via admin form, then verify escaped output via page content
**Alternatives considered**: Check raw API response
**Rationale**: XSS is only a vulnerability when rendered in browser. Testing via admin UI simulates real admin workflow. Playwright can verify content is escaped.

### Decision: Session Expiration Testing

**Choice**: Test by manipulating cookie expiration or using invalid/expired session token
**Alternatives considered**: Wait for actual expiration (impractical)
**Rationale**: Playwright allows cookie manipulation. Setting expired cookie simulates session timeout without waiting.

## Data Flow

```
Security Test Execution Flow:
┌─────────────────────────────────────────────────────────────┐
│                    security-admin.spec.ts                    │
├─────────────────────────────────────────────────────────────┤
│  test.describe('Auth Bypass') ──→ Middleware + Server       │
│  test.describe('Input Validation') ──→ API + Forms         │
│  test.describe('Authorization') ──→ verifyAdmin + Sessions   │
│  test.describe('Session Management') ──→ Cookies + Auth    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Helper Functions                          │
├─────────────────────────────────────────────────────────────┤
│  loginAsAdmin(page) ──→ Authenticate as admin               │
│  loginAsUser(page) ────→ Authenticate as regular user       │
│  getRoutineIds(page) ─→ Get valid routine IDs for testing   │
│  createTestUser() ─────→ Create non-admin test user         │
│  setExpiredCookie() ──→ Simulate expired session            │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `tests/security-admin.spec.ts` | Create | Main security test file with 32 tests across 4 categories |
| `tests/utils/security-helpers.ts` | Create | Helper functions: loginAsUser, createTestUser, setExpiredCookie |
| `tests/admin-e2e.spec.ts` | No Change | Verify existing loginAsAdmin still works |
| `tests/admin-panel.spec.ts` | No Change | Verify existing getRoutineIds still works |

### Test File Structure

```typescript
// tests/security-admin.spec.ts

// Constants
const ADMIN_EMAIL = 'admin@championgym.com';
const ADMIN_PASSWORD = 'admin123';
const NON_ADMIN_EMAIL = 'testuser@test.com';
const NON_ADMIN_PASSWORD = 'testuser123';

// Helper imports
import { loginAsAdmin } from './utils/security-helpers';

// ============================================
// Auth Bypass Tests (9 tests)
// ============================================
test.describe('Auth Bypass', () => {
  // 9 tests covering unauthenticated, non-admin, and server action access
});

// ============================================
// Input Validation Tests (12 tests)
// ============================================
test.describe('Input Validation', () => {
  // 12 tests covering SQLi, XSS, invalid UUIDs, malformed JSON
});

// ============================================
// Authorization Tests (6 tests)
// ============================================
test.describe('Authorization', () => {
  // 6 tests covering verifyAdmin bypass, IDOR, role manipulation
});

// ============================================
// Session Management Tests (5 tests)
// ============================================
test.describe('Session Management', () => {
  // 5 tests covering expiration, concurrent sessions, logout
});
```

## Interfaces / Contracts

### Test Helper Functions

```typescript
// tests/utils/security-helpers.ts

/**
 * Login as admin user (existing, reused from admin-e2e.spec.ts)
 */
export async function loginAsAdmin(page: Page): Promise<void>

/**
 * Login as non-admin regular user
 */
export async function loginAsUser(page: Page, email: string, password: string): Promise<void>

/**
 * Create a non-admin test user
 * Returns { email, password } of created user
 */
export async function createTestUser(): Promise<{ email: string; password: string }>

/**
 * Set expired session cookie to simulate session timeout
 */
export async function setExpiredCookie(page: Page): Promise<void>

/**
 * Get routine IDs for testing (existing, reused from admin-panel.spec.ts)
 */
export async function getRoutineIds(page: Page): Promise<Record<string, any>>
```

### Test Credentials

| User Type | Email | Password | Admin Flag |
|-----------|-------|----------|------------|
| Admin | admin@championgym.com | admin123 | true |
| Test User | testuser@test.com | testuser123 | false |

### Expected Test Results

All tests MUST pass with these expected behaviors:
- Auth Bypass: 302 redirects for unauthenticated, 403 for non-admin
- Input Validation: 400 for invalid input, sanitized XSS output
- Authorization: 403 for unauthorized access attempts
- Session: Redirect to login for expired/invalid sessions

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E | All 32 security scenarios | Playwright tests in security-admin.spec.ts |
| Integration | Middleware auth check | Verified via browser navigation tests |
| Integration | Server action authorization | Verified via form submission tests |

### Test Execution

```bash
# Run all security tests
npx playwright test tests/security-admin.spec.ts

# Run specific category
npx playwright test tests/security-admin.spec.ts --grep "Auth Bypass"

# Run with UI
npx playwright test tests/security-admin.spec.ts --ui
```

## Migration / Rollback

No migration required. This change only adds test files:
- Rollback: Delete test files
- No database changes
- No production code changes
- Tests can run independently

## Open Questions

- [x] How to create non-admin user? → Use Better Auth sign-up API in test setup
- [x] Where to store helper functions? → Create tests/utils/security-helpers.ts
- [x] How to test session expiration? → Manipulate cookie expiration via Playwright
- [x] How to handle XSS browser dialogs? → Playwright auto-handles dialogs, configure to accept

## Dependencies

- Playwright installed (existing)
- Better Auth configured (existing)
- Test database available (existing)
- Admin credentials exist: admin@championgym.com / admin123

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests flaky due to timing | Medium | Medium | Use explicit waits, retry logic |
| SQL injection affects test DB | Low | High | Tests are read-only, use parameterized queries |
| XSS triggers browser alerts | Low | Low | Configure Playwright to auto-accept dialogs |
| Non-admin user creation fails | Medium | High | Add graceful fallback, use existing user if available |
