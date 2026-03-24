"use client";

import { Controller } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Control, FieldErrors } from "react-hook-form";

interface EjercicioRowProps {
  control: Control<any>;
  diaIndex: number;
  ejercicioIndex: number;
  onRemove: () => void;
  errors?: FieldErrors<any>;
}

export function EjercicioRow({
  control,
  diaIndex,
  ejercicioIndex,
  onRemove,
  errors,
}: EjercicioRowProps) {
  const baseName = `dias[${diaIndex}].ejercicios[${ejercicioIndex}]`;
  const ejerciciosArrayErrors = errors as any;
  const ejercicioErrors = ejerciciosArrayErrors?.[ejercicioIndex];
  const hasError = ejercicioErrors?.nombre;

  return (
    <div className="flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
      {/* Drag handle indicator */}
      <div className="w-4 flex-shrink-0 flex items-center justify-center">
        <div className="w-1 h-4 bg-gray-300 dark:bg-[#2a2a2a] rounded-full opacity-40 group-hover:opacity-80 transition-opacity" />
      </div>

      {/* Nombre */}
      <div className="flex-1 min-w-0">
        <Controller
          name={`${baseName}.nombre`}
          control={control}
          rules={{ required: "El nombre del ejercicio es requerido" }}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              placeholder="Ej: Sentadillas con barra"
              className={cn(
                "seamless-input h-9 placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]",
                hasError && "border-[#ef4444]/50"
              )}
            />
          )}
        />
        {hasError && (
          <p className="text-[#ef4444] dark:text-[#ef4444] text-xs mt-1">
            {typeof hasError === 'object' ? hasError.message : hasError}
          </p>
        )}
      </div>

      {/* Series × Repes */}
      <div className="flex items-center gap-0.5">
        <Controller
          name={`${baseName}.series`}
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              ref={ref}
              onChange={onChange}
              onBlur={onBlur}
              value={value || ""}
              type="number"
              placeholder="3"
              min={1}
              className="seamless-input w-12 h-9 text-center placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            />
          )}
        />
        <span className="text-[#d1d5db] dark:text-[#5a5a5a] self-center leading-none mx-0.5 select-none">×</span>
        <Controller
          name={`${baseName}.repes`}
          control={control}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              ref={ref}
              onChange={onChange}
              onBlur={onBlur}
              value={value || ""}
              type="number"
              placeholder="10"
              min={1}
              className="seamless-input w-12 h-9 text-center placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            />
          )}
        />
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-[#d1d5db] dark:text-[#3a3a3a] hover:text-[#dc2626] transition-colors shrink-0"
        title="Eliminar ejercicio"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
