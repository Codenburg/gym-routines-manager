import { notFound } from "next/navigation";
import { getRutina } from "@/app/actions/rutinas";
import { RutinaForm } from "@/components/admin/rutina-form";
import { DiaManager } from "@/components/admin/dia-manager";
import { DeleteRutinaPageButton } from "@/components/admin/delete-rutina-page-button";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard } from "@/components/admin/admin-card";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface EditRutinaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRutinaPage({ params }: EditRutinaPageProps) {
  const { id } = await params;
  const rutina = await getRutina(id);

  if (!rutina) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Editar Rutina"
        backHref="/admin/rutinas"
        actions={<DeleteRutinaPageButton rutinaId={rutina.id} />}
      />

      {/* Edit Form */}
      <AdminCard variant="standard">
        <h2 className="text-lg font-semibold text-foreground mb-6">Detalles de la Rutina</h2>
        <RutinaForm
          initialData={{
            id: rutina.id,
            nombre: rutina.nombre,
            tipo: rutina.tipo as "fuerza" | "cardio" | "flexibilidad" | "hipertrofia",
            descripcion: rutina.descripcion || undefined,
          }}
        />
      </AdminCard>

      {/* Days Manager */}
      <AdminCard variant="standard">
        <DiaManager rutinaId={rutina.id} dias={rutina.dias} />
      </AdminCard>
    </div>
  );
}
