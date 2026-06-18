"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { deleteRutina, deleteRutinas, duplicateRutina } from "@/app/actions/rutinas";
import { useConfirm } from "@/hooks/use-confirm";

interface CreadorUser {
  id: string;
  name: string;
}

interface RutinaWithCount {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creadorId: string;
  creadorUser: CreadorUser;
  diasCount: number;
}

interface RutinasListClientProps {
  rutinas: RutinaWithCount[];
}

function TableDuplicateButton({ rutinaId }: { rutinaId: string }) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  const handleDuplicate = async () => {
    // eslint-disable-next-line @admin/no-window-alert
    const confirmed = await confirm({
      title: "¿Duplicar rutina?",
      variant: "default",
      confirmText: "Duplicar",
    });
    if (!confirmed) return;

    setIsDuplicating(true);
    try {
      const formData = new FormData();
      formData.append("id", rutinaId);
      const result = await duplicateRutina({ success: false }, formData);
      if (result.success) {
        toast.success("Rutina duplicada");
      } else {
        toast.error(result.message || "Error al duplicar la rutina");
      }
    } catch (error) {
      console.error("Error duplicating:", error);
      toast.error("Error al duplicar la rutina");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={isDuplicating}
        className={cn(
          "inline-flex items-center justify-center p-2 rounded-md",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted transition-colors",
          "disabled:opacity-50"
        )}
        title="Duplicar"
      >
        <Copy className="w-4 h-4" />
      </button>
      {Dialog}
    </>
  );
}

function TableDeleteButton({ rutinaId }: { rutinaId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  const handleDelete = async () => {
    // eslint-disable-next-line @admin/no-window-alert
    const confirmed = await confirm({
      title: "¿Eliminar rutina?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", rutinaId);
      const result = await deleteRutina({ success: false }, formData);
      if (result.success) {
        toast.success("Rutina eliminada");
      } else {
        toast.error(result.message || "Error al eliminar la rutina");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar la rutina");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          "inline-flex items-center justify-center p-2 rounded-md",
          "text-muted-foreground hover:text-destructive",
          "hover:bg-destructive/10 transition-colors",
          "disabled:opacity-50"
        )}
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {Dialog}
    </>
  );
}

export function RutinasListClient({ rutinas }: RutinasListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  // Derivar selectedIds desde rowSelection — única fuente de verdad
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  // Set para lookup O(1) en lugar de O(n) con includes
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // filteredRutinas — memoizada para evitar O(n) en cada render
  const filteredRutinas = useMemo(() => {
    return rutinas.filter((rutina) => {
      const term = searchTerm.toLowerCase();
      return (
        rutina.nombre.toLowerCase().includes(term) ||
        rutina.tipo.toLowerCase().includes(term) ||
        rutina.creadorUser?.name.toLowerCase().includes(term)
      );
    });
  }, [rutinas, searchTerm]);

  // allFilteredSelected / someFilteredSelected — memoizados para evitar O(n) en cada render
  const allFilteredSelected = useMemo(() => {
    return filteredRutinas.length > 0 && filteredRutinas.every((r) => selectedIdsSet.has(r.id));
  }, [filteredRutinas, selectedIdsSet]);

  const someFilteredSelected = useMemo(() => {
    return filteredRutinas.some((r) => selectedIdsSet.has(r.id));
  }, [filteredRutinas, selectedIdsSet]);

  // Toggle que opera sobre filtradas, no sobre página de TanStack
  const toggleAllFiltered = useCallback(() => {
    if (allFilteredSelected) {
      // Deseleccionar todas las filtradas
      setRowSelection((prev) => {
        const next = { ...prev };
        filteredRutinas.forEach((r) => delete next[r.id]);
        return next;
      });
    } else {
      // Seleccionar todas las filtradas
      setRowSelection((prev) => {
        const next = { ...prev };
        filteredRutinas.forEach((r) => { next[r.id] = true; });
        return next;
      });
    }
  }, [allFilteredSelected, filteredRutinas]);

  // columns movido adentro para acceder a filteredRutinas y rowSelection
  // memoizado para evitar re-renders innecesarios
  const columns = useMemo<ColumnDef<RutinaWithCount, unknown>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={allFilteredSelected}
            ref={(el) => {
              if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
            }}
            onChange={toggleAllFiltered}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => (
          <div data-testid="rutina-list-item">
            <span
              className="text-foreground font-medium"
              data-testid="rutina-list-item-nombre"
            >
              {row.original.nombre}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.tipo}
          </Badge>
        ),
      },
      {
        accessorKey: "creadorUser.name",
        header: "Creador",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.creadorUser?.name || "—"}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <TableDuplicateButton rutinaId={row.original.id} />
            <Link
              href={`/admin/rutinas/${row.original.id}`}
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-md",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted transition-colors"
              )}
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <TableDeleteButton rutinaId={row.original.id} />
          </div>
        ),
      },
    ],
    [allFilteredSelected, someFilteredSelected, toggleAllFiltered]
  );

  const handleRowSelectionChange = (newSelection: Record<string, boolean>) => {
    setRowSelection(newSelection);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    // eslint-disable-next-line @admin/no-window-alert
    const confirmed = await confirm({
      title: `¿Eliminar ${selectedIds.length} rutina${selectedIds.length > 1 ? "s" : ""}?`,
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      const formData = new FormData();
      formData.append("ids", JSON.stringify(selectedIds));
      const result = await deleteRutinas({ success: false }, formData);

      if (result.success) {
        toast.success(`${selectedIds.length} rutina${selectedIds.length > 1 ? "s" : ""} eliminada${selectedIds.length > 1 ? "s" : ""}`);
        setRowSelection({}); // Limpiar selección local
      } else {
        toast.error(result.message || "Error al eliminar rutinas");
      }
    } catch (error) {
      console.error("Error batch delete:", error);
      toast.error("Error al eliminar rutinas");
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredRutinas.length / pagination.pageSize));

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar rutinas..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
        />
      </div>

      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-foreground">
            {selectedIds.length} rutina{selectedIds.length > 1 ? "s" : ""} seleccionada{selectedIds.length > 1 ? "s" : ""}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar selección
          </Button>
        </div>
      )}

      {/* Table */}
      <AdminTable
        variant="selectable"
        columns={columns}
        data={filteredRutinas}
        emptyMessage="No hay rutinas creadas"
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      {/* Pagination Controls — 100% React state, sin tableRef */}
      {filteredRutinas.length > 0 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
            disabled={pagination.pageIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página{" "}
            <span className="text-foreground font-medium">
              {pagination.pageIndex + 1}
            </span>{" "}
            de{" "}
            <span className="text-foreground font-medium">
              {totalPages}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
            disabled={pagination.pageIndex >= totalPages - 1}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* No results message when search yields nothing */}
      {searchTerm && filteredRutinas.length === 0 && rutinas.length > 0 && (
        <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
          <p className="text-muted-foreground text-lg">
            No se encontraron resultados
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            No se encontraron rutinas que coincidan con &ldquo;{searchTerm}&rdquo;
          </p>
        </div>
      )}
      {Dialog}
    </div>
  );
}
