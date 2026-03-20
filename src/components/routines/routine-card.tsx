import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creador: string | null;
  diasCount: number;
}

interface RoutineCardProps {
  rutina: Rutina;
}

export function RoutineCard({ rutina }: RoutineCardProps) {
  const diasLabel = rutina.diasCount === 1 ? "1 día" : `${rutina.diasCount} días`;

  return (
    <Link href={`/rutinas/${rutina.id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 h-full flex flex-col bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg group-hover:text-blue-500 transition-colors text-foreground font-semibold tracking-tight">
              {rutina.nombre}
            </CardTitle>
            <span className="shrink-0 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-500">
              {rutina.tipo}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {rutina.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2">{rutina.descripcion}</p>
          )}
          {rutina.creador && (
            <p className="text-xs text-muted-foreground mt-2">
              Creado por <span className="text-foreground font-medium">{rutina.creador}</span>
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-auto">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5" />
            {diasLabel}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
