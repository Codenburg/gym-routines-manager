// Auth Client Configuration
// src/lib/auth-client.ts

import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [usernameClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
