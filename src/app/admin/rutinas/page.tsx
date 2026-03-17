import Link from "next/link";
import { getRutinas, deleteRutina } from "@/app/actions/rutinas";
import { AuthGuard } from "@/components/auth-guard";
import { DeleteRutinaButton } from "@/components/admin/delete-rutina-button";
import { ArrowLeft, Plus, Pencil, FileText } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminRutinasPage() {
  const rutinas = await getRutinas();

  return (
    <AuthGuard>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Rutinas</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Administra todas las rutinas</p>
        </div>
        <Link
          href="/admin/rutinas/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)] rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Rutina
        </Link>
      </div>

      {/* Rutinas List */}
      {rutinas.length > 0 ? (
        <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-4 text-[var(--muted-foreground)] font-medium text-sm">Nombre</th>
                <th className="text-left px-6 py-4 text-[var(--muted-foreground)] font-medium text-sm">Tipo</th>
                <th className="text-left px-6 py-4 text-[var(--muted-foreground)] font-medium text-sm">Creador</th>
                <th className="text-left px-6 py-4 text-[var(--muted-foreground)] font-medium text-sm">Días</th>
                <th className="text-left px-6 py-4 text-[var(--muted-foreground)] font-medium text-sm">Descripción</th>
                <th className="text-right px-6 py-4 text-[var(--muted-foreground)] font-medium text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutinas.map((rutina) => (
                <tr key={rutina.id} className="border-b border-[var(--card-border)] hover:bg-[var(--background)] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[var(--foreground)] font-medium">{rutina.nombre}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[var(--button-secondary-bg)] rounded text-xs text-[var(--muted-foreground)] capitalize">
                      {rutina.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--foreground)] text-sm">
                    {rutina.creador || "—"}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted-foreground)]">
                    {rutina.diasCount || 0} día{(rutina.diasCount || 0) !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted-foreground)] text-sm max-w-xs truncate">
                    {rutina.descripcion || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/rutinas/${rutina.id}`}
                        className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <DeleteRutinaButton rutinaId={rutina.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--button-secondary-bg)]/50 rounded-xl border border-[var(--card-border)]">
          <FileText className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)] text-lg">No hay rutinas creadas</p>
          <p className="text-[var(--muted-foreground)] text-sm mt-2 mb-6">Crea tu primera rutina para comenzar</p>
          <Link
            href="/admin/rutinas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)] rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Rutina
          </Link>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
