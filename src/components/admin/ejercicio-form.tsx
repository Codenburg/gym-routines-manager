"use client";

import { useActionState } from "react";
import { createEjercicio, updateEjercicio } from "@/app/actions/ejercicios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFormField } from "@/components/admin/admin-form-field";
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
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive text-sm">{state.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nombre */}
        <div className="md:col-span-2">
          <AdminFormField variant="default" label="Nombre *" error={state?.errors?.nombre?.[0]}>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              required
              defaultValue={initialData?.nombre}
              placeholder="Ej: Press de banca"
              error={!!state?.errors?.nombre}
              className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            />
          </AdminFormField>
        </div>

        {/* Series */}
        <AdminFormField variant="default" label="Series" error={state?.errors?.series?.[0]}>
          <Input
            id="series"
            name="series"
            type="text"
            defaultValue={initialData?.series}
            placeholder="Ej: 4"
            className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
          />
        </AdminFormField>
      </div>

      {/* Repes */}
      <div className="max-w-xs">
        <AdminFormField variant="default" label="Repeticiones" error={state?.errors?.repes?.[0]}>
          <Input
            id="repes"
            name="repes"
            type="text"
            defaultValue={initialData?.repes}
            placeholder="Ej: 10-12"
            className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
          />
        </AdminFormField>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-[#6b7280] hover:text-[#ef4444] dark:text-[#9ca3af] dark:hover:text-[#E11D48]"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#48b8c9] hover:bg-[#3da4b3] text-white dark:bg-[#E11D48] dark:hover:bg-[#be123c] dark:text-white"
        >
          {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}
