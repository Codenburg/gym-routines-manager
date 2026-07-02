import Link from "next/link";
import { House } from "lucide-react";
import { getGymDisplayForServerForTenant } from "@/app/actions/gym";
import { AddressSection } from "@/components/informacion/AddressSection";
import { CollapsibleSection } from "@/components/informacion/CollapsibleSection";
import { DurationDiscountsSection } from "@/components/informacion/DurationDiscountsSection";
import { HoursSection } from "@/components/informacion/HoursSection";
import { PlansSection } from "@/components/informacion/PlansSection";
import { PriceSection } from "@/components/informacion/PriceSection";
import { SocialLinksSection } from "@/components/informacion/SocialLinksSection";
import { getDescuentosForTenant } from "@/lib/descuentos";
import { getGymPriceForTenant } from "@/lib/gym-price";
import { getPromocionesActivasForTenant } from "@/lib/promociones";
import type { HorarioSemanal } from "@/lib/schemas";
import { buildPublicHref } from "@/lib/tenants/href";
import { getPublicTenantContext } from "@/lib/tenants/resolve";

export type Promocion = Awaited<ReturnType<typeof getPromocionesActivasForTenant>>[number];
export type DescuentoDuracion = Awaited<ReturnType<typeof getDescuentosForTenant>>[number];

type GymDisplay = NonNullable<Awaited<ReturnType<typeof getGymDisplayForServerForTenant>>>;

function normalizeGymDisplay(gym: GymDisplay | null): {
  horarioJson: HorarioSemanal | null;
  direccion: string | null;
  mapsEmbedUrl: string | null;
  socialInstagram: string | null;
  socialWhatsapp: string | null;
} {
  return {
    horarioJson: gym?.horarioJson ?? null,
    direccion: gym?.direccion ?? null,
    mapsEmbedUrl: gym?.mapsEmbedUrl ?? null,
    socialInstagram: gym?.socialInstagram ?? null,
    socialWhatsapp: gym?.socialWhatsapp ?? null,
  };
}

interface InformacionRouteProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function PublicTenantInformacionPage({ params }: InformacionRouteProps) {
  const { orgSlug } = await params;
  const tenant = await getPublicTenantContext(orgSlug);
  const organizationId = tenant.organizationId;

  const [gymDisplayResult, gymPriceResult, promocionesResult, descuentosResult] =
    await Promise.allSettled([
      getGymDisplayForServerForTenant(organizationId),
      getGymPriceForTenant(organizationId),
      getPromocionesActivasForTenant(organizationId),
      getDescuentosForTenant(organizationId),
    ]);

  if (gymDisplayResult.status === "rejected") {
    console.error("[PublicTenantInformacionPage] gym display failed:", gymDisplayResult.reason);
  }
  if (gymPriceResult.status === "rejected") {
    console.error("[PublicTenantInformacionPage] gym price failed:", gymPriceResult.reason);
  }
  if (promocionesResult.status === "rejected") {
    console.error("[PublicTenantInformacionPage] promociones failed:", promocionesResult.reason);
  }
  if (descuentosResult.status === "rejected") {
    console.error("[PublicTenantInformacionPage] descuentos failed:", descuentosResult.reason);
  }

  const gymDisplay = gymDisplayResult.status === "fulfilled" ? gymDisplayResult.value : null;
  const price = gymPriceResult.status === "fulfilled" ? gymPriceResult.value : null;
  const promociones = promocionesResult.status === "fulfilled" ? promocionesResult.value : [];
  const descuentos = descuentosResult.status === "fulfilled" ? descuentosResult.value : [];
  const display = normalizeGymDisplay(gymDisplay);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center">
      <main className="w-full max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={buildPublicHref(tenant.orgSlug)}
            className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <House className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
            Información
          </h1>
          <div className="w-9" />
        </div>

        <div className="grid gap-6">
          <PriceSection price={price} error={false} />

          <CollapsibleSection title="Promociones">
            <PlansSection promociones={promociones} error={false} />
          </CollapsibleSection>

          <CollapsibleSection title="Descuentos">
            <DurationDiscountsSection descuentos={descuentos} error={false} price={price} />
          </CollapsibleSection>

          <HoursSection horario={display.horarioJson} />
          <AddressSection direccion={display.direccion} mapsEmbedUrl={display.mapsEmbedUrl} />
          <SocialLinksSection
            socialInstagram={display.socialInstagram}
            socialWhatsapp={display.socialWhatsapp}
          />
        </div>
      </main>
    </div>
  );
}
