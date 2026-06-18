"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteEjercicio } from "@/app/actions/ejercicios";
import type { FormState } from "@/lib/schemas";
import { EjercicioForm } from "./ejercicio-form";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: number | null;
  repes?: number | null;
  orden: number;
}

interface EjercicioListProps {
  diaId: string;
  diaNombre: string;
  rutinaId: string;
  ejercicios: Ejercicio[];
}

type EjercicioFormState = FormState<{ id: string }>;

const initialState: EjercicioFormState = {
  success: false,
};

const deleteActionTyped = deleteEjercicio as unknown as (state: EjercicioFormState | null, formData: FormData) => Promise<EjercicioFormState>;

export function EjercicioList({ diaId, diaNombre, rutinaId, ejercicios }: EjercicioListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { confirm, Dialog } = useConfirm();
  const router = useRouter();

  const [deleteState, deleteActionWrapped, isDeletePending] = useActionState(deleteActionTyped, initialState);

  // Handle delete success/error
  useEffect(() => {
    if (deleteState?.success) {
      toast.success("Ejercicio eliminado");
    } else if (deleteState?.success === false && deleteState.message) {
      toast.error(deleteState.message);
    }
  }, [deleteState]);

  // Handler for successful create - refresh server data then update local state
  const handleCreateSuccess = () => {
    toast.success("¡Ejercicio creado!");
    router.refresh();
    setIsAdding(false);
  };

  // Handler for successful edit - refresh server data then update local state
  const handleEditSuccess = () => {
    toast.success("¡Ejercicio actualizado!");
    router.refresh();
    setEditingId(null);
  };

  const handleDelete = async (ejercicioId: string) => {
    // eslint-disable-next-line @admin/no-window-alert
    const confirmed = await confirm({
      title: "¿Eliminar ejercicio?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    const formData = new FormData();
    formData.append("id", ejercicioId);
    await deleteActionTyped(null, formData);
  };

  return (
    <div className="bg-white dark:bg-[#121212] rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a2a] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Ejercicios del día</h2>
          <p className="text-muted-foreground text-xs">
            {ejercicios.length} ejercicio{ejercicios.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Add Exercise Form */}
      {isAdding && (
        <div className="p-4 bg-[#f3f4f6] dark:bg-[#1a1a1a] rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a2a] space-y-4">
          <EjercicioForm
            diaId={diaId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Add exercise button - gray bar in light mode */}
      {!isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-3 px-4 bg-[#f3f4f6] hover:bg-gray-200 text-[#6b7280] hover:text-[#4b5563] transition-colors rounded-2xl flex items-center justify-center gap-2 text-sm font-medium border border-[#e5e7eb] dark:bg-[#1a1a1a] dark:hover:bg-[#222222] dark:text-[#6b7280] dark:hover:text-[#9ca3af] dark:border-[#2a2a2a]"
        >
          <span className="h-4 w-4">+</span>
          <span>Agregar Ejercicio</span>
        </button>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        {ejercicios.map((ejercicio, index) => (
          <div
            key={ejercicio.id}
            className="group bg-[#fafafa] dark:bg-[#1a1a1a] rounded-xl border border-[#e5e7eb] dark:border-[#27272a] p-4"
          >
            {editingId === ejercicio.id ? (
              <EjercicioForm
                initialData={{
                  id: ejercicio.id,
                  nombre: ejercicio.nombre,
                  series: ejercicio.series?.toString() || undefined,
                  repes: ejercicio.repes?.toString() || undefined,
                }}
                diaId={diaId}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-muted-foreground text-sm font-mono opacity-60">#{index + 1}</span>
                    <div>
                      <h3 className="text-foreground font-medium">{ejercicio.nombre}</h3>
                      <div className="flex gap-3 text-muted-foreground text-sm">
                        {ejercicio.series && <span>Series: {ejercicio.series}</span>}
                        {ejercicio.repes && <span>Repes: {ejercicio.repes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(editingId === ejercicio.id ? null : ejercicio.id)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ejercicio.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {ejercicios.length === 0 && !isAdding && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">No hay ejercicios en este día</p>
            <p className="text-muted-foreground text-sm mt-1 opacity-60">Agrega un ejercicio para empezar</p>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
