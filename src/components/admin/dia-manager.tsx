"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { createDia } from "@/app/actions/dias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { RoutineDayCard } from "@/components/admin/routine-day-card";
import type { FormState } from "@/lib/schemas";

import { toast } from "sonner";

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados?: string | null;
  orden: number;
  ejercicios: {
    id: string;
    nombre: string;
    series?: string | null;
    repes?: string | null;
  }[];
}

interface DiaManagerProps {
  rutinaId: string;
  dias: Dia[];
}

type DiaFormState = FormState<{ id: string }>;

const initialState: DiaFormState = {
  success: false,
};

// Cast server actions to proper type
const createActionTyped = createDia as unknown as (state: DiaFormState | null, formData: FormData) => Promise<DiaFormState>;

const MAX_DAYS = 7;

export function DiaManager({ rutinaId, dias }: DiaManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [localDias, setLocalDias] = useState(dias);

  const [createState, createActionWrapped, isCreatePending] = useActionState(createActionTyped, initialState);

  // Sync with props
  useEffect(() => {
    setLocalDias(dias);
  }, [dias]);

  // Handle create success
  useEffect(() => {
    if (createState?.success) {
      setIsAdding(false);
      toast.success("¡Día agregado exitosamente!");
    } else if (createState?.success === false && createState.message) {
      toast.error(createState.message);
    }
  }, [createState]);

  const handleSuccess = () => {
    setIsAdding(false);
  };

  const handleDayUpdated = () => {
    toast.success("¡Día actualizado!");
  };

  const handleDayDeleted = () => {
    toast.success("¡Día eliminado!");
  };

  return (
    <div className="bg-white dark:bg-[#121212] rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a2a] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Días de entrenamiento</h2>
          <p className="text-muted-foreground text-xs">
            {localDias.length} día{localDias.length !== 1 ? "s" : ""} • Al menos 1 día
          </p>
        </div>
      </div>

      {/* Max days warning */}
      {localDias.length >= MAX_DAYS && (
        <p className="text-center text-[#6b7280] dark:text-[#6b7280] text-sm py-2">
          Has alcanzado el máximo de {MAX_DAYS} días por rutina
        </p>
      )}

      {/* Add Day Form */}
      {isAdding && (
        <div className="p-4 bg-[#f3f4f6] dark:bg-[#1a1a1a] rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a2a] space-y-4">
          <form
            action={async (formData: FormData) => {
              formData.set("rutinaId", rutinaId);
              const result = await createActionTyped(null, formData);
              if (result.success) handleSuccess();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="rutinaId" value={rutinaId} />

            {createState && !createState.success && createState.message && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-sm">{createState.message}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField variant="default" label="Nombre *" error={createState?.errors?.nombre?.[0]}>
                <Input
                  name="nombre"
                  required
                  placeholder="Ej: Día 1 - Pecho"
                  error={!!createState?.errors?.nombre}
                  autoFocus
                  className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
                />
              </AdminFormField>
              <AdminFormField variant="default" label="Músculos Enfocados">
                <Input
                  name="musculosEnfocados"
                  placeholder="Ej: Pecho, tríceps"
                  className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
                />
              </AdminFormField>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="text-[#6b7280] hover:text-[#ef4444] dark:text-[#9ca3af] dark:hover:text-[#E11D48]"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatePending} className="bg-[#48b8c9] hover:bg-[#3da4b3] text-white dark:bg-[#E11D48] dark:hover:bg-[#be123c]">
                {isCreatePending ? "Guardando..." : "Crear Día"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Add day button - gray bar in light mode */}
      {!isAdding && localDias.length < MAX_DAYS && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-3 px-4 bg-[#f3f4f6] hover:bg-gray-200 text-[#6b7280] hover:text-[#4b5563] transition-colors rounded-2xl flex items-center justify-center gap-2 text-sm font-medium border border-[#e5e7eb] dark:bg-[#1a1a1a] dark:hover:bg-[#222222] dark:text-[#6b7280] dark:hover:text-[#9ca3af] dark:border-[#2a2a2a]"
        >
          <span className="h-4 w-4">+</span>
          <span>Agregar Día</span>
        </button>
      )}

      {/* Days Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localDias.map((dia, index) => (
          <RoutineDayCard
            key={dia.id}
            dia={dia}
            rutinaId={rutinaId}
            index={index}
            onDayUpdated={handleDayUpdated}
            onDayDeleted={handleDayDeleted}
          />
        ))}

        {localDias.length === 0 && !isAdding && (
          <div className="col-span-full md:col-span-2 lg:col-span-3 text-center py-12 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">No hay días en esta rutina</p>
            <p className="text-muted-foreground text-sm mt-1 opacity-60">
              Agrega un día para empezar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
