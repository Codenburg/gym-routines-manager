---
name: nextjs-auth-server-side
description: >
  Server-side authentication pattern for Next.js App Router with Better Auth.
  Trigger: When implementing login, auth, session, or protecting routes with Next.js.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Implementing login/authentication flow
- Protecting admin routes or pages
- Fixing auth flicker issues (UI flashes before validation)
- Setting up Better Auth with Prisma
- Need server-side session validation

## Critical Patterns

### Security Principle: Never Trust Client

```
┌─────────────────────────────────────────────────────────────────┐
│  SECURITY MUST BE SERVER-SIDE                                    │
│                                                                 │
│  ❌ DON'T: Validate auth in client with useSession + redirect   │
│  ✅ DO: Validate in middleware → server layout → server actions │
└─────────────────────────────────────────────────────────────────┘
```

### Three-Layer Validation Architecture

| Layer | Type | Purpose |
|-------|------|---------|
| **Middleware** | Edge | First gate - validate session on every request |
| **Server Layout** | Server Component | Second gate - validate before any render |
| **Server Actions** | Server | Third gate - validate before any operation |

### Route Group Structure

```
app/
├── (public)/              ← Public layout (Footer, ThemeProvider)
│   └── page.tsx          → /
│
├── (auth)/                ← Auth layout (NO validation - login is public)
│   └── admin/login/      → /admin/login
│
├── (admin)/               ← Admin layout WITH validation
│   └── admin/
│       ├── layout.tsx    → validates session + admin OR redirect
│       └── page.tsx      → /admin
│
└── layout.tsx            → Root layout
```

## Implementation Steps

### 1. Configure Better Auth (src/lib/auth.ts)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { username } from "better-auth/plugins";
import bcrypt from "bcrypt";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => await bcrypt.hash(password, 12),
      verify: async ({ hash, password }) => await bcrypt.compare(password, hash),
    },
  },
  plugins: [username(), admin()],
  user: {
    additionalFields: { admin: { type: "boolean", defaultValue: false } },
  },
  session: { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
});
```

### 2. Create Middleware with Real Session Validation (middleware.ts)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths - allow without validation
  if (pathname === "/admin/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Admin routes - validate REAL session
  if (pathname.startsWith("/admin")) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const user = session.user as { admin?: boolean } | undefined;
    if (!user?.admin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 3. Create Admin Server Layout with Validation (app/(admin)/admin/layout.tsx)

```typescript
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminLayoutComponent } from "@/components/admin/admin-layout";

export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/admin/login");
  }

  const user = session.user as { admin?: boolean; name?: string } | undefined;
  if (!user?.admin) {
    redirect("/");
  }

  return (
    <AdminLayoutComponent username={user.name || "Admin"}>
      {children}
    </AdminLayoutComponent>
  );
}
```

### 4. Create Simple Auth Layout for Login (app/(auth)/admin/login/layout.tsx)

```typescript
// NO validation here - login must be public!
export default function AuthLayout({ children }) {
  return <>{children}</>;
}
```

### 5. Update AdminLayoutComponent (src/components/admin/admin-layout.tsx)

```typescript
"use client";

interface AdminLayoutProps {
  children: React.ReactNode;
  username: string; // Received from server - already validated
}

export function AdminLayout({ children, username }: AdminLayoutProps) {
  // UI interactivity only - no auth logic here!
  // Session was already validated in server layout
}
```

### 6. Server Actions Validation Pattern

```typescript
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function protectedAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { error: "Debes iniciar sesión" };
  }

  const user = session.user as { admin?: boolean } | undefined;
  if (!user?.admin) {
    return { error: "No tienes permisos" };
  }

  // Execute protected operation
  // ...
}
```

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| AuthGuard in client components | Validate in middleware + server layout |
| Check `useSession()` for security | Server-side `auth.api.getSession()` |
| Validate in page component | Validate in layout (runs first) |
| Separate `admin` layout from login | Use route groups to separate |
| Store sensitive data in client | Server actions for all mutations |

## Common Issues

### Login Loop (Infinite Redirect)

**Cause**: Login page inherits admin layout that validates session.

**Solution**: Use separate route group `(auth)` for login:

```
app/(auth)/admin/login/    ← simple layout, no validation
app/(admin)/admin/         ← layout with validation
```

### Flicker of Protected UI

**Cause**: Client validates after render (useSession is async).

**Solution**: Server-side validation in middleware AND layout happens BEFORE render.

### Session Not Validating

**Cause**: Middleware only checks cookie existence, not DB.

**Solution**: Use `auth.api.getSession({ headers })` which validates against database.

## Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply database migrations
npx prisma db push

# Run seed to create test users
npx prisma db seed
```

## Resources

- **Better Auth Docs**: https://www.better-auth.dev/
- **Next.js Middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Route Groups**: https://nextjs.org/docs/app/building-your-application/routing/route-groups
