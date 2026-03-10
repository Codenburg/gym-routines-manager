import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  diasCount: number;
}

interface RoutineCardProps {
  rutina: Rutina;
}

export function RoutineCard({ rutina }: RoutineCardProps) {
  const diasLabel = rutina.diasCount === 1 ? "1 día" : `${rutina.diasCount} días`;

  return (
    <Link href={`/rutinas/${rutina.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
              {rutina.nombre}
            </CardTitle>
            <span className="shrink-0 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              {rutina.tipo}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {rutina.descripcion && (
            <p className="text-sm text-slate-400 line-clamp-2">{rutina.descripcion}</p>
          )}
        </CardContent>
        <CardFooter>
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
        </CardFooter>
      </Card>
    </Link>
  );
}
