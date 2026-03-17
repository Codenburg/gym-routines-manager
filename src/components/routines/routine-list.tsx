import { RoutineCard } from "./routine-card";
import { FolderOpen } from "lucide-react";

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

interface RoutineListProps {
  rutinas: Rutina[];
}

export function RoutineList({ rutinas }: RoutineListProps) {
  if (rutinas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="w-16 h-16 text-[var(--muted-foreground)] mb-4" />
        <p className="text-[var(--muted-foreground)] text-lg font-medium">No hay rutinas disponibles</p>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Crea tu primera rutina para comenzar</p>
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
