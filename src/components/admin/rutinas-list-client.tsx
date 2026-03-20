"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { deleteRutina, duplicateRutina } from "@/app/actions/rutinas";
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

const columns: ColumnDef<RutinaWithCount, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
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
      <span className="text-foreground font-medium">{row.original.nombre}</span>
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
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => (
      <span
        className="text-muted-foreground text-sm max-w-xs truncate block"
        title={row.original.descripcion || undefined}
      >
        {row.original.descripcion || "—"}
      </span>
    ),
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
];

function TableDuplicateButton({ rutinaId }: { rutinaId: string }) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  const handleDuplicate = async () => {
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
        router.refresh();
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
        router.refresh();
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  const filteredRutinas = rutinas.filter((rutina) => {
    const term = searchTerm.toLowerCase();
    return (
      rutina.nombre.toLowerCase().includes(term) ||
      rutina.tipo.toLowerCase().includes(term) ||
      rutina.descripcion?.toLowerCase().includes(term)
    );
  });

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: `¿Eliminar ${selectedIds.length} rutina${selectedIds.length > 1 ? "s" : ""}?`,
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      const deletePromises = selectedIds.map((id) => {
        const formData = new FormData();
        formData.append("id", id);
        return deleteRutina({ success: false }, formData);
      });
      const results = await Promise.all(deletePromises);
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        toast.success(`${selectedIds.length} rutina${selectedIds.length > 1 ? "s" : ""} eliminada${selectedIds.length > 1 ? "s" : ""}`);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error("Error al eliminar algunas rutinas");
      }
    } catch (error) {
      console.error("Error batch delete:", error);
      toast.error("Error al eliminar rutinas");
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
        onSelectionChange={handleSelectionChange}
      />

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
