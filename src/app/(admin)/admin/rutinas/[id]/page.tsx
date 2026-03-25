import { notFound } from "next/navigation";
import { getCachedRutinaById } from "@/lib/rutinas";
import { RutinaForm } from "@/components/admin/rutina-form";
import { DiaManager } from "@/components/admin/dia-manager";
import { DeleteRutinaPageButton } from "@/components/admin/delete-rutina-page-button";
import { PageHeader } from "@/components/admin/page-header";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface EditRutinaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRutinaPage({ params }: EditRutinaPageProps) {
  const { id } = await params;
  const rutina = await getCachedRutinaById(id);

  if (!rutina) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Editar Rutina"
        backHref="/admin/rutinas"
        actions={<DeleteRutinaPageButton rutinaId={rutina.id} />}
      />

      {/* Days Manager - dominant section */}
      <DiaManager rutinaId={rutina.id} dias={rutina.dias} />

      {/* Edit Form - secondary section */}
      <RutinaForm
        initialData={{
          id: rutina.id,
          nombre: rutina.nombre,
          tipo: rutina.tipo as "fuerza" | "cardio" | "flexibilidad" | "hipertrofia",
          descripcion: rutina.descripcion || undefined,
        }}
      />
    </div>
  );
}
