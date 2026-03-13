# Design: Fix Critical Admin Authentication Bugs

## Technical Approach

This fix addresses three critical auth bugs by:
1. Adding `admin` boolean field to User model in Prisma schema
2. Modifying server actions' `verifyAdmin()` to pass headers to `auth.api.getSession()`
3. Re-enabling middleware with proper session checking

## Architecture Decisions

### Decision: Use Prisma schema for admin field

**Choice**: Add `admin Boolean @default(false)` to User model
**Alternatives considered**: Use custom session claims, environment variables, separate admin table
**Rationale**: Simplest approach - better-auth supports arbitrary fields on User model via Prisma. Default `false` ensures no accidental admin access.

### Decision: Pass headers to getSession in server actions

**Choice**: Modify verifyAdmin to accept and pass headers parameter
**Alternatives considered**: Use cookies() from next/headers, create separate auth utility
**Rationale**: Direct fix - the bug is that cookies aren't sent. Passing headers explicitly is explicit and testable.

### Decision: Use middleware for route-level protection

**Choice**: Implement session check in middleware.ts
**Alternatives considered**: Rely only on client-side AuthGuard, use Next.js middleware redirects
**Rationale**: Defense in depth - middleware runs before page rendering, preventing unauthorized content from being sent.

## Data Flow

```
Request → Middleware → auth.api.getSession({ headers }) → Response
                      ↓
              No session → Redirect /admin/login
              Has session → Allow request
```

```
Server Action → verifyAdmin(headers) → auth.api.getSession({ headers })
                                            ↓
                                    Check user.admin === true
                                            ↓
                                    Proceed or Return Error
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `admin Boolean @default(false)` to User model |
| `prisma/seed.ts` | Modify | Add `admin: true` to admin user creation (line ~47) |
| `app/actions/rutinas.ts` | Modify | Pass headers to verifyAdmin in all functions |
| `app/actions/dias.ts` | Modify | Pass headers to verifyAdmin in all functions |
| `app/actions/ejercicios.ts` | Modify | Pass headers to verifyAdmin in all functions |
| `app/actions/reorder.ts` | Modify | Pass headers to verifyAdmin in all functions |
| `middleware.ts` | Modify | Implement proper session checking and redirect |

## Implementation Details

### 1. Prisma Schema Change

```prisma
model User {
  id             String    @id @default(uuid())
  name           String
  email          String    @unique
  emailVerified  Boolean
  image          String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  admin          Boolean   @default(false)  // NEW FIELD

  sessions       Session[]
  accounts       Account[]
}
```

### 2. Server Action verifyAdmin

```typescript
// In each server action file, change:
async function verifyAdmin(): Promise<...> {

// To:
async function verifyAdmin(headers: Headers): Promise<...> {
  const session = await auth.api.getSession({ headers });  // Pass headers!
  // ... rest of logic
}

// And update all call sites:
const authCheck = await verifyAdmin(headers());
```

### 3. Middleware Implementation

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Server actions reject non-admin | Create non-admin user, try CRUD operations |
| Manual | Middleware redirects unauthenticated | Clear cookies, visit /admin |
| Manual | Admin user can perform all operations | Login as admin, test CRUD |
| Build | TypeScript compiles | Run `npx tsc --noEmit` |
| Lint | ESLint passes | Run `npm run lint` |

## Migration / Rollout

1. Run `npx prisma generate` to update Prisma Client
2. Run `npx prisma migrate dev` to add admin column
3. Run `npx prisma db seed` to create admin user with admin=true
4. Deploy changes to server actions and middleware

No feature flags required - this is a bug fix.

## Open Questions

- None - the approach is straightforward
