import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRutina } from "@/app/actions/rutinas";
import { EjercicioList } from "@/components/admin/ejercicio-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Rutinas
        </Link>
        <span className="text-[var(--muted-foreground)] opacity-50">/</span>
        <Link
          href={`/admin/rutinas/${id}`}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          {rutina.nombre}
        </Link>
        <span className="text-[var(--muted-foreground)] opacity-50">/</span>
        <span className="text-[var(--foreground)]">{dia.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/rutinas/${id}`}
          className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{dia.nombre}</h1>
          {dia.musculosEnfocados && (
            <p className="text-[var(--muted-foreground)] mt-1">{dia.musculosEnfocados}</p>
          )}
        </div>
      </div>

      {/* Ejercicios List */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
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
