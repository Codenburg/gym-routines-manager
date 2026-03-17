# Security Specification

## Purpose

This specification defines the security requirements for the application, including authentication bypass protection, input validation, authorization, and session management.

---

## Requirements

### Requirement: Auth Bypass Protection

The system MUST protect all `/admin/*` routes from unauthenticated and non-admin authenticated users.

#### Scenario: Unauthenticated user accessing /admin

- GIVEN user is not authenticated (no session cookie)
- WHEN user attempts to access `/admin/dashboard`
- THEN server MUST return HTTP 302 redirect to `/admin/login`

#### Scenario: Unauthenticated user accessing /admin/rutinas

- GIVEN user is not authenticated (no session cookie)
- WHEN user attempts to access `/admin/rutinas`
- THEN server MUST return HTTP 302 redirect to `/admin/login`

#### Scenario: Authenticated non-admin user accessing /admin/dashboard

- GIVEN user is authenticated with regular user account (non-admin)
- WHEN user attempts to access `/admin/dashboard`
- THEN server MUST either:
  - Return HTTP 403 Forbidden, OR
  - Return HTTP 302 redirect to login with "access denied" message

#### Scenario: Authenticated non-admin user accessing /admin/rutinas

- GIVEN user is authenticated with regular user account (non-admin)
- WHEN user attempts to access `/admin/rutinas`
- THEN server MUST either:
  - Return HTTP 403 Forbidden, OR
  - Return HTTP 302 redirect to login with "access denied" message

#### Scenario: Server action called without session

- GIVEN user is not authenticated (no session headers)
- WHEN user calls server action `createRutina` via form submission
- THEN server MUST return `{ success: false, message: "Debes iniciar sesión" }`

#### Scenario: Server action called with non-admin session

- GIVEN user is authenticated with regular user account (non-admin)
- WHEN user calls server action `createRutina` via form submission
- THEN server MUST return `{ success: false, message: "No tienes permisos de administrador" }`

#### Scenario: API endpoint called without authentication

- GIVEN user is not authenticated (no session cookie)
- WHEN user calls API endpoint `/api/rutinas` with POST method
- THEN server MUST return HTTP 401 Unauthorized

#### Scenario: API endpoint called with non-admin session

- GIVEN user is authenticated with regular user account (non-admin)
- WHEN user calls API endpoint `/api/rutinas` with POST method
- THEN server MUST return HTTP 403 Forbidden

#### Scenario: Cookie replay attack prevention

- GIVEN attacker obtains a valid session cookie from legitimate user
- WHEN attacker uses the cookie to access `/admin/*` routes
- THEN server MUST validate cookie belongs to admin role before granting access

### Requirement: Input Validation

The system MUST validate and sanitize all user input to prevent injection attacks.

#### Scenario: SQL injection in API query parameter

- GIVEN attacker sends malicious SQL in query parameter `?id=' OR 1=1--`
- WHEN server processes the request
- THEN server MUST return HTTP 400 Bad Request, OR sanitize the input and return safe response
- AND server MUST NOT execute the malicious SQL payload

#### Scenario: SQL injection in API POST body

- GIVEN attacker sends SQL injection payload in POST body
- WHEN server processes the request
- THEN server MUST NOT execute the malicious SQL payload
- AND server MUST return appropriate error response

#### Scenario: XSS payload in routine name field

- GIVEN attacker submits form with XSS payload `<script>alert('xss')</script>` in routine name
- WHEN admin submits the form via server action
- THEN server MUST sanitize the input before storage
- AND when the XSS payload is rendered, it MUST be escaped (not executed)

#### Scenario: XSS payload in routine description field

- GIVEN attacker submits form with XSS payload `<img src=x onerror=alert(1)>` in description
- WHEN the payload is rendered on admin page
- THEN server MUST escape HTML entities
- AND browser MUST NOT execute the JavaScript

#### Scenario: XSS payload via API endpoint

- GIVEN attacker sends XSS payload via API POST to `/api/rutinas`
- WHEN server stores the data
- THEN server MUST sanitize the input
- AND subsequent GET requests MUST return escaped content

#### Scenario: Invalid UUID format handling

- GIVEN user requests `/api/rutinas/invalid-uuid-format`
- WHEN server processes the request
- THEN server MUST return HTTP 400 Bad Request with clear error message
- AND server MUST NOT crash or expose internal errors

#### Scenario: Malformed JSON body handling

- GIVEN user sends malformed JSON in request body
- WHEN server parses the JSON
- THEN server MUST return HTTP 400 Bad Request
- AND server MUST NOT crash

#### Scenario: Empty required field handling

