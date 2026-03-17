"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EjercicioRow } from "./ejercicio-row";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string;
  repes?: string;
}

interface DiaSectionProps {
  diaId: string;
  diaIndex: number;
  onRemove: (diaId: string) => void;
  onAddExercise: (diaIndex: number) => void;
  onRemoveExercise: (diaId: string, ejercicioId: string) => void;
  ejercicios: Ejercicio[];
  errors?: Record<string, string[]>;
}

export function DiaSection({
  diaId,
  diaIndex,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  ejercicios,
  errors,
}: DiaSectionProps) {
  const baseName = `dias[${diaIndex}]`;

  return (
    <div className="p-4 bg-[var(--button-secondary-bg)] rounded-lg border border-[var(--card-border)] space-y-4">
      {/* Header with day name and remove button */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[var(--foreground)] font-medium">Día {diaIndex + 1}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(diaId)}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
          title="Eliminar día"
        >
          Eliminar día
        </Button>
      </div>

      {/* Nombre del día */}
      <div className="space-y-2">
        <label className="text-[var(--foreground)] text-sm font-medium">Nombre del día *</label>
        <Input
          name={`${baseName}.nombre`}
          placeholder="Ej: Pierna, Espalda, Pecho..."
          required
          className="bg-[var(--input-bg)] max-w-md"
        />
        {errors?.[`${baseName}.nombre`] && (
          <p className="text-red-500 text-xs">{errors[`${baseName}.nombre`][0]}</p>
        )}
      </div>

      {/* Músculos enfocados */}
      <div className="space-y-2">
        <label className="text-[var(--foreground)] text-sm font-medium">Músculos enfocados</label>
        <Input
          name={`${baseName}.musculosEnfocados`}
          placeholder="Ej: Cuádriceps, isquiotibiales, glúteos..."
          className="bg-[var(--input-bg)] max-w-md"
        />
      </div>

      {/* Ejercicios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[var(--foreground)] text-sm font-medium">Ejercicios *</label>
          <span className="text-[var(--muted-foreground)] text-xs">Al menos 1 ejercicio</span>
        </div>

        {/* Exercise headers */}
        <div className="grid gap-3 pr-16" style={{ gridTemplateColumns: "1fr 80px 80px 36px" }}>
          <span className="text-[var(--muted-foreground)] text-xs px-3">Nombre</span>
          <span className="text-[var(--muted-foreground)] text-xs text-center">Series</span>
          <span className="text-[var(--muted-foreground)] text-xs text-center">Repes</span>
          <span></span>
        </div>

        {/* Exercise rows */}
        <div className="space-y-2">
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
          <p className="text-red-500 text-xs">{errors[`${baseName}.ejercicios`][0]}</p>
        )}

        {/* Add exercise button */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onAddExercise(diaIndex)}
          className="mt-2"
        >
          + Agregar Ejercicio
        </Button>
      </div>
    </div>
  );
}
