import { Suspense } from "react";
import Link from "next/link";
import { Info, Calendar } from "lucide-react";
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
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl">
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3">Rutinas Champion Gym</h1>
              <p className="text-[var(--muted)] text-lg">Explora las mejores rutinas de entrenamiento</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="w-full sm:max-w-md">
              <SearchBar defaultValue={search ?? ""} />
            </div>
            <nav className="flex gap-2">
              <Link
                href="/informacion"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Información</span>
                <span className="sm:hidden">Info</span>
              </Link>
              <Link
                href="/feriados"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                Feriados
              </Link>
            </nav>
          </div>
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
