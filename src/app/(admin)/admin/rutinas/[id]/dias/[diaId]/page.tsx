import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRutina } from "@/app/actions/rutinas";
import { EjercicioList } from "@/components/admin/ejercicio-list";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard } from "@/components/admin/admin-card";

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
      {/* Breadcrumb via PageHeader */}
      <PageHeader
        title={dia.nombre}
        description={dia.musculosEnfocados || undefined}
        backHref={`/admin/rutinas/${id}`}
      />

      {/* Ejercicios List */}
      <AdminCard variant="standard">
        <EjercicioList
          diaId={dia.id}
          diaNombre={dia.nombre}
          rutinaId={rutina.id}
          ejercicios={dia.ejercicios}
        />
      </AdminCard>
    </div>
  );
}
