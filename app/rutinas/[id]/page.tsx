import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Ejercicio {
  id: string;
  nombre: string;
  series: string | null;
  orden: number;
}

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  orden: number;
  ejercicios: Ejercicio[];
}

interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  dias: Dia[];
}

async function getRutina(id: string): Promise<Rutina | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = new URL(`${baseUrl}/api/rutinas/${id}`);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch rutina");
  }

  return response.json();
}

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rutina = await getRutina(id);

  if (!rutina) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-red-400 hover:text-red-300 mb-6 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Volver a mis rutinas
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {rutina.nombre}
              </h1>
              <span className="inline-block rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400">
                {rutina.tipo}
              </span>
            </div>
            {rutina.descripcion && (
              <p className="text-slate-400 mt-2">{rutina.descripcion}</p>
            )}
          </div>
        </div>

        {/* Days */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Días de entrenamiento ({rutina.dias.length})
          </h2>

          {rutina.dias.length === 0 ? (
            <Card className="bg-neutral-900 border-white/20">
              <CardContent className="py-8 text-center text-slate-400">
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
                  <Card className="bg-neutral-900 border-white/20 hover:border-red-500/50 hover:bg-neutral-800/80 transition-all cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-400 text-sm font-bold">
                            {index + 1}
                          </span>
                          {dia.nombre}
                        </CardTitle>
                        <div className="flex items-center gap-4">
                          {dia.musculosEnfocados && (
                            <span className="text-sm text-slate-400">
                              {dia.musculosEnfocados}
                            </span>
                          )}
                          {dia.ejercicios.length > 0 && (
                            <span className="text-sm text-red-400">
                              {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                      <CardContent>
                        {dia.ejercicios.length === 0 ? (
                          <p className="text-slate-500 text-sm">
                            No hay ejercicios configurados
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {dia.ejercicios.slice(0, 3).map((ejercicio, ejIndex) => (
                              <li
                                key={ejercicio.id}
                                className="flex items-center justify-between text-slate-300"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-500 text-sm w-6">
                                    {ejIndex + 1}.
                                  </span>
                                  {ejercicio.nombre}
                                </div>
                                {ejercicio.series && (
                                  <span className="text-sm text-green-400">
                                    {ejercicio.series}
                                  </span>
                                )}
                              </li>
                            ))}
                            {dia.ejercicios.length > 3 && (
                              <li className="text-sm text-red-400">
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
