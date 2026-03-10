import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayCard } from "./day-card";

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

interface RoutineCardProps {
  rutina: Rutina;
}

export function RoutineCard({ rutina }: RoutineCardProps) {
  const diasLabel = rutina.diasCount === 1 ? "1 día" : `${rutina.diasCount} días`;
  const showDays = rutina.dias && rutina.dias.length > 0;

  return (
    <Card className="transition-all duration-200 h-full bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-white">
            {rutina.nombre}
          </CardTitle>
          <span className="shrink-0 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            {rutina.tipo}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rutina.descripcion && (
          <p className="text-sm text-slate-400 line-clamp-2">{rutina.descripcion}</p>
        )}
        
        {showDays && (
          <div className="space-y-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                  clipRule="evenodd"
                />
              </svg>
              {diasLabel}
            </span>
            
            <div className="grid grid-cols-1 gap-2">
              {rutina.dias!.map((dia) => (
                <DayCard key={dia.id} dia={dia} rutinaId={rutina.id} />
              ))}
            </div>
          </div>
        )}

        {!showDays && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clipRule="evenodd"
              />
            </svg>
            {diasLabel}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
