import { Suspense } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { RoutineList } from "@/components/routines/routine-list";
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
    <div className="min-h-screen bg-slate-900">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rutinas Champion Gym</h1>
          <p className="text-slate-400 mb-6">Explora las mejores rutinas de entrenamiento</p>
          <SearchBar defaultValue={search ?? ""} />
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
