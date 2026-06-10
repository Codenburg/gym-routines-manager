import { GENERIC_GYM_NAME } from "@/lib/schemas";

/**
 * Resolve the gym display name from the three-step fallback chain:
 *
 *   1. `dbName` — the value stored in the Gym singleton (`Gym.nombre`).
 *   2. `envName` — `process.env.NEXT_PUBLIC_GYM_NAME` (the deploy's gym-owner
 *      identity, set at build time).
 *   3. `GENERIC_GYM_NAME` (`"Gimnasio"`) — last-resort neutral string that
 *      does NOT identify any specific gym or client.
 *
 * Used by any unauthenticated surface that needs to render a gym name:
 * root layout metadata, `loading.tsx`, the login page, the public homepage,
 * and the admin sidebar. Centralizing the chain guarantees that no
 * consumer hardcodes a specific brand name and that every surface falls
 * through the same logic.
 *
 * Whitespace-only strings are treated as empty (so a DB value of `"   "`
 * is treated the same as `null`).
 */
export function resolveGymName(
  dbName: string | null | undefined,
  envName: string | undefined = process.env.NEXT_PUBLIC_GYM_NAME
): string {
  const trimmedDb = dbName?.trim();
  if (trimmedDb) return trimmedDb;

  const trimmedEnv = envName?.trim();
  if (trimmedEnv) return trimmedEnv;

  return GENERIC_GYM_NAME;
}
