import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCachedRutinaById } from "@/lib/rutinas";
import { EjercicioList } from "@/components/admin/ejercicio-list";
import { PageHeader } from "@/components/admin/page-header";

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
  const rutina = await getCachedRutinaById(id);

  if (!rutina) {
    notFound();
  }

  const dia = rutina.dias.find((d) => d.id === diaId);

  if (!dia) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb via PageHeader */}
      <PageHeader
        title={`Día ${dia.orden}`}
        description={dia.musculosEnfocados?.join(", ") ?? undefined}
        backHref={`/admin/rutinas/${id}`}
      />

      {/* Ejercicios List */}
      <EjercicioList
        diaId={dia.id}
        diaNombre={`Día ${dia.orden}`}
        rutinaId={rutina.id}
        ejercicios={dia.ejercicios}
      />
    </div>
  );
}
