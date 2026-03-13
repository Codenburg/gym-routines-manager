"use client";

import { useRouter } from "next/navigation";
import { deleteRutina } from "@/app/actions/rutinas";

interface DeleteRutinaPageButtonProps {
  rutinaId: string;
}

export function DeleteRutinaPageButton({ rutinaId }: DeleteRutinaPageButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.")) {
      return;
    }

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
    <button
      type="button"
      onClick={handleDelete}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Eliminar Rutina
    </button>
  );
}
