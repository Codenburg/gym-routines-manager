"use client";

import { useCallback } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EjercicioRow } from "./ejercicio-row";
import { cn } from "@/lib/utils";
import type { Control, FieldErrors } from "react-hook-form";

interface DiaSectionProps {
  diaIndex: number;
  control: Control<any>;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  errors?: FieldErrors<any>;
}

export function DiaSection({
  diaIndex,
  control,
  isExpanded,
  onToggle,
  onRemove,
  errors,
}: DiaSectionProps) {
  const baseName = `dias[${diaIndex}]`;
  // Type assertion for nested errors - RHF types are complex
  const diasErrors = errors?.dias as any;
  const diaErrors = diasErrors?.[diaIndex];

  // Field array for ejercicios within this day
  const { fields: ejercicioFields, append: appendEjercicio, remove: removeEjercicio } = useFieldArray({
    control,
    name: `${baseName}.ejercicios`,
  });

  // Add new exercise to this day
  const addExercise = useCallback(() => {
    appendEjercicio({ nombre: "", series: "", repes: "" });
  }, [appendEjercicio]);

  return (
    <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-sm dark:shadow-black/30 overflow-hidden border border-[#e5e7eb] dark:border-[#2a2a2a]">
      {/* Header with collapse toggle and delete button */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors rounded-t-2xl"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={cn(
              "h-5 w-5 text-[#6b7280] transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
          <h3 className="text-[#111827] dark:text-white font-semibold text-base">Día {diaIndex + 1}</h3>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-[#9ca3af] dark:text-[#6b7280] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
            title="Eliminar día"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsible content - hidden instead of unmounting to preserve input values */}
      <div className={cn("px-4 pt-5 pb-4 space-y-4", !isExpanded && "hidden")}>
        {/* Nombre del día - full width */}
        <div className="space-y-2">
          <label className="text-[#6b7280] dark:text-[#9ca3af] text-sm font-medium block">Nombre del día</label>
          <Controller
            name={`${baseName}.nombre`}
            control={control}
            rules={{ required: "El nombre del día es requerido" }}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="Ej: Pierna, Espalda, Pecho..."
                className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
              />
            )}
          />
          {diaErrors?.nombre && (
            <p className="text-[#ef4444] dark:text-[#ef4444] text-xs mt-1">
              {typeof diaErrors.nombre === 'object' ? diaErrors.nombre.message : diaErrors.nombre}
            </p>
          )}
        </div>

        {/* Músculos enfocados - full width */}
        <div className="space-y-2">
          <label className="text-[#6b7280] dark:text-[#9ca3af] text-sm font-medium block">Músculos enfocados</label>
          <Controller
            name={`${baseName}.musculosEnfocados`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="Ej: Cuádriceps, isquiotibiales, glúteos..."
                className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
              />
            )}
          />
        </div>

        {/* Ejercicios */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[#6b7280] dark:text-[#9ca3af] text-sm font-medium">Ejercicios</label>
            <span className="text-[#9ca3af] dark:text-[#6b7280] text-xs">Al menos 1 ejercicio</span>
          </div>

          {/* Exercise rows */}
          <div className="space-y-1">
            {ejercicioFields.map((ejercicioField, ejercicioIndex) => (
              <EjercicioRow
                key={ejercicioField.id}
                control={control}
                diaIndex={diaIndex}
                ejercicioIndex={ejercicioIndex}
                onRemove={() => removeEjercicio(ejercicioIndex)}
                errors={diaErrors?.ejercicios}
              />
            ))}
          </div>

          {/* Error for empty ejercicios */}
          {diaErrors?.ejercicios?.root && (
            <p className="text-[#ef4444] dark:text-[#ef4444] text-xs">
              {typeof diaErrors.ejercicios.root === 'object' 
                ? diaErrors.ejercicios.root.message 
                : diaErrors.ejercicios.root}
            </p>
          )}

          {/* Add exercise button */}
          <button
            type="button"
            onClick={addExercise}
            className="text-[#6b7280] dark:text-[#6b7280] hover:text-[#48b8c9] transition-colors flex items-center gap-1 text-sm mt-3"
          >
            <span className="h-4 w-4">+</span>
            <span>Agregar Ejercicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
