import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  orden: number;
  ejercicios: {
    id: string;
    nombre: string;
    orden: number;
  }[];
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
    <div className="min-h-screen bg-slate-900">
      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors"
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
              <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400">
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
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-8 text-center text-slate-400">
                No hay días configurados en esta rutina
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {rutina.dias.map((dia, index) => (
                <Card
                  key={dia.id}
                  className="bg-slate-800 border-slate-700"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                          {index + 1}
                        </span>
                        {dia.nombre}
                      </CardTitle>
                      {dia.musculosEnfocados && (
                        <span className="text-sm text-slate-400">
                          {dia.musculosEnfocados}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dia.ejercicios.length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        No hay ejercicios configurados
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {dia.ejercicios.map((ejercicio, ejIndex) => (
                          <li
                            key={ejercicio.id}
                            className="flex items-center gap-3 text-slate-300"
                          >
                            <span className="text-slate-500 text-sm w-6">
                              {ejIndex + 1}.
                            </span>
                            {ejercicio.nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
