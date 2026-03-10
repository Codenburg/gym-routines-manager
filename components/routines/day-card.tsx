import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface DayCardProps {
  dia: Dia;
  rutinaId: string;
}

export function DayCard({ dia, rutinaId }: DayCardProps) {
  return (
    <Link href={`/rutinas/${rutinaId}/dias/${dia.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/10 bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base group-hover:text-emerald-400 transition-colors">
              {dia.nombre}
            </CardTitle>
            {dia.musculosEnfocados && (
              <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {dia.musculosEnfocados}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dia.ejercicios.length > 0 ? (
            <div className="space-y-1.5">
              {dia.ejercicios.slice(0, 3).map((ejercicio) => (
                <div key={ejercicio.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate">{ejercicio.nombre}</span>
                  {ejercicio.series && ejercicio.repes && (
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {ejercicio.series} x {ejercicio.repes}
                    </span>
                  )}
                </div>
              ))}
              {dia.ejercicios.length > 3 && (
                <p className="text-xs text-slate-500 pt-1">
                  +{dia.ejercicios.length - 3} más
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Sin ejercicios</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
