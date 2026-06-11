import { Suspense } from "react";
import Link from "next/link";
import { House, Calendar, AlertCircle } from "lucide-react";
import type { DataResult } from "@/lib/data-result";
import { MarkAsSeenWrapper } from "@/components/feriados/mark-as-seen-wrapper";
import { getFeriados } from "@/lib/feriados";
import { getToday } from "@/lib/dates";
import prisma from "@/lib/prisma";

/**
 * Local type alias for the Feriado row, derived from the cached
 * reader's return type. The list rendering (FeriadosWrapper) and the
 * display helpers (formatDate, formatFeriadoDisplay) only use
 * `fecha`, `todo_dia`, `hora_inicio`, and `hora_fin` — `createdAt` is
 * surfaced separately via the `latestFeriadoDate` prop.
 */
type Feriado = Awaited<ReturnType<typeof getFeriados>>[number];

/**
 * Direct Prisma query for the most recently created Feriado's
 * `createdAt`, returned as an ISO 8601 string.
 *
 * Mirrors the previous `/api/feriados/latest` endpoint behavior. Kept
 * as a direct Prisma read (not cached) so the "new" badge in
 * `MarkAsSeenWrapper` reflects the freshest state — the cached
 * `getFeriados()` list has a 30s TTL safety net (good enough for
 * the visible list, but the badge signal needs to be live).
 */
async function getLatestFeriadoDate(): Promise<string | null> {
  try {
    const latest = await prisma.feriado.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return latest ? latest.createdAt.toISOString() : null;
  } catch (error) {
    console.error("[getLatestFeriadoDate] Failed to fetch latest feriado:", error);
    return null;
  }
}

function formatDate(fechaStr: string): string {
  // Use local time to avoid timezone offset issues
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

export default async function FeriadosPage() {
  // Two parallel reads:
  //   - `getFeriados` (cached, 30s TTL, tag "feriados") — full list
  //   - `getLatestFeriadoDate` (direct query, fresh) — for the "new"
  //     badge in `MarkAsSeenWrapper`
  //
  // `Promise.allSettled` is used so a single bad read does not block
  // the other. The list's "error" state is the read's rejection; the
  // latest-date read's failure is treated as "no new feriado" and
  // silently returns null.
  const [feriadosResultSettled, latestFeriadoDateSettled] = await Promise.allSettled([
    getFeriados(),
    getLatestFeriadoDate(),
  ]);

  if (feriadosResultSettled.status === "rejected") {
    console.error("[FeriadosPage] getFeriados failed:", feriadosResultSettled.reason);
  }
  if (latestFeriadoDateSettled.status === "rejected") {
    console.error("[FeriadosPage] getLatestFeriadoDate failed:", latestFeriadoDateSettled.reason);
  }

  const feriados =
    feriadosResultSettled.status === "fulfilled" ? feriadosResultSettled.value : [];
  const feriadosResult: DataResult<Feriado[]> = {
    data: feriados,
    error: feriadosResultSettled.status === "rejected",
  };
  const latestFeriadoDate =
    latestFeriadoDateSettled.status === "fulfilled" ? latestFeriadoDateSettled.value : null;

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
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Feriados</h1>
          <div className="w-9" />
        </div>

        <Suspense fallback={<FeriadosSkeleton />}>
          <MarkAsSeenWrapper latestFeriadoDate={latestFeriadoDate}>
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
  // Error state - DB or network failure
  if (feriadosResult.error) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
        <p className="text-[var(--foreground)]">No se pudieron cargar los feriados</p>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Por favor, intenta de nuevo más tarde.</p>
      </div>
    );
  }

  const feriados = feriadosResult.data;

  // Filter to only show today and future holidays
  const today = getToday();
  const feriadosVisibles = feriados.filter((f) => f.fecha >= today);

  // Empty state - no data available
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
