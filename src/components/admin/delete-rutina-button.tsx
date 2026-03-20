"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRutina } from "@/app/actions/rutinas";
import { useConfirm } from "@/hooks/use-confirm";

interface DeleteRutinaButtonProps {
  rutinaId: string;
}

export function DeleteRutinaButton({ rutinaId }: DeleteRutinaButtonProps) {
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
        toast.success("Rutina eliminada exitosamente");
        router.refresh();
      } else {
        toast.error(result.message || "Error al eliminar la rutina");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar la rutina");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 hover:bg-[var(--destructive)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive-foreground)] transition-colors disabled:opacity-50"
        title="Eliminar"
      >
        <Trash2 className="w-5 h-5" />
      </button>
      {Dialog}
    </>
  );
}
