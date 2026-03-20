import { Suspense } from "react";
import Link from "next/link";
import { House, Calendar, AlertCircle } from "lucide-react";
import { DataResult, ok, err } from "@/lib/data-result";

interface Feriado {
  id: string;
  fecha: string;
  createdAt: string;
}

async function getFeriados(): Promise<DataResult<Feriado[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/feriados`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[getFeriados] API returned non-OK status:", response.status);
      return err([]);
    }

    return ok(await response.json());
  } catch (error) {
    console.error("[getFeriados] Failed to fetch feriados:", error);
    return err([]);
  }
}

function formatDate(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function FeriadosPage() {
  const feriadosResult = await getFeriados();

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
          <FeriadosWrapper feriadosResult={feriadosResult} />
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

  // Empty state - no data available
  if (feriados.length === 0) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <p className="text-[var(--muted-foreground)]">No hay feriados programados</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <ul className="space-y-3">
        {feriados.map((feriado) => (
          <li
            key={feriado.id}
            className="flex items-center gap-3 p-2.5 bg-[var(--background)] rounded-lg"
          >
            <Calendar className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
            <span className="text-[var(--foreground)] text-sm">{formatDate(feriado.fecha)}</span>
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
