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

async function getDia(rutinaId: string, diaId: string): Promise<Dia | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = new URL(`${baseUrl}/api/rutinas/${rutinaId}/dias/${diaId}`);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch dia");
  }

  return response.json();
}

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ id: string; diaId: string }>;
}) {
  const { id: rutinaId, diaId } = await params;
  const dia = await getDia(rutinaId, diaId);

  if (!dia) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back button */}
        <Link
          href={`/rutinas/${rutinaId}`}
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
          Volver a la rutina
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {dia.nombre}
              </h1>
              {dia.musculosEnfocados && (
                <span className="inline-block rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400">
                  {dia.musculosEnfocados}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Ejercicios ({dia.ejercicios.length})
          </h2>

          {dia.ejercicios.length === 0 ? (
            <Card className="bg-neutral-900 border-white/20">
              <CardContent className="py-8 text-center text-slate-400">
                No hay ejercicios configurados para este día
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dia.ejercicios.map((ejercicio, index) => (
                <Card
                  key={ejercicio.id}
                  className="bg-neutral-900 border-white/20"
                >
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 text-red-400 text-lg font-bold">
                          {index + 1}
                        </span>
                        <CardTitle className="text-lg text-white">
                          {ejercicio.nombre}
                        </CardTitle>
                      </div>
                      {ejercicio.series && (
                        <span className="text-lg font-semibold text-green-400">
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
