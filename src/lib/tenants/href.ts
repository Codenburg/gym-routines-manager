/**
 * Builds a canonical public tenant href under `/g/[orgSlug]`.
 *
 * @param orgSlug - Public organization slug from the active tenant context.
 * @param path - Optional route path inside the public tenant surface.
 * @returns A canonical public href preserving the tenant slug.
 */
export function buildPublicHref(orgSlug: string, path: `/${string}` = "/"): string {
  const normalizedPath = path === "/" ? "" : path.replace(/\/+$/, "");
  const encodedSlug = encodeURIComponent(orgSlug);

  return `/g/${encodedSlug}${normalizedPath}`;
}
