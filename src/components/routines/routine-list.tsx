import { RoutineCard } from "./routine-card";
import { FolderOpen, AlertCircle } from "lucide-react";

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
  showError?: boolean;
}

export function RoutineList({ rutinas, showError = false }: RoutineListProps) {
  // Error state - DB or network failure
  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="routine-list-error">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <p className="text-foreground text-lg font-medium">No se pudieron cargar las rutinas</p>
        <p className="text-muted-foreground text-sm mt-1">Por favor, intenta de nuevo más tarde.</p>
      </div>
    );
  }

  // Empty state - no data available
  if (rutinas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="routine-list-empty">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg font-medium">No hay rutinas disponibles</p>
        <p className="text-muted-foreground text-sm mt-1">Crea tu primera rutina para comenzar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="routine-list-content">
      {rutinas.map((rutina) => (
        <RoutineCard key={rutina.id} rutina={rutina} />
      ))}
    </div>
  );
}
