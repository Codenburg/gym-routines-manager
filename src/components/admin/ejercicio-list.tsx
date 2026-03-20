"use client";

import { useState } from "react";
import { useActionState } from "react";
import { deleteEjercicio } from "@/app/actions/ejercicios";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/admin-card";
import type { FormState } from "@/lib/schemas";
import { EjercicioForm } from "./ejercicio-form";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string | null;
  repes?: string | null;
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

  const [deleteState, deleteActionWrapped, isDeletePending] = useActionState(deleteActionTyped, initialState);

  const handleDelete = async (ejercicioId: string) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{diaNombre}</h2>
          <p className="text-muted-foreground text-sm">Administra los ejercicios del día</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar Ejercicio
        </Button>
      </div>

      {/* Add Exercise Form */}
      {isAdding && (
        <AdminCard variant="standard">
          <h3 className="text-lg font-semibold text-foreground mb-4">Nuevo Ejercicio</h3>
          <EjercicioForm
            diaId={diaId}
            onSuccess={() => setIsAdding(false)}
            onCancel={() => setIsAdding(false)}
          />
        </AdminCard>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        {ejercicios.map((ejercicio, index) => (
          <AdminCard key={ejercicio.id} variant="interactive">
            {/* Drag Handle */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            {editingId === ejercicio.id ? (
              <div className="pl-8">
                <EjercicioForm
                  initialData={{
                    id: ejercicio.id,
                    nombre: ejercicio.nombre,
                    series: ejercicio.series || undefined,
                    repes: ejercicio.repes || undefined,
                  }}
                  diaId={diaId}
                  onSuccess={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between py-4 pl-8">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-muted-foreground text-sm font-mono opacity-60">#{index + 1}</span>
                    <div>
                      <h3 className="text-foreground font-medium">{ejercicio.nombre}</h3>
                      <div className="flex gap-3 text-muted-foreground text-sm">
                        {ejercicio.series && <span>Series: {ejercicio.series}</span>}
                        {ejercicio.repes && <span>Repes: {ejercicio.repes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </AdminCard>
        ))}

        {ejercicios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay ejercicios en este día</p>
            <p className="text-muted-foreground text-sm mt-1 opacity-60">Agrega un ejercicio para empezar</p>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
