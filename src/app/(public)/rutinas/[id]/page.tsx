import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, Calendar, Dumbbell, Zap } from "lucide-react";
import { getCachedRutinaById } from "@/lib/rutinas";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let rutina;

  try {
    rutina = await getCachedRutinaById(id);
  } catch (error) {
    console.error("[RoutineDetailPage] Failed to load rutina:", error);
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="size-5 mr-2" />
            Volver a mis rutinas
          </Link>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="size-16 text-destructive mb-4" />
            <p className="text-foreground text-lg font-medium">No se pudo cargar la rutina</p>
            <p className="text-muted-foreground text-sm mt-1">Por favor, intenta de nuevo más tarde.</p>
          </div>
        </main>
      </div>
    );
  }

  if (rutina === null) {
    notFound();
  }

  // Stats computation
  const totalDays = rutina.dias.length;
  const totalExercises = rutina.dias.reduce((sum, d) => sum + d.ejercicios.length, 0);
  const totalSets = rutina.dias.reduce(
    (sum, d) =>
      sum + d.ejercicios.reduce((s, e) => s + (e.series ?? 0), 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="size-5 mr-2" />
          Volver a mis rutinas
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {rutina.nombre}
          </h1>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize">
              {rutina.tipo}
            </span>
            <span className="text-sm text-muted-foreground">
              Creado por{" "}
              <span className="text-foreground font-medium">
                {rutina.creadorUser.name}
              </span>
            </span>
          </div>
          {rutina.descripcion && (
            <p className="text-sm text-muted-foreground">{rutina.descripcion}</p>
          )}
        </div>

        {/* Stats Summary */}
        {totalDays > 0 && (
          <div className="flex items-center gap-4 mb-8">
            <Badge variant="outline" className="px-4 py-2 text-sm gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold text-primary">{totalDays}</span>
              <span className="text-muted-foreground">días</span>
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold text-primary">{totalExercises}</span>
              <span className="text-muted-foreground">ejercicios</span>
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm gap-1.5">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold text-primary">{totalSets}</span>
              <span className="text-muted-foreground">series</span>
            </Badge>
          </div>
        )}

        {/* Days */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Días de entrenamiento
          </h2>

          {rutina.dias.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay días configurados en esta rutina
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {rutina.dias.map((dia, index) => (
                <details key={dia.id} open className="group rounded-lg border bg-card text-card-foreground shadow-sm">
                  <summary className="flex items-center justify-between cursor-pointer list-none p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Día {index + 1}</span>
                      {dia.musculosEnfocados && dia.musculosEnfocados.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {dia.musculosEnfocados.map((musculo) => (
                            <Badge key={musculo} variant="outline" className="text-xs">
                              {musculo}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </summary>
                  <div className="px-4 pb-4">
                    {dia.ejercicios.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No hay ejercicios configurados
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2 mt-2">
                        {dia.ejercicios.map((ejercicio, ejIndex) => (
                          <li
                            key={ejercicio.id}
                            className="flex items-center justify-between text-foreground"
                          >
                            <div className="flex items-center gap-3">
                              {ejercicio.nombre}
                            </div>
                            {ejercicio.series && ejercicio.repes ? (
                              <span className="text-sm text-primary font-medium">
                                {ejercicio.series}×{ejercicio.repes}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
