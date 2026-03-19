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
    <div className="flex gap-3 items-start p-3 bg-[var(--button-secondary-bg)] rounded-lg border border-[var(--card-border)]">
      {/* Nombre */}
      <div className="flex-1 min-w-0">
        <Input
          name={`${baseName}.nombre`}
          placeholder="Nombre del ejercicio"
          required
          className="bg-[var(--input-bg)]"
        />
        {errors?.[`${baseName}.nombre`] && (
          <p className="text-[var(--destructive)] text-xs mt-1">{errors[`${baseName}.nombre`][0]}</p>
        )}
      </div>

      {/* Series */}
      <div className="w-20">
        <Input
          name={`${baseName}.series`}
          placeholder="Series"
          className="bg-[var(--input-bg)] text-center"
        />
      </div>

      {/* Repes */}
      <div className="w-20">
        <Input
          name={`${baseName}.repes`}
          placeholder="Repes"
          className="bg-[var(--input-bg)] text-center"
        />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 shrink-0"
        title="Eliminar ejercicio"
      >
        ✕
      </Button>
    </div>
  );
}
