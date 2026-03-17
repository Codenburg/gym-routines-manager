"use client";

import { useState } from "react";
import { deleteRutina } from "@/app/actions/rutinas";
import { Trash2 } from "lucide-react";

interface DeleteRutinaButtonProps {
  rutinaId: string;
}

export function DeleteRutinaButton({ rutinaId }: DeleteRutinaButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta rutina?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", rutinaId);
      // @ts-ignore - Type mismatch with FormState
      await deleteRutina({ success: false }, formData);
      window.location.href = "/admin/rutinas";
    } catch (error) {
      console.error("Error deleting:", error);
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 hover:bg-red-900/30 rounded-lg text-white/60 hover:text-red-400 transition-colors disabled:opacity-50"
      title="Eliminar"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
