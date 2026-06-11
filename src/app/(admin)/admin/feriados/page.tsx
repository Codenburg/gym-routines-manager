import { getFeriados } from "@/lib/feriados";
import { FeriadoManager } from "@/components/admin/feriado-manager";
import { PageHeader } from "@/components/admin/page-header";

export default async function AdminFeriadosPage() {
  const feriados = await getFeriados();

  // Pass dates as strings directly (calendar date, not timestamp)
  const serializableFeriados = feriados.map((f) => ({
    id: f.id,
    fecha: f.fecha, // String in YYYY-MM-DD format
    todo_dia: f.todo_dia,
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
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
