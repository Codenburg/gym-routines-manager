import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
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
            className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a mis rutinas
          </Link>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver a mis rutinas
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                {rutina.nombre}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-500">
                  {rutina.tipo}
                </span>
                {rutina.creador && (
                  <span className="text-sm text-muted-foreground">
                    Creado por <span className="text-foreground font-medium">{rutina.creador}</span>
                  </span>
                )}
              </div>
            </div>
            {rutina.descripcion && (
              <p className="text-muted-foreground mt-2">{rutina.descripcion}</p>
            )}
          </div>
        </div>

        {/* Days */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Días de entrenamiento ({rutina.dias.length})
          </h2>

          {rutina.dias.length === 0 ? (
            <Card className="bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay días configurados en esta rutina
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {rutina.dias.map((dia, index) => (
                <Link
                  key={dia.id}
                  href={`/rutinas/${rutina.id}/dias/${dia.id}`}
                  className="block"
                >
                  <Card className="hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-foreground flex items-center gap-3 font-semibold tracking-tight">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 text-sm font-bold">
                            {index + 1}
                          </span>
                          {dia.nombre}
                        </CardTitle>
                        <div className="flex items-center gap-4">
                          {dia.musculosEnfocados && (
                            <span className="text-sm text-muted-foreground">
                              {dia.musculosEnfocados}
                            </span>
                          )}
                          {dia.ejercicios.length > 0 && (
                            <span className="text-sm text-blue-500">
                              {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                      <CardContent>
                        {dia.ejercicios.length === 0 ? (
                          <p className="text-muted-foreground text-sm">
                            No hay ejercicios configurados
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {dia.ejercicios.slice(0, 3).map((ejercicio, ejIndex) => (
                              <li
                                key={ejercicio.id}
                                className="flex items-center justify-between text-foreground"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground text-sm w-6">
                                    {ejIndex + 1}.
                                  </span>
                                  {ejercicio.nombre}
                                </div>
                                {ejercicio.series && (
                                  <span className="text-sm text-green-500 font-medium">
                                    {ejercicio.series}
                                  </span>
                                )}
                              </li>
                            ))}
                            {dia.ejercicios.length > 3 && (
                              <li className="text-sm text-blue-500">
                                +{dia.ejercicios.length - 3} más...
                              </li>
                            )}
                          </ul>
                        )}
                      </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
