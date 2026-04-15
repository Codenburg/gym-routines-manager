"use client";

import { useCallback, useEffect, useRef } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { EjercicioRow } from "./ejercicio-row";
import { cn } from "@/lib/utils";
import type { Control, FieldErrors } from "react-hook-form";

interface DiaSectionProps {
  field: { id: string };
  baseName: string;
  diaIndex: number;
  dayNumber: number;
  control: Control<any>;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  errors?: FieldErrors<any>;
  /** Callback to register this day's ejercicios move function with the parent form */
  onRegisterEjerciciosMove?: (moveFn: (from: number, to: number) => void) => void;
}

function DiaSectionComponent({
  field,
  baseName,
  diaIndex,
  dayNumber,
  control,
  isExpanded,
  onToggle,
  onRemove,
  errors,
  onRegisterEjerciciosMove,
}: DiaSectionProps) {
  const diasErrors = errors?.dias as any;
  const diaErrors = diasErrors?.[diaIndex];

  // useSortable for the entire day
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: "dia",
      diaId: field.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Field array for ejercicios within this day
  const {
    fields: ejercicioFields,
    append: appendEjercicio,
    remove: removeEjercicio,
    move: moveEjercicio,
  } = useFieldArray({
    control,
    name: `${baseName}.ejercicios`,
    shouldUnregister: false,
  });

  // Ref to track move function — updated whenever useFieldArray's move changes
  const moveEjercicioRef = useRef(moveEjercicio);
  useEffect(() => {
    moveEjercicioRef.current = moveEjercicio;
  }, [moveEjercicio]);

  // Register this day's ejercicios move function with parent form
  // Cleanup: unregister on unmount or when baseName changes
  useEffect(() => {
    if (!onRegisterEjerciciosMove) return;

    onRegisterEjerciciosMove(moveEjercicioRef.current);

    return () => {
      // Unregister by setting to null (handled by parent)
    };
  }, [onRegisterEjerciciosMove, baseName]);

  // Memoized ejercicio IDs for SortableContext
  const sortableEjercicioIds = useCallback(
    () => ejercicioFields.map((e) => e.id),
    [ejercicioFields]
  );

  // Add new exercise to this day
  const addExercise = useCallback(() => {
    appendEjercicio({ nombre: "", formato: "" });
  }, [appendEjercicio]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card dark:bg-card rounded-xl shadow-sm dark:shadow-black/20 overflow-hidden border border-border theme-transition",
        isDragging && "day-card-dragging"
      )}
    >
      {/* Header with collapse toggle, drag handle, and delete button */}
      {/* Structure: grabber (drag ONLY) | chevron + clickable area for navigation */}
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-3 py-2.5 theme-transition rounded-t-xl",
          !isDragging && "hover:bg-muted/50",
          isExpanded && "border-b border-border"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Drag handle for the day - EXCLUSIVE listeners, no onClick */}
          {/* touch-action: none prevents browser from intercepting touch for scroll */}
          <button
            type="button"
            data-testid={`dia-drag-handle-${diaIndex}`}
            className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 hover:bg-accent/50 rounded transition-colors touch-none"
            {...attributes}
            {...listeners}
            aria-label="Arrastrar para reordenar día"
            title="Arrastrar para reordenar día"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Clickable area - triggers navigation/edit, NOT drag */}
          <button
            type="button"
            data-testid={`dia-toggle-${diaIndex}`}
            className="flex items-center gap-2 cursor-pointer"
            onClick={onToggle}
            aria-expanded={isExpanded}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
            <span className="text-xs font-medium text-muted-foreground/70">
              Día {dayNumber}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
            title="Eliminar día"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsible content - hidden instead of unmounting to preserve input values */}
      <div className={cn("px-4 pt-4 pb-4 space-y-4 theme-transition", !isExpanded && "hidden")}>
        {/* Músculos enfocados - full width */}
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium block">Músculos enfocados</label>
          <Controller
            name={`${baseName}.musculosEnfocados`}
            control={control}
            render={({ field }) => (
              <TagInput
                value={Array.isArray(field.value) ? field.value : []}
                onChange={field.onChange}
                placeholder="Agregar músculo..."
              />
            )}
          />
        </div>

        {/* Ejercicios with nested SortableContext */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-muted-foreground text-sm font-medium">Ejercicios</label>
            <span className="text-muted-foreground/70 text-xs">Al menos 1 ejercicio</span>
          </div>

          {/* SortableContext for ejercicios - enables cross-ejercicio drag within same day */}
          <SortableContext
            items={sortableEjercicioIds()}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {ejercicioFields.map((ejercicioField, index) => (
                <EjercicioRow
                  key={ejercicioField.id}
                  id={ejercicioField.id}
                  control={control}
                  name={`${baseName}.ejercicios.${index}`}
                  index={index}
                  diaIndex={diaIndex}
                  diaId={field.id}
                  onRemove={() => removeEjercicio(index)}
                  errors={diaErrors?.ejercicios}
                />
              ))}
            </div>
          </SortableContext>

          {/* Error for empty ejercicios */}
          {diaErrors?.ejercicios?.root && (
            <p className="text-destructive text-xs">
              {typeof diaErrors.ejercicios.root === "object"
                ? diaErrors.ejercicios.root.message
                : diaErrors.ejercicios.root}
            </p>
          )}

          {/* Add exercise button */}
          <button
            type="button"
            onClick={addExercise}
            className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 text-sm mt-2"
          >
            <span className="h-4 w-4">+</span>
            <span>Agregar Ejercicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const DiaSection = DiaSectionComponent;
