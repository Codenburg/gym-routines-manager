"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EjercicioRow } from "./ejercicio-row";
import { cn } from "@/lib/utils";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string;
  repes?: string;
}

interface DiaSectionProps {
  diaId: string;
  diaIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: (diaId: string) => void;
  onAddExercise: (diaIndex: number) => void;
  onRemoveExercise: (diaId: string, ejercicioId: string) => void;
  ejercicios: Ejercicio[];
  errors?: Record<string, string[]>;
}

export function DiaSection({
  diaId,
  diaIndex,
  isExpanded,
  onToggle,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  ejercicios,
  errors,
}: DiaSectionProps) {
  const baseName = `dias[${diaIndex}]`;

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
            onClick={() => onRemove(diaId)}
            className="p-2 text-[#9ca3af] dark:text-[#6b7280] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
            title="Eliminar día"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-4 pt-5 pb-4 space-y-4">
          {/* Nombre del día - full width */}
          <div className="space-y-2">
            <label className="text-[#6b7280] dark:text-[#9ca3af] text-sm font-medium block">Nombre del día</label>
            <Input
              name={`${baseName}.nombre`}
              placeholder="Ej: Pierna, Espalda, Pecho..."
              required
              className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            />
            {errors?.[`${baseName}.nombre`] && (
              <p className="text-[#ef4444] dark:text-[#ef4444] text-xs mt-1">{errors[`${baseName}.nombre`][0]}</p>
            )}
          </div>

          {/* Músculos enfocados - full width */}
          <div className="space-y-2">
            <label className="text-[#6b7280] dark:text-[#9ca3af] text-sm font-medium block">Músculos enfocados</label>
            <Input
              name={`${baseName}.musculosEnfocados`}
              placeholder="Ej: Cuádriceps, isquiotibiales, glúteos..."
              className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            />
          </div>

          {/* Ejercicios */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[#6b7280] dark:text-[#9ca3af] text-sm font-medium">Ejercicios</label>
              <span className="text-[#9ca3af] dark:text-[#6b7280] text-xs">Al menos 1 ejercicio</span>
            </div>

            {/* Exercise rows - compact gap */}
            <div className="space-y-1">
              {ejercicios.map((ejercicio, ejercicioIndex) => (
                <EjercicioRow
                  key={ejercicio.id}
                  diaId={diaId}
                  diaIndex={diaIndex}
                  ejercicioId={ejercicio.id}
                  ejercicioIndex={ejercicioIndex}
                  onRemove={() => onRemoveExercise(diaId, ejercicio.id)}
                  errors={errors}
                />
              ))}
            </div>

            {/* Error for empty ejercicios */}
            {errors?.[`${baseName}.ejercicios`] && (
              <p className="text-[#ef4444] dark:text-[#ef4444] text-xs">{errors[`${baseName}.ejercicios`][0]}</p>
            )}

            {/* Add exercise button - discrete text + icon style */}
            <button
              type="button"
              onClick={() => onAddExercise(diaIndex)}
              className="text-[#6b7280] dark:text-[#6b7280] hover:text-[#48b8c9] transition-colors flex items-center gap-1 text-sm mt-3"
            >
              <span className="h-4 w-4">+</span>
              <span>Agregar Ejercicio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
