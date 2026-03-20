"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, FileText, Copy } from "lucide-react";
import { DeleteRutinaButton } from "@/components/admin/delete-rutina-button";
import { duplicateRutina } from "@/app/actions/rutinas";
import { useConfirm } from "@/hooks/use-confirm";

interface RutinaWithCount {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creador: string | null;
  diasCount: number;
}

interface RutinasListClientProps {
  rutinas: RutinaWithCount[];
}

export function RutinasListClient({ rutinas }: RutinasListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  const handleDuplicate = async (rutinaId: string) => {
    const confirmed = await confirm({
      title: "¿Duplicar rutina?",
      variant: "default",
      confirmText: "Duplicar",
    });
    if (!confirmed) return;

    setIsDuplicating(rutinaId);
    try {
      const formData = new FormData();
      formData.append("id", rutinaId);
      const result = await duplicateRutina({ success: false }, formData);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message || "Error al duplicar la rutina");
      }
    } catch (error) {
      console.error("Error duplicating:", error);
      alert("Error al duplicar la rutina");
    } finally {
      setIsDuplicating(null);
    }
  };

  const filteredRutinas = rutinas.filter((rutina) => {
    const term = searchTerm.toLowerCase();
    return (
      rutina.nombre.toLowerCase().includes(term) ||
      rutina.tipo.toLowerCase().includes(term) ||
      rutina.descripcion?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar rutinas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-foreground)] placeholder:[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--button-primary-bg)] focus:border-transparent transition-colors"
        />
      </div>

      {/* Table or Empty State */}
      {filteredRutinas.length > 0 ? (
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
              {filteredRutinas.map((rutina) => (
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
                      <button
                        type="button"
                        onClick={() => handleDuplicate(rutina.id)}
                        disabled={isDuplicating === rutina.id}
                        className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                        title="Duplicar"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
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
            Crear Rutina
          </Link>
        </div>
      )}

      {/* No results message when search yields nothing */}
      {searchTerm && filteredRutinas.length === 0 && rutinas.length > 0 && (
        <div className="text-center py-12 bg-[var(--button-secondary-bg)]/50 rounded-xl border border-[var(--card-border)]">
          <p className="text-[var(--muted-foreground)] text-lg">No se encontraron resultados</p>
          <p className="text-[var(--muted-foreground)] text-sm mt-2">
          No se encontraron rutinas que coincidan con &ldquo;{searchTerm}&rdquo;
          </p>
        </div>
      )}
      {Dialog}
    </div>
  );
}
