"use client";

import { useActionState } from "react";
import { createEjercicio, updateEjercicio } from "@/app/actions/ejercicios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/schemas";
import { useEffect, useRef } from "react";

interface EjercicioFormProps {
  diaId: string;
  initialData?: {
    id: string;
    nombre: string;
    series?: string;
    repes?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

type EjercicioFormState = FormState<{ id: string }>;

const initialState: EjercicioFormState = {
  success: false,
};

// Cast server actions
const createActionTyped = createEjercicio as unknown as (state: EjercicioFormState | null, formData: FormData) => Promise<EjercicioFormState>;
const updateActionTyped = updateEjercicio as unknown as (state: EjercicioFormState | null, formData: FormData) => Promise<EjercicioFormState>;

export function EjercicioForm({ diaId, initialData, onSuccess, onCancel }: EjercicioFormProps) {
  const isEditing = !!initialData;
  const [state, action, isPending] = useActionState(
    isEditing ? updateActionTyped : createActionTyped,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="diaId" value={diaId} />

      {/* Error Message */}
      {state && !state.success && state.message && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-sm">{state.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nombre */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="nombre" className="text-white text-sm font-medium">
            Nombre *
          </label>
          <Input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={initialData?.nombre}
            placeholder="Ej: Press de banca"
            error={!!state?.errors?.nombre}
          />
          {state?.errors?.nombre && (
            <p className="text-red-500 text-xs">{state.errors.nombre[0]}</p>
          )}
        </div>

        {/* Series */}
        <div className="space-y-2">
          <label htmlFor="series" className="text-white text-sm font-medium">
            Series
          </label>
          <Input
            id="series"
            name="series"
            type="text"
            defaultValue={initialData?.series}
            placeholder="Ej: 4"
          />
        </div>
      </div>

      {/* Repes */}
      <div className="space-y-2">
        <label htmlFor="repes" className="text-white text-sm font-medium">
          Repeticiones
        </label>
        <Input
          id="repes"
          name="repes"
          type="text"
          defaultValue={initialData?.repes}
          placeholder="Ej: 10-12"
          className="max-w-xs"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}