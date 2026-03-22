"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EjercicioRowProps {
  diaId: string;
  diaIndex: number;
  ejercicioId: string;
  ejercicioIndex: number;
  onRemove: () => void;
  errors?: Record<string, string[]>;
}

export function EjercicioRow({
  diaId,
  diaIndex,
  ejercicioId,
  ejercicioIndex,
  onRemove,
  errors,
}: EjercicioRowProps) {
  const baseName = `dias[${diaIndex}].ejercicios[${ejercicioIndex}]`;
  const hasError = errors?.[`${baseName}.nombre`];

  return (
    <div className="flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
      {/* Drag handle indicator - more visible on hover */}
      <div className="w-4 flex-shrink-0 flex items-center justify-center">
        <div className="w-1 h-4 bg-gray-300 dark:bg-[#2a2a2a] rounded-full opacity-40 group-hover:opacity-80 transition-opacity" />
      </div>

      {/* Nombre - flexible width, vertically aligned */}
      <div className="flex-1 min-w-0">
        <Input
          name={`${baseName}.nombre`}
          placeholder="Ej: Sentadillas con barra"
          required
          className={cn(
            "seamless-input h-9 placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]",
            hasError && "border-[#ef4444]/50"
          )}
        />
        {hasError && (
          <p className="text-[#ef4444] dark:text-[#ef4444] text-xs mt-1">{hasError[0]}</p>
        )}
      </div>

      {/* Series - compact unit with × separator, vertically aligned */}
      <div className="flex items-center gap-0.5">
        <Input
          name={`${baseName}.series`}
          placeholder="3"
          type="number"
          min={1}
          className="seamless-input w-12 h-9 text-center placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
        />
        {/* × separator - perfectly centered, reads as unit */}
        <span className="text-[#d1d5db] dark:text-[#5a5a5a] self-center leading-none mx-0.5 select-none">×</span>
        <Input
          name={`${baseName}.repes`}
          placeholder="10"
          type="number"
          min={1}
          className="seamless-input w-12 h-9 text-center placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
        />
      </div>

      {/* Remove button - gray by default, soft red on hover */}
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
