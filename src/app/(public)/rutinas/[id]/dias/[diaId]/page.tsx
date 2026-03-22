import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getCachedRutinaById } from "@/lib/rutinas";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ id: string; diaId: string }>;
}) {
  const { id: rutinaId, diaId } = await params;

  let rutina;
  try {
    rutina = await getCachedRutinaById(rutinaId);
  } catch (error) {
    console.error("[DayDetailPage] Failed to load rutina:", error);
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <Link
            href={`/rutinas/${rutinaId}`}
            className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a la rutina
          </Link>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <p className="text-foreground text-lg font-medium">No se pudo cargar el día</p>
            <p className="text-muted-foreground text-sm mt-1">Por favor, intenta de nuevo más tarde.</p>
          </div>
        </main>
      </div>
    );
  }

  // rutina === null means routine not found → notFound()
  if (rutina === null) {
    notFound();
  }

  // Resolve day from cached rutina.dias in memory — NO additional fetch
  const dia = rutina.dias.find((d) => d.id === diaId);

  // Day not found in this routine → notFound()
  if (!dia) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back button */}
        <Link
          href={`/rutinas/${rutinaId}`}
          className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver a la rutina
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                {dia.nombre}
              </h1>
              {dia.musculosEnfocados && (
                <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-500">
                  {dia.musculosEnfocados}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Ejercicios ({dia.ejercicios.length})
          </h2>

          {dia.ejercicios.length === 0 ? (
            <Card className="bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay ejercicios configurados para este día
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dia.ejercicios.map((ejercicio, index) => (
                <Card
                  key={ejercicio.id}
                  className="hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50"
                >
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 text-lg font-bold">
                          {index + 1}
                        </span>
                        <CardTitle className="text-lg text-foreground font-semibold tracking-tight">
                          {ejercicio.nombre}
                        </CardTitle>
                      </div>
                      {ejercicio.series && (
                        <span className="text-lg font-semibold text-green-500">
                          {ejercicio.series}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
