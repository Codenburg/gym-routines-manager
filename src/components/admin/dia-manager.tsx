"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { createDia } from "@/app/actions/dias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { DiaCard } from "@/components/admin/dia-card";
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
    series?: number | null;
    repes?: number | null;
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

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Días de entrenamiento</h2>
        <p className="text-muted-foreground text-xs">
          {localDias.length} día{localDias.length !== 1 ? "s" : ""} • Al menos 1 día
        </p>
      </div>

      {/* Max days warning */}
      {localDias.length >= MAX_DAYS && (
        <p className="text-center text-muted-foreground text-sm py-2">
          Has alcanzado el máximo de {MAX_DAYS} días por rutina
        </p>
      )}

      {/* Add Day Form */}
      {isAdding && (
        <div className="p-4 bg-hover rounded-xl border border-border space-y-4">
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
                  className="seamless-input w-full placeholder:text-muted-foreground"
                />
              </AdminFormField>
              <AdminFormField variant="default" label="Músculos Enfocados">
                <Input
                  name="musculosEnfocados"
                  placeholder="Ej: Pecho, tríceps"
                  className="seamless-input w-full placeholder:text-muted-foreground"
                />
              </AdminFormField>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="text-muted-foreground hover:text-destructive"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatePending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isCreatePending ? "Guardando..." : "Crear Día"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Add day button - dashed border style */}
      {!isAdding && localDias.length < MAX_DAYS && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full border border-dashed border-border bg-transparent hover:bg-surface min-h-[44px] flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-150 rounded-xl"
        >
          <span className="h-4 w-4">+</span>
          <span>Agregar Día</span>
        </button>
      )}

      {/* Days Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {localDias.map((dia, index) => (
          <DiaCard
            key={dia.id}
            dia={dia}
            rutinaId={rutinaId}
            index={index}
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
