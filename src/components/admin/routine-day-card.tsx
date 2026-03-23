"use client";

import { useState } from "react";
import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { updateDia, deleteDia } from "@/app/actions/dias";
import type { FormState } from "@/lib/schemas";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Dumbbell,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string | null;
  repes?: string | null;
}

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados?: string | null;
  orden: number;
  ejercicios: Ejercicio[];
}

interface RoutineDayCardProps {
  dia: Dia;
  rutinaId: string;
  index: number;
  onDayUpdated?: () => void;
  onDayDeleted?: () => void;
}

type DiaFormState = FormState<{ id: string }>;

const initialState: DiaFormState = {
  success: false,
};

// Cast server actions to proper type
const updateActionTyped = updateDia as unknown as (
  state: DiaFormState | null,
  formData: FormData
) => Promise<DiaFormState>;

const deleteActionTyped = deleteDia as unknown as (
  state: DiaFormState | null,
  formData: FormData
) => Promise<DiaFormState>;

export function RoutineDayCard({
  dia,
  rutinaId,
  index,
  onDayUpdated,
  onDayDeleted,
}: RoutineDayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { confirm, Dialog } = useConfirm();

  const [updateState, updateActionWrapped, isUpdatePending] = useActionState(
    updateActionTyped,
    initialState
  );

  const [deleteState, deleteActionWrapped, isDeletePending] = useActionState(
    deleteActionTyped,
    initialState
  );

  const exerciseCount = dia.ejercicios?.length || 0;

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "¿Eliminar día?",
      description: `Esta acción eliminará "${dia.nombre}" y todos sus ejercicios. Esta acción no se puede deshacer.`,
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("id", dia.id);
    formData.append("rutinaId", rutinaId);
    const result = await deleteActionTyped(null, formData);
    if (result.success) {
      onDayDeleted?.();
    }
  };

  const handleSave = async (formData: FormData) => {
    formData.set("id", dia.id);
    formData.set("rutinaId", rutinaId);
    const result = await updateActionTyped(null, formData);
    if (result.success) {
      setIsEditing(false);
      onDayUpdated?.();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl transition-all duration-200",
          // Light mode
          "bg-[--daycard-bg] border border-[--daycard-border] shadow-sm",
          // Dark mode
          "dark:bg-[--daycard-bg] dark:border-[--daycard-border]",
          // Interactive hover
          "hover:shadow-md hover:scale-[1.01]",
          // Focus
          "focus-within:ring-2 focus-within:ring-[#E11D48] focus-within:ring-offset-2 focus-within:ring-offset-background"
        )}
      >
        {isEditing ? (
          // Edit Mode
          <form action={handleSave} className="p-4 space-y-3">
            <AdminFormField variant="default" label="Nombre del día">
              <Input
                name="nombre"
                defaultValue={dia.nombre}
                required
                placeholder="Ej: Día 1 - Pecho"
                disabled={isUpdatePending}
              />
            </AdminFormField>

            <AdminFormField variant="default" label="Músculos Enfocados">
              <Input
                name="musculosEnfocados"
                defaultValue={dia.musculosEnfocados || ""}
                placeholder="Ej: Pecho, tríceps"
                disabled={isUpdatePending}
              />
            </AdminFormField>

            {/* Error message */}
            {updateState && !updateState.success && updateState.message && (
              <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-sm">{updateState.message}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatePending}
                className="flex-1 bg-[#E11D48] hover:bg-[#be123c] text-white"
              >
                {isUpdatePending ? (
                  "Guardando..."
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Guardar
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdatePending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Day Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#E11D48]/10">
                  <Dumbbell className="w-4 h-4 text-[--daycard-icon]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[--daycard-subtitle] text-xs font-mono opacity-60">
                      #{index + 1}
                    </span>
                    <h3 className="text-[--daycard-title] font-semibold text-base">
                      {dia.nombre}
                    </h3>
                  </div>
                  {dia.musculosEnfocados && (
                    <p className="text-[--daycard-subtitle] text-sm mt-0.5">
                      {dia.musculosEnfocados}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-md hover:bg-[--daycard-border] text-[--daycard-subtitle] hover:text-[--daycard-title] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
                  aria-label="Editar día"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeletePending}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-[--daycard-subtitle] hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
                  aria-label="Eliminar día"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Exercise Preview */}
            <div className="mt-3 space-y-1.5">
              {dia.ejercicios.slice(0, 3).map((ejercicio) => (
                <div
                  key={ejercicio.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[--daycard-subtitle] truncate flex-1">
                    {ejercicio.nombre}
                  </span>
                  {ejercicio.series && ejercicio.repes && (
                    <span className="text-[--daycard-subtitle] opacity-60 ml-2 flex-shrink-0">
                      {ejercicio.series} × {ejercicio.repes}
                    </span>
                  )}
                </div>
              ))}
              {dia.ejercicios.length > 3 && (
                <p className="text-[--daycard-subtitle] text-xs opacity-60">
                  +{dia.ejercicios.length - 3} más
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[--daycard-border] flex items-center justify-between">
              {/* Exercise Count Badge */}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  "border border-[--daycard-badge-border] text-[--daycard-badge-text]"
                )}
              >
                {exerciseCount} ejercicio{exerciseCount !== 1 ? "s" : ""}
              </span>

              {/* Link to day detail */}
              <a
                href={`/admin/rutinas/${rutinaId}/dias/${dia.id}`}
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium",
                  "text-[--daycard-icon] hover:opacity-80 transition-opacity"
                )}
              >
                Ir a día
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
      {Dialog}
    </>
  );
}
