import type { Metadata } from "next";
import { getGymNameForServerForTenant } from "@/app/actions/gym";
import { getPublicTenantContext } from "@/lib/tenants/resolve";
import { resolveGymNameForTenant } from "@/lib/gym-display";

interface PublicTenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Generates tenant route metadata after resolving the canonical slug.
 *
 * @param props - Next.js layout props with async route params.
 * @returns Metadata for the resolved public tenant route.
 */
export async function generateMetadata({ params }: PublicTenantLayoutProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const tenant = await getPublicTenantContext(orgSlug);

  const dbName = await getGymNameForServerForTenant(tenant.organizationId);

  const name = resolveGymNameForTenant(dbName);

  return {
    title: name,
    description: `Explore ${name} routines`,
  };
}

export default async function PublicTenantLayout({
  children,
  params,
}: PublicTenantLayoutProps) {
  const { orgSlug } = await params;
  await getPublicTenantContext(orgSlug);

  return children;
}
