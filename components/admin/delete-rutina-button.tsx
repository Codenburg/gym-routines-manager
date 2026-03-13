"use client";

import { useState } from "react";
import { deleteRutina } from "@/app/actions/rutinas";

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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
