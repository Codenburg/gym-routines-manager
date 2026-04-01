import { notFound } from "next/navigation";
import { getCachedRutinaById } from "@/lib/rutinas";
import { RutinaEditForm } from "@/components/admin/rutina-edit-form";
import { DeleteRutinaPageButton } from "@/components/admin/delete-rutina-page-button";
import { PageHeader } from "@/components/admin/page-header";

// Helper to build formato from series and repes
function buildFormato(series: number | null, repes: number | null): string {
  if (series && repes) {
    return `${series}x${repes}`;
  }
  return "";
}

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

      {/* Unified form: details + days with drag-and-drop */}
      <RutinaEditForm
        initialData={{
          id: rutina.id,
          nombre: rutina.nombre,
          tipo: rutina.tipo as "fuerza" | "cardio" | "flexibilidad" | "hipertrofia",
          descripcion: rutina.descripcion || undefined,
          dias: rutina.dias.map((dia) => ({
            id: dia.id,
            nombre: dia.nombre,
            musculosEnfocados: dia.musculosEnfocados || "",
            ejercicios: dia.ejercicios.map((ej) => ({
              id: ej.id,
              nombre: ej.nombre,
              formato: buildFormato(ej.series, ej.repes),
            })),
          })),
        }}
      />
    </div>
  );
}
