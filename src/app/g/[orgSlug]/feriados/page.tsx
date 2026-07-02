import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, House } from "lucide-react";
import { MarkAsSeenWrapper } from "@/components/feriados/mark-as-seen-wrapper";
import type { DataResult } from "@/lib/data-result";
import { getToday } from "@/lib/dates";
import { getFeriadosForTenant, getLatestFeriadoDateForTenant } from "@/lib/feriados";
import { buildPublicHref } from "@/lib/tenants/href";
import { getPublicTenantContext } from "@/lib/tenants/resolve";

type Feriado = Awaited<ReturnType<typeof getFeriadosForTenant>>[number];

function formatDate(fechaStr: string): string {
  const fecha = new Date(`${fechaStr}T00:00:00`);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatFeriadoDisplay(feriado: Feriado): string {
  if (feriado.todo_dia) {
    return "Todo el día";
  }
  if (feriado.hora_inicio && feriado.hora_fin) {
    return `Abierto de ${feriado.hora_inicio} a ${feriado.hora_fin}`;
  }
  return "Todo el día";
}

interface FeriadosRouteProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function PublicTenantFeriadosPage({ params }: FeriadosRouteProps) {
  const { orgSlug } = await params;
  const tenant = await getPublicTenantContext(orgSlug);

  const [feriadosResultSettled, latestFeriadoDateSettled] = await Promise.allSettled([
    getFeriadosForTenant(tenant.organizationId),
    getLatestFeriadoDateForTenant(tenant.organizationId),
  ]);

  if (feriadosResultSettled.status === "rejected") {
    console.error("[PublicTenantFeriadosPage] getFeriadosForTenant failed:", feriadosResultSettled.reason);
  }
  if (latestFeriadoDateSettled.status === "rejected") {
    console.error(
      "[PublicTenantFeriadosPage] getLatestFeriadoDateForTenant failed:",
      latestFeriadoDateSettled.reason
    );
  }

  const feriados = feriadosResultSettled.status === "fulfilled" ? feriadosResultSettled.value : [];
  const feriadosResult: DataResult<Feriado[]> = {
    data: feriados,
    error: feriadosResultSettled.status === "rejected",
  };
  const latestFeriadoDate =
    latestFeriadoDateSettled.status === "fulfilled" ? latestFeriadoDateSettled.value : null;

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
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Feriados</h1>
          <div className="w-9" />
        </div>

        <Suspense fallback={<FeriadosSkeleton />}>
          <MarkAsSeenWrapper latestFeriadoDate={latestFeriadoDate} orgSlug={tenant.orgSlug}>
            <FeriadosWrapper feriadosResult={feriadosResult} />
          </MarkAsSeenWrapper>
        </Suspense>
      </main>
    </div>
  );
}

async function FeriadosWrapper({
  feriadosResult,
}: {
  feriadosResult: DataResult<Feriado[]>;
}) {
  if (feriadosResult.error) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
        <p className="text-[var(--foreground)]">No se pudieron cargar los feriados</p>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  const today = getToday();
  const feriadosVisibles = feriadosResult.data.filter((f) => f.fecha >= today);

  if (feriadosVisibles.length === 0) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <p className="text-[var(--muted-foreground)]">No hay feriados programados</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <ul className="space-y-3">
        {feriadosVisibles.map((feriado) => (
          <li
            key={feriado.id}
            className="flex flex-col gap-1 p-2.5 bg-[var(--background)] rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[var(--foreground)] flex-shrink-0" />
              <span className="text-[var(--foreground)] text-sm">{formatDate(feriado.fecha)}</span>
            </div>
            <span className="text-[var(--muted-foreground)] text-xs pl-7">
              {formatFeriadoDisplay(feriado)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeriadosSkeleton() {
  return (
    <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 bg-[var(--background)] rounded animate-pulse" />
            <div className="h-4 w-40 bg-[var(--background)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
