"use client";

import { memo } from "react";
import { Controller } from "react-hook-form";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeriesRepsInput } from "@/components/ui/series-reps-input";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Control, FieldErrors } from "react-hook-form";

interface EjercicioRowProps {
  control: Control<any>;
  id: string;
  name: string;
  index: number;
  diaIndex: number;
  diaId: string;
  onRemove: () => void;
  errors?: FieldErrors<any>;
}

export const EjercicioRow = memo(function EjercicioRow({
  control,
  id,
  name,
  index,
  diaIndex,
  diaId,
  onRemove,
  errors,
}: EjercicioRowProps) {
  const ejerciciosArrayErrors = errors as any;
  const ejercicioErrors = ejerciciosArrayErrors?.[index];
  const hasError = ejercicioErrors?.nombre;
  const hasFormatoError = ejercicioErrors?.formato;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    data: {
      type: "ejercicio",
      diaIndex,
      diaId,
      ejercicioIndex: index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`ejercicio-row-${index}`}
      className={cn(
        "flex items-start gap-3 py-1.5 px-1 rounded-lg hover:bg-muted/30 transition-colors",
        isDragging && "ejercicio-row-dragging",
        isOver && "dropzone-placeholder"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        data-testid={`ejercicio-drag-handle-${index}`}
        className={cn(
          "cursor-grab active:cursor-grabbing p-1 hover:bg-accent/50 rounded transition-colors shrink-0 touch-none mt-0.5",
          isDragging && "cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
        aria-label="Arrastrar ejercicio para reordenar"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Nombre */}
      <div className="flex-1 min-w-0">
        <Controller
          name={`${name}.nombre`}
          control={control}
          rules={{ required: "El nombre del ejercicio es requerido" }}
          render={({ field }) => (
            <Input
              data-testid={`ejercicio-nombre-${index}`}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              type="text"
              placeholder="Ej: Sentadillas con barra"
              className={cn("focus-input h-8", hasError && "border-destructive/50")}
            />
          )}
        />
        {hasError && (
          <p className="text-destructive text-xs mt-0.5">
            {typeof hasError === "object" ? hasError.message : hasError}
          </p>
        )}
      </div>

      {/* SeriesRepsInput */}
      <div className="shrink-0">
        <SeriesRepsInput
          name={`${name}.formato`}
          control={control}
          value={undefined}
        />
        {hasFormatoError && (
          <p className="text-destructive text-xs mt-0.5 text-center">
            {typeof hasFormatoError === "object" ? hasFormatoError.message : hasFormatoError}
          </p>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors shrink-0 mt-0.5"
        title="Eliminar ejercicio"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});