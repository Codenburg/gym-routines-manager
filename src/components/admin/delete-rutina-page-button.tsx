"use client";

import { useRouter } from "next/navigation";
import { deleteRutina } from "@/app/actions/rutinas";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

interface DeleteRutinaPageButtonProps {
  rutinaId: string;
}

export function DeleteRutinaPageButton({ rutinaId }: DeleteRutinaPageButtonProps) {
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

    try {
      const formData = new FormData();
      formData.append("id", rutinaId);
      // @ts-ignore - Type mismatch with FormState
      await deleteRutina({ success: false }, formData);
      router.push("/admin/rutinas");
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)] rounded-lg transition-colors"
      >
        <Trash2 className="w-5 h-5" />
        Eliminar Rutina
      </button>
      {Dialog}
    </>
  );
}
