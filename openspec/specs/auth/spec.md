# Auth Specification

## Purpose

This specification defines the authentication and authorization requirements for the application, including user roles, session management, and admin access controls.

---

## Requirements

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

### Requirement: Prisma User Model

The User model MUST include an admin field for authorization.

#### Scenario: User model includes admin

- GIVEN Prisma schema is configured
- WHEN the schema is parsed
- THEN User model MUST have admin Boolean @default(false)

---

## Better Auth Username Plugin Configuration

The application uses the Better Auth username plugin to allow login with DNI (username) instead of email.

### Requirement: Account Model for Username Authentication

The Account model MUST be configured correctly for the Better Auth username plugin to query credentials properly.

#### Scenario: Username login queries account with correct providerId

- GIVEN a user attempts to sign in with username
- WHEN Better Auth's username plugin queries the account
- THEN the query looks for `providerId === 'credential'` (NOT 'username')
- AND `accountId` contains the username (DNI)

#### Scenario: Account creation for username plugin

- GIVEN a new user is created with username (DNI) for login
- WHEN the seed script or signup creates the Account record
- THEN the Account MUST have:
  - `accountId` = the username (DNI)
  - `providerId` = 'credential'
  - `providerType` = 'credential'
  - `password` = bcrypt hashed password

#### Scenario: Admin users have correct Account configuration

- GIVEN an admin user with DNI '11111111' is created
- WHEN the seed script runs
- THEN the Account record MUST be created with:
  ```typescript
  {
    userId: user.id,
    accountId: '11111111',      // DNI as accountId
    providerId: 'credential',    // NOT 'username'!
    providerType: 'credential',
    password: bcrypt_hash
  }
  ```

### Requirement: Better Auth Configuration

The Better Auth server configuration MUST include the username plugin.

#### Scenario: Auth server includes username plugin

- GIVEN the auth server is configured
- WHEN the configuration is parsed
- THEN the plugins array MUST include `username()` from 'better-auth/plugins'
- AND the client MUST include `usernameClient()` from 'better-auth/client/plugins'

#### Scenario: Username sign-in endpoint available

- GIVEN a POST request is made to `/api/auth/sign-in/username`
- WHEN the request contains valid username and password
- THEN the response MUST include `{ token: string, user: User }`
- AND a session cookie MUST be set

### Requirement: Login Form Uses Username Sign-In

The admin login form MUST use `signIn.username()` from the Better Auth client.

#### Scenario: Login form submits to username endpoint

- GIVEN a user enters DNI and password in the login form
- WHEN the form is submitted
- THEN the client calls `authClient.signIn.username({ username: dni, password })`
- AND on success, redirects to `/admin`

#### Scenario: Login displays user-friendly error

- GIVEN a user enters invalid credentials
- WHEN the username sign-in fails
- THEN the UI MUST display "DNI o contraseña incorrectos"
- AND the user MUST remain on the login page

---

## User Model Structure

### Data Model: User

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | User identifier |
| name | String | required | User's display name |
| dni | String | @unique | DNI (used for display only) |
| username | String? | @unique | Username for login (same as DNI) |
| email | String? | @unique | Optional email |
| emailVerified | Boolean | @default(false) | Email verification status |
| admin | Boolean | @default(false) | Admin flag |
| role | String | @default("user") | User role |
| banned | Boolean | @default(false) | Ban status |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

### Data Model: Account (for Better Auth)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Account identifier |
| userId | String | required | Foreign key to User |
| accountId | String | required | The username (DNI) - used for credential lookup |
| providerId | String | required | Must be 'credential' for username plugin |
| providerType | String | required | Must be 'credential' |
| password | String? | nullable | Bcrypt hashed password |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

### Data Model: Session (for Better Auth)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Session identifier |
| userId | String | required, indexed | Foreign key to User |
| token | String | @unique | Session token |
| expiresAt | DateTime | required | Expiration timestamp |
| ipAddress | String? | nullable | Client IP |
| userAgent | String? | nullable | Client user agent |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |
