---
name: better-auth-username
description: >
  Configure Better Auth to use username instead of email for authentication.
  Trigger: When implementing login with username/DNI instead of email.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Apply

- User wants to login with username/DNI instead of email
- Need to replace email-based authentication with identifier-based auth
- Building admin panels that use employee ID or DNI for login

## Critical Patterns

### 1. Server Configuration (auth.ts)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Keep email validator for email-based signups if needed
    emailValidator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  },
  // Add username plugin
  plugins: [
    username(),
    admin()
  ],
  user: {
    additionalFields: {
      admin: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
});
```

### 2. Client Configuration (auth-client.ts)

```typescript
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [usernameClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
```

### 3. Prisma Schema

Add `username` field to User model:

```prisma
model User {
  id             String    @id @default(uuid())
  name           String
  username       String?   @unique  // Required for username plugin
  email          String?   @unique  // Optional - can be null
  emailVerified  Boolean   @default(false)
  // ... other fields
}
```

### 4. Login Component

```typescript
// Use signIn.username() instead of signIn.email()
await authClient.signIn.username(
  {
    username: data.identifier, // DNI or username
    password: data.password,
  },
  {
    onSuccess: () => {
      router.push("/admin");
    },
    onError: (ctx) => {
      toast.error("Usuario o contraseña incorrectos");
    },
  }
);
```

## Setup Commands

```bash
# 1. Update schema
npx prisma db push

# 2. Generate client
npx prisma generate

# 3. Create user with username in seed
const adminUser = await prisma.user.create({
  data: {
    name: 'Admin',
    username: '12345678',  // DNI as username
    email: null,
    // ...
  }
});
```

## Why This Works

- **username plugin** adds `/sign-in/username` endpoint
- **usernameClient** provides `signIn.username()` on client
- **username field** in DB stores the identifier
- User sees "Username" or "DNI" in UI but internally uses username

## Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid email" error | Use `signIn.username()` not `signIn.email()` |
| Schema missing username | Add `username String? @unique` to User model |
| Client plugin missing | Add `usernameClient()` to auth-client.ts |
| Plugin not in server | Add `username()` to plugins array in auth.ts |

## Resources

- **Better Auth Docs**: https://www.better-auth.com/docs/plugins/username
