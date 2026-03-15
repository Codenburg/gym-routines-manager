import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

interface Feriado {
  id: string;
  fecha: string;
  createdAt: string;
}

async function getFeriados(): Promise<Feriado[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/feriados`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
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
  const feriadosPromise = getFeriados();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-all duration-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-6 sm:mb-8">Feriados</h1>

        <Suspense fallback={<FeriadosSkeleton />}>
          <FeriadosWrapper feriadosPromise={feriadosPromise} />
        </Suspense>
      </main>
    </div>
  );
}

async function FeriadosWrapper({
  feriadosPromise,
}: {
  feriadosPromise: Promise<Feriado[]>;
}) {
  const feriados = await feriadosPromise;

  if (feriados.length === 0) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <p className="text-[var(--muted)] text-lg">No hay feriados programados</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-6">
      <ul className="space-y-4">
        {feriados.map((feriado) => (
          <li
            key={feriado.id}
            className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg"
          >
            <Calendar className="w-5 h-5 text-[var(--muted)] flex-shrink-0" />
            <span className="text-[var(--foreground)]">{formatDate(feriado.fecha)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeriadosSkeleton() {
  return (
    <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[var(--button-secondary-bg)] rounded animate-pulse" />
            <div className="h-5 w-48 bg-[var(--button-secondary-bg)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