- GIVEN user submits form with empty required field (nombre)
- WHEN server validates the input
- THEN server MUST return validation error with specific field message

#### Scenario: Extremely long input handling

- GIVEN user submits input exceeding maximum length (e.g., 10,000 character routine name)
- WHEN server processes the input
- THEN server MUST either truncate or reject with validation error
- AND server MUST NOT crash or cause buffer overflow

#### Scenario: Special characters in input

- GIVEN user submits input with special characters (quotes, backticks, brackets)
- WHEN server processes and stores the input
- THEN server MUST properly escape special characters
- AND subsequent display MUST show correct escaped content

#### Scenario: Unicode/special encoding injection

- GIVEN user submits input with unicode escape sequences or encoding attempts
- WHEN server processes the input
- THEN server MUST normalize or reject invalid encoding
- AND MUST NOT interpret as code

#### Scenario: HTML injection attempt

- GIVEN user submits `<div onclick="alert(1)">` in text field
- WHEN the content is rendered
- THEN the HTML MUST be escaped
- AND click handlers MUST NOT execute

### Requirement: Authorization

The system MUST enforce proper authorization checks to prevent privilege escalation.

#### Scenario: verifyAdmin bypass attempt via headers

- GIVEN attacker tries to forge headers to bypass verifyAdmin()
- WHEN server validates the session
- THEN server MUST verify session cryptographically
- AND MUST NOT trust client-supplied role headers

#### Scenario: Direct server action invocation

- GIVEN attacker directly calls server action URL without going through UI
- WHEN server processes the request
- THEN server MUST perform authentication and authorization checks
- AND MUST return appropriate error if unauthorized

#### Scenario: Role manipulation attempt

- GIVEN attacker tries to modify session data to add admin role
- WHEN server validates session
- THEN server MUST cryptographically verify session integrity
- AND MUST reject tampered sessions

#### Scenario: Cross-user data access prevention

- GIVEN authenticated user tries to access another user's routine via API
- WHEN server processes the request
- THEN server MUST verify user owns or has access to the resource
- AND MUST return 403 if not authorized

#### Scenario: IDOR vulnerability prevention

- GIVEN attacker tries to access routine by guessing UUID
- WHEN server processes request for non-existent or unauthorized resource
- THEN server MUST return 404 (not 500)
- AND MUST NOT expose existence of other resources

#### Scenario: Admin-only API protection

- GIVEN regular user tries to access admin-only API endpoint
- WHEN server processes request
- THEN server MUST return 403 Forbidden

### Requirement: Session Management

The system MUST properly manage sessions to prevent session-based attacks.

#### Scenario: Expired session cookie handling

- GIVEN user has expired session cookie
- WHEN user accesses protected route
- THEN server MUST redirect to login
- AND MUST NOT grant access with expired credentials

#### Scenario: Session isolation between admin and regular user

- GIVEN user has both admin and regular user sessions simultaneously
- WHEN user accesses admin routes
- THEN server MUST use the admin session credentials
- AND regular user session MUST NOT grant admin access

#### Scenario: Concurrent session behavior

- GIVEN user logs in from two different browsers/devices
- WHEN both sessions are active
- THEN server MUST handle both sessions independently
- AND revoking one session MUST NOT affect the other (unless explicitly designed)

#### Scenario: Logout invalidates session

- GIVEN authenticated user clicks logout
- WHEN user attempts to access protected route with old session
- THEN server MUST reject the request
- AND MUST redirect to login

#### Scenario: Session fixation prevention

- GIVEN attacker tries to fix user's session ID
- WHEN user logs in
- THEN server MUST generate new session ID
- AND MUST NOT accept attacker-provided session IDs

---

## Test Coverage Summary

| Category | Requirements | Scenarios |
|----------|-------------|-----------|
| Auth Bypass | 4 | 9 |
| Input Validation | 4 | 12 |
| Authorization | 4 | 6 |
| Session Management | 4 | 5 |
| **TOTAL** | **16** | **32** |

## Acceptance Criteria

- [ ] All 32 security tests MUST pass on localhost
- [ ] Auth bypass tests correctly block unauthenticated and non-admin users
- [ ] SQL injection attempts return 400 or sanitized response
- [ ] XSS payloads are escaped and not executed in browser
- [ ] Session expiration properly redirects to login
- [ ] No false positives in authorization checks
- [ ] Tests follow existing Playwright patterns in codebase
- [ ] Tests use existing `loginAsAdmin()` and `getRoutineIds()` helpers
- [ ] Tests use credentials: admin@championgym.com / admin123
- [ ] Non-admin test user helper is created for authorization tests
