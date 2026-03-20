import { RutinaCompletaForm } from "@/components/admin/rutina-completa-form";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard } from "@/components/admin/admin-card";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function NewRutinaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Nueva Rutina"
        backHref="/admin/rutinas"
      />

      {/* Form */}
      <AdminCard variant="standard">
        <RutinaCompletaForm />
      </AdminCard>
    </div>
  );
}
