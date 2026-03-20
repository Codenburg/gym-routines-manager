"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import { DeleteRutinaButton } from "@/components/admin/delete-rutina-button";
import { duplicateRutina, deleteRutinas } from "@/app/actions/rutinas";
import { useConfirm } from "@/hooks/use-confirm";
import { Checkbox } from "@/components/ui/checkbox";

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

  // Selection state for multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRutinas = rutinas.filter((rutina) => {
    const term = searchTerm.toLowerCase();
    return (
      rutina.nombre.toLowerCase().includes(term) ||
      rutina.tipo.toLowerCase().includes(term) ||
      rutina.descripcion?.toLowerCase().includes(term)
    );
  });

  // Selection helper functions (defined after filteredRutinas)
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredRutinas.map((r) => r.id)));
  const deselectAll = () => setSelectedIds(new Set());
  const isAllSelected = filteredRutinas.length > 0 && selectedIds.size === filteredRutinas.length;
  const isSelected = (id: string) => selectedIds.has(id);

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selectedIds.size} rutinas?\nEsta acción no se puede deshacer.`)) {
      return;
    }

    const formData = new FormData();
    formData.set("ids", JSON.stringify(Array.from(selectedIds)));

    // Pass promise DIRECTLY - NO async wrapper
    const promise = deleteRutinas({ success: false }, formData);
    toast.promise(promise, {
      loading: "Eliminando rutinas...",
      success: (result) => {
        const data = result as { success: true; data: { deletedCount: number } };
        setSelectedIds(new Set()); // CRITICAL: clean BEFORE refresh
        router.refresh();
        return `${data.data.deletedCount} rutinas eliminadas`;
      },
      error: (err: { message?: string }) => err.message || "Error al eliminar rutinas",
    });
  };

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
        toast.error(result.message || "Error al duplicar la rutina");
      }
    } catch (error) {
      console.error("Error duplicating:", error);
      toast.error("Error al duplicar la rutina");
    } finally {
      setIsDuplicating(null);
    }
  };

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

      {/* Bulk Delete UI */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg">
          <span className="text-sm text-[var(--destructive)] font-medium">
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="ml-auto px-3 py-1.5 bg-[var(--destructive)] text-[var(--destructive-foreground)] text-sm font-medium rounded-md hover:bg-[var(--destructive)]/90 transition-colors"
          >
            Eliminar seleccionadas
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Table or Empty State */}
      {filteredRutinas.length > 0 ? (
        <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="w-12 px-6 py-4">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={selectedIds.size > 0 && !isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked === true) selectAll();
                      else deselectAll();
                    }}
                    aria-label="Seleccionar todas"
                  />
                </th>
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
                  <td className="w-12 px-6 py-4">
                    <Checkbox
                      checked={isSelected(rutina.id)}
                      onCheckedChange={() => toggleSelection(rutina.id)}
                      aria-label={`Seleccionar ${rutina.nombre}`}
                    />
                  </td>
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
