# Delta for Admin Auth Fix

## ADDED Requirements

### Requirement: User.admin Boolean Field

The User model in the database MUST have an `admin` boolean field with a default value of `false`.

The system MUST store admin status in the database.

#### Scenario: User record has admin field

- GIVEN the Prisma schema is updated with admin field
- WHEN a User record is queried
- THEN the record MUST include an `admin` boolean field
- AND the field MUST default to `false` if not specified

#### Scenario: Admin user created with admin=true

- GIVEN the seed script includes admin: true
- WHEN the database is seeded
- THEN the admin user record MUST have admin set to `true`
- AND regular users MUST have admin set to `false`

### Requirement: Server Actions Admin Verification

All server actions that require admin privileges MUST verify both authentication and admin status by passing headers to `auth.api.getSession()`.

The system MUST fail gracefully when session verification fails.

#### Scenario: verifyAdmin receives valid headers

- GIVEN a server action calls verifyAdmin with headers
- WHEN auth.api.getSession({ headers }) is executed
- THEN the session MUST be validated using the provided headers
- AND the action MUST proceed if user.admin is true

#### Scenario: verifyAdmin receives no headers

- GIVEN a server action calls verifyAdmin without headers
- WHEN auth.api.getSession() is executed
- THEN the session check MUST fail (cookies not sent)
- AND the action MUST return unauthorized error

#### Scenario: User is authenticated but not admin

- GIVEN a user is logged in with admin=false
- WHEN they call an admin-only server action
- THEN the action MUST return "No tienes permisos de administrador"
- AND the operation MUST NOT be executed

### Requirement: Middleware Auth Protection

The middleware MUST protect `/admin` routes by verifying session existence before allowing access.

Unauthenticated users MUST be redirected to `/admin/login`.

#### Scenario: Authenticated user accesses /admin

- GIVEN a user has a valid session cookie
- WHEN they navigate to /admin
- THEN the middleware MUST allow the request to proceed
- AND the page MUST render normally

#### Scenario: Unauthenticated user accesses /admin

- GIVEN no session cookie exists
- WHEN they navigate to /admin
- THEN the middleware MUST redirect to /admin/login
- AND the original request MUST NOT be processed

## MODIFIED Requirements

### Requirement: Prisma User Model

The User model MUST include an admin field for authorization.

(Previously: No admin field existed, authorization was impossible)

#### Scenario: User model includes admin

- GIVEN Prisma schema is configured
- WHEN the schema is parsed
- THEN User model MUST have admin Boolean @default(false)
