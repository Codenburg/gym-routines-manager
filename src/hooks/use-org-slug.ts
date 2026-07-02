"use client";

import { useParams } from "next/navigation";

/**
 * Reads the active public organization slug from the canonical route params.
 *
 * @returns The active `orgSlug` route segment, or `null` outside `/g/[orgSlug]/*` routes.
 */
export function useOrgSlug(): string | null {
  const params = useParams<{ orgSlug?: string | string[] }>();
  const orgSlug = params.orgSlug;

  if (Array.isArray(orgSlug)) {
    return orgSlug[0] ?? null;
  }

  return orgSlug ?? null;
}
