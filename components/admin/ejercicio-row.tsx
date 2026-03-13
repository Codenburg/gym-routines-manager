"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  return (
    <div className="flex gap-3 items-start p-3 bg-white/5 rounded-lg border border-white/10">
      {/* Nombre */}
      <div className="flex-1 min-w-0">
        <Input
          name={`${baseName}.nombre`}
          placeholder="Nombre del ejercicio"
          required
          className="bg-black/50"
        />
        {errors?.[`${baseName}.nombre`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`${baseName}.nombre`][0]}</p>
        )}
      </div>

      {/* Series */}
      <div className="w-20">
        <Input
          name={`${baseName}.series`}
          placeholder="Series"
          className="bg-black/50 text-center"
        />
      </div>

      {/* Repes */}
      <div className="w-20">
        <Input
          name={`${baseName}.repes`}
          placeholder="Repes"
          className="bg-black/50 text-center"
        />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 shrink-0"
        title="Eliminar ejercicio"
      >
        ✕
      </Button>
    </div>
  );
}
