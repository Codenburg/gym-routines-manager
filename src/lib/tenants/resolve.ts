import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { buildPublicHref } from "@/lib/tenants/href";

export interface PublicTenantContext {
  organizationId: string;
  orgSlug: string;
  source: "path" | "host" | "subdomain" | "custom-domain";
}

interface ResolvePublicTenantInput {
  orgSlug?: string;
  hostname?: string;
}

function normalizeSlug(orgSlug: string | undefined): string | null {
  const slug = orgSlug?.trim().toLowerCase();
  return slug && slug.length > 0 ? slug : null;
}

/**
 * Resolves a public tenant from the canonical slug routing contract.
 *
 * @param input - Public tenant lookup input. Slice 1 uses `orgSlug`; host-based inputs are reserved for future resolvers.
 * @returns The resolved public tenant context, or `null` when no tenant matches.
 */
export async function resolvePublicTenant(
  input: ResolvePublicTenantInput
): Promise<PublicTenantContext | null> {
  const orgSlug = normalizeSlug(input.orgSlug);

  if (!orgSlug) {
    return null;
  }

  return unstable_cache(
    async () => {
      const organization = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true, slug: true },
      });

      if (!organization) {
        return null;
      }

      return {
        organizationId: organization.id,
        orgSlug: organization.slug,
        source: "path" as const,
      };
    },
    ["public-tenant", orgSlug],
    {
      revalidate: 300,
      tags: [`tenant:${orgSlug}`],
    }
  )();
}

/**
 * Resolves the current public tenant or terminates the route with 404.
 *
 * @param orgSlug - Canonical route segment for the public tenant.
 * @returns The resolved public tenant context.
 */
export async function getPublicTenantContext(orgSlug: string): Promise<PublicTenantContext> {
  const tenant = await resolvePublicTenant({ orgSlug });

  if (!tenant) {
    notFound();
  }

  return tenant;
}

/**
 * Builds the canonical public site href for an organization id.
 *
 * @param organizationId - Internal organization identifier from the active admin session.
 * @returns The canonical `/g/[orgSlug]` href, or `null` when the organization cannot be resolved.
 */
export async function getPublicHrefForOrganization(organizationId: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { slug: true },
      });

      return organization ? buildPublicHref(organization.slug) : null;
    },
    ["public-tenant-href", organizationId],
    {
      revalidate: 300,
      tags: [`tenant-org:${organizationId}`],
    }
  )();
}
