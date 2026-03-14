import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { RoutineList } from "@/components/routines/routine-list";
import { ThemeToggle } from "@/components/theme-toggle";
import Loading from "./loading";

interface SearchParams {
  search?: string;
}

interface Ejercicio {
  id: string;
  nombre: string;
  series: string | null;
  repes: string | null;
}

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  ejercicios: Ejercicio[];
}

interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  diasCount: number;
  dias?: Dia[];
}

async function getRutinas(search?: string): Promise<Rutina[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = new URL(`${baseUrl}/api/rutinas`);
  if (search) {
    url.searchParams.set("search", search);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rutinas");
  }

  return response.json();
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search = params?.search;

  const rutinasPromise = getRutinas(search);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="container mx-auto px-8 py-12 max-w-5xl">
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">Rutinas Champion Gym</h1>
            <p className="text-[var(--muted)] mb-8 text-lg">Explora las mejores rutinas de entrenamiento</p>
            <div className="flex flex-wrap items-center gap-3">
              <SearchBar defaultValue={search ?? ""} />
              <nav className="flex gap-2">
                <Link
                  href="/informacion"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Información
                </Link>
                <Link
                  href="/feriados"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Feriados
                </Link>
              </nav>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Suspense fallback={<Loading />}>
          <RoutineListWrapper rutinasPromise={rutinasPromise} />
        </Suspense>
      </main>
    </div>
  );
}

async function RoutineListWrapper({ rutinasPromise }: { rutinasPromise: Promise<Rutina[]> }) {
  const rutinas = await rutinasPromise;
  return <RoutineList rutinas={rutinas} />;
}
