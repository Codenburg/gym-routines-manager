import { getFeriados } from "@/app/actions/feriados";
import { FeriadoManager } from "@/components/admin/feriado-manager";
import { PageHeader } from "@/components/admin/page-header";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminFeriadosPage() {
  const feriados = await getFeriados();

  // Transform dates for client component
  const serializableFeriados = feriados.map((f) => ({
    id: f.id,
    fecha: new Date(f.fecha),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feriados"
        description="Días no laborales"
        backHref="/admin"
      />

      {/* Feriado Manager */}
      <FeriadoManager initialFeriados={serializableFeriados} />
    </div>
  );
}
