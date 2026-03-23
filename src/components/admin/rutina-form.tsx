"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createRutina, updateRutina } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SegmentedControl } from "@/components/admin/segmented-control";
import type { FormState } from "@/lib/schemas";
import { toast } from "sonner";

interface RutinaFormProps {
  initialData?: {
    id: string;
    nombre: string;
    tipo: "fuerza" | "cardio" | "flexibilidad" | "hipertrofia";
    descripcion?: string;
  };
  onSuccess?: () => void;
}

const tipos = [
  { value: "fuerza", label: "Fuerza" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibilidad", label: "Flexibilidad" },
  { value: "hipertrofia", label: "Hipertrofia" },
];

type RutinaFormState = FormState<{ id: string }>;

const initialState: RutinaFormState = {
  success: false,
};

// Cast to any to bypass type mismatch between server action's FormState<void> and form's FormState<T>
const createAction = createRutina as unknown as (state: RutinaFormState, formData: FormData) => Promise<RutinaFormState>;
const updateAction = updateRutina as unknown as (state: RutinaFormState, formData: FormData) => Promise<RutinaFormState>;

export function RutinaForm({ initialData, onSuccess }: RutinaFormProps) {
  const isEditing = !!initialData;
  const [state, action, isPending] = useActionState(
    isEditing ? updateAction : createAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Local state for SegmentedControl value
  const [tipo, setTipo] = useState(initialData?.tipo || "");

  // Handle success/error - stay on page and show toast
  useEffect(() => {
    if (state?.success) {
      // Reset form only if creating new
      if (!isEditing) {
        formRef.current?.reset();
        setTipo("");
      }
      toast.success(
        isEditing
          ? "¡Rutina actualizada exitosamente!"
          : "¡Rutina creada exitosamente!"
      );
      onSuccess?.();
    } else if (state?.success === false && state.message) {
      toast.error(state.message);
    }
  }, [state, isEditing, onSuccess]);

  return (
    <form
      ref={formRef}
      action={action}
      className="bg-white dark:bg-[#121212] rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a2a] p-4 space-y-6"
    >
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* Error Message */}
      {state && !state.success && state.message && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive text-sm">{state.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <AdminFormField variant="default" label="Nombre *" error={state?.errors?.nombre?.[0]}>
          <Input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={initialData?.nombre}
            placeholder="Ej: Rutina Full Body"
            error={!!state?.errors?.nombre}
            disabled={isPending}
            className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
          />
        </AdminFormField>

        {/* Tipo - SegmentedControl */}
        <AdminFormField variant="default" label="Tipo *" error={state?.errors?.tipo?.[0]}>
          <input type="hidden" name="tipo" value={tipo} />
          <SegmentedControl
            name="tipo"
            options={tipos}
            value={tipo}
            onChange={setTipo}
            disabled={isPending}
            error={state?.errors?.tipo?.[0]}
          />
        </AdminFormField>
      </div>

      {/* Descripcion */}
      <AdminFormField variant="default" label="Descripción" error={state?.errors?.descripcion?.[0]}>
        <Textarea
          id="descripcion"
          name="descripcion"
          defaultValue={initialData?.descripcion || ""}
          placeholder="Describe los objetivos de esta rutina..."
          rows={3}
          disabled={isPending}
          className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
        />
      </AdminFormField>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#48b8c9] hover:bg-[#3da4b3] text-white dark:bg-[#E11D48] dark:hover:bg-[#be123c] dark:text-white"
        >
          {isPending
            ? isEditing
              ? "Actualizando..."
              : "Guardando..."
            : isEditing
            ? "Actualizar Rutina"
            : "Crear Rutina"}
        </Button>
      </div>
    </form>
  );
}
