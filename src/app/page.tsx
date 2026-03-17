import { Suspense } from "react";
import Link from "next/link";
import { Info, Calendar } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { RoutineList } from "@/components/routines/routine-list";
import { TrainerSidebar } from "@/components/search/trainer-sidebar";
import { TrainerSidebarClient } from "@/components/search/trainer-sidebar-client";
import { ThemeToggle } from "@/components/theme-toggle";
import Loading from "./loading";

interface SearchParams {
  search?: string;
  trainers?: string;
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
  creador: string | null;
  diasCount: number;
  dias?: Dia[];
}

interface Trainer {
  nombre: string;
  count: number;
}

async function getRutinas(search?: string, trainers?: string): Promise<Rutina[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = new URL(`${baseUrl}/api/rutinas`);
  if (search) {
    url.searchParams.set("search", search);
  }
  if (trainers) {
    url.searchParams.set("trainers", trainers);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rutinas");
  }

  const result = await response.json();
  // API returns { data: Rutina[], pagination: {...} }
  return result.data ?? result;
}

async function getTrainers(): Promise<Trainer[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = new URL(`${baseUrl}/api/trainers`);

  const response = await fetch(url.toString(), {
    // Cache trainers for 60 seconds - they don't change often
    cache: "force-cache",
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    // Return empty array if API fails - sidebar will be hidden
    return [];
  }

  return response.json();
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search = params?.search;
  const trainers = params?.trainers;

  const rutinasPromise = getRutinas(search, trainers);
  const trainersData = await getTrainers();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl">
        <div className="mb-10">
          {/* Header with title and top buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
                Rutinas Champion Gym
              </h1>
              <p className="text-muted-foreground text-lg">Explora las mejores rutinas de entrenamiento</p>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <nav className="flex gap-2 sm:hidden">
                <Link
                  href="/informacion"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
                >
                  <Info className="w-4 h-4" />
                  Información
                </Link>
                <Link
                  href="/feriados"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  Feriados
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>

          {/* Search and action buttons - aligned with cards grid */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <div className="flex-1 max-w-none">
              <SearchBar defaultValue={search ?? ""} />
            </div>
            <nav className="hidden sm:flex gap-2 shrink-0">
              <Link
                href="/informacion"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                <Info className="w-4 h-4" />
                Información
              </Link>
              <Link
                href="/feriados"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-w-[130px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                Feriados
              </Link>
            </nav>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Trainer Sidebar */}
          <TrainerSidebarClient initialTrainers={trainersData} />

          {/* Main Content */}
          <div className="flex-1">
            <Suspense fallback={<Loading />}>
              <RoutineListWrapper rutinasPromise={rutinasPromise} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

async function RoutineListWrapper({ rutinasPromise }: { rutinasPromise: Promise<Rutina[]> }) {
  const rutinas = await rutinasPromise;
  return <RoutineList rutinas={rutinas} />;
}
