import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRutina } from "@/app/actions/rutinas";
import { EjercicioList } from "@/components/admin/ejercicio-list";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface EjerciciosPageProps {
  params: Promise<{
    id: string;
    diaId: string;
  }>;
}

export default async function EjerciciosPage({ params }: EjerciciosPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  const { id, diaId } = await params;
  const rutina = await getRutina(id);

  if (!rutina) {
    notFound();
  }

  const dia = rutina.dias.find((d) => d.id === diaId);

  if (!dia) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/rutinas"
          className="text-white/60 hover:text-white transition-colors"
        >
          Rutinas
        </Link>
        <span className="text-white/30">/</span>
        <Link
          href={`/admin/rutinas/${id}`}
          className="text-white/60 hover:text-white transition-colors"
        >
          {rutina.nombre}
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white">{dia.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/rutinas/${id}`}
          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dia.nombre}</h1>
          {dia.musculosEnfocados && (
            <p className="text-white/60 mt-1">{dia.musculosEnfocados}</p>
          )}
        </div>
      </div>

      {/* Ejercicios List */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <EjercicioList
          diaId={dia.id}
          diaNombre={dia.nombre}
          rutinaId={rutina.id}
          ejercicios={dia.ejercicios}
        />
      </div>
    </div>
  );
}
