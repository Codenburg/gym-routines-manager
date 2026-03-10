import { RoutineCard } from "./routine-card";

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

interface RoutineListProps {
  rutinas: Rutina[];
}

export function RoutineList({ rutinas }: RoutineListProps) {
  if (rutinas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 text-slate-600 mb-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
        <p className="text-slate-400 text-lg font-medium">No hay rutinas disponibles</p>
        <p className="text-slate-500 text-sm mt-1">Crea tu primera rutina para comenzar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {rutinas.map((rutina) => (
        <RoutineCard key={rutina.id} rutina={rutina} />
      ))}
    </div>
  );
}
