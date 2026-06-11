import Link from "next/link";
import { House } from "lucide-react";
import { PriceSection } from "@/components/informacion/PriceSection";
import { CollapsibleSection } from "@/components/informacion/CollapsibleSection";
import { PlansSection } from "@/components/informacion/PlansSection";
import { DurationDiscountsSection } from "@/components/informacion/DurationDiscountsSection";
import { HoursSection } from "@/components/informacion/HoursSection";
import { AddressSection } from "@/components/informacion/AddressSection";
import { SocialLinksSection } from "@/components/informacion/SocialLinksSection";
import { getGymDisplayForServer } from "@/app/actions/gym";
import { getGymPrice } from "@/lib/gym-price";
import { getPromociones } from "@/lib/promociones";
import { getDescuentos } from "@/lib/descuentos";
import type { HorarioSemanal } from "@/lib/schemas";

/**
 * Local type aliases for the section components. The section
 * components (PriceSection, PlansSection, DurationDiscountsSection)
 * import these from this file. Re-deriving them from the cached
 * reader return types keeps the component contract in lockstep with
 * the actual Prisma row shape (and avoids drift if the schema
 * changes — the build fails at the read site).
 */
export type Promocion = Awaited<ReturnType<typeof getPromociones>>[number];
export type DescuentoDuracion = Awaited<ReturnType<typeof getDescuentos>>[number];

/**
 * Read the gym display fields (horarioJson / direccion / mapsEmbedUrl /
 * socialInstagram / socialWhatsapp) via the cached server reader.
 *
 * The reader itself handles DB errors internally and returns `null`,
 * so no try/catch is needed at this layer. Each individual read
 * (price, promociones, descuentos, gym display) is wrapped in
 * `Promise.allSettled` so a single bad read does not block the
 * others — see the page body for the pattern.
 */
type GymDisplay = NonNullable<Awaited<ReturnType<typeof getGymDisplayForServer>>>;

function normalizeGymDisplay(
  gym: GymDisplay | null
): {
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

export default async function InformacionPage() {
  // Four parallel reads, each one cached (60s TTL safety net, plus
  // `revalidateTag` invalidation in the corresponding server action).
  // `Promise.allSettled` is used instead of `Promise.all` so a single
  // bad read surfaces as a rejection without blocking the others —
  // graceful degradation per the page spec.
  //
  // The previous implementation made 4 sequential HTTP self-fetches
  // (`/api/feriados`, `/api/gym`, `/api/promociones`,
  // `/api/descuentos-duracion`) plus the cached `getGymDisplayForServer`
  // call. All 4 HTTP calls are now direct Prisma reads through the
  // cached readers. The `/api/feriados` call was a dead fetch (its
  // result was awaited but never rendered) and is dropped.
  const [gymDisplayResult, gymPriceResult, promocionesResult, descuentosResult] =
    await Promise.allSettled([
      getGymDisplayForServer(),
      getGymPrice(),
      getPromociones(),
      getDescuentos(),
    ]);

  // Surface failures for observability but never fail the page.
  if (gymDisplayResult.status === "rejected") {
    console.error("[InformacionPage] getGymDisplayForServer failed:", gymDisplayResult.reason);
  }
  if (gymPriceResult.status === "rejected") {
    console.error("[InformacionPage] getGymPrice failed:", gymPriceResult.reason);
  }
  if (promocionesResult.status === "rejected") {
    console.error("[InformacionPage] getPromociones failed:", promocionesResult.reason);
  }
  if (descuentosResult.status === "rejected") {
    console.error("[InformacionPage] getDescuentos failed:", descuentosResult.reason);
  }

  // Extract values with safe defaults. Cached readers already return
  // safe defaults on error (null / []) but the `.status === "fulfilled"`
  // guard makes the contract explicit at the read site.
  const gymDisplay = gymDisplayResult.status === "fulfilled" ? gymDisplayResult.value : null;
  const price = gymPriceResult.status === "fulfilled" ? gymPriceResult.value : null;
  const promociones = promocionesResult.status === "fulfilled" ? promocionesResult.value : [];
  const descuentos = descuentosResult.status === "fulfilled" ? descuentosResult.value : [];
  const display = normalizeGymDisplay(gymDisplay);

  // The `error` flag on the section components is now always `false`:
  // the cached readers handle their own errors and the
  // `Promise.allSettled` guard above prevents throws from escaping.
  // The empty-data state (`null` for price, `[]` for lists) drives
  // the "No disponible" / "No hay X" messages in each section.
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center">
      <main className="w-full max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
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

          {/* Plans / Promociones — collapsible */}
          <CollapsibleSection title="Promociones">
            <PlansSection promociones={promociones} error={false} />
          </CollapsibleSection>

          {/* Descuentos — collapsible */}
          <CollapsibleSection title="Descuentos">
            <DurationDiscountsSection descuentos={descuentos} error={false} />
          </CollapsibleSection>

          <HoursSection horario={display.horarioJson} />
          <AddressSection
            direccion={display.direccion}
            mapsEmbedUrl={display.mapsEmbedUrl}
          />
          <SocialLinksSection
            socialInstagram={display.socialInstagram}
            socialWhatsapp={display.socialWhatsapp}
          />
        </div>
      </main>
    </div>
  );
}
