"use client";

import { useActionState } from "react";
import { createRutina, updateRutina } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/schemas";
import { useEffect, useRef } from "react";

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
] as const;

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

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* Error Message */}
      {state && !state.success && state.message && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-sm">{state.message}</p>
        </div>
      )}

      {/* Success Message */}
      {state?.success && (
        <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
          <p className="text-green-400 text-sm">{state.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-2">
          <label htmlFor="nombre" className="text-white text-sm font-medium">
            Nombre *
          </label>
          <Input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={initialData?.nombre}
            placeholder="Ej: Rutina Full Body"
            error={!!state?.errors?.nombre}
          />
          {state?.errors?.nombre && (
            <p className="text-red-500 text-xs">{state.errors.nombre[0]}</p>
          )}
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label htmlFor="tipo" className="text-white text-sm font-medium">
            Tipo *
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            defaultValue={initialData?.tipo || ""}
            className="flex h-10 w-full rounded-lg border bg-black px-3 py-2 text-sm text-white placeholder:text-white/50 border-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Seleccionar tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
          {state?.errors?.tipo && (
            <p className="text-red-500 text-xs">{state.errors.tipo[0]}</p>
          )}
        </div>
      </div>

      {/* Descripcion */}
      <div className="space-y-2">
        <label htmlFor="descripcion" className="text-white text-sm font-medium">
          Descripción
        </label>
        <Textarea
          id="descripcion"
          name="descripcion"
          defaultValue={initialData?.descripcion || ""}
          placeholder="Describe los objetivos de esta rutina..."
          rows={3}
        />
        {state?.errors?.descripcion && (
          <p className="text-red-500 text-xs">{state.errors.descripcion[0]}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEditing ? "Actualizar Rutina" : "Crear Rutina"}
        </Button>
      </div>
    </form>
  );
}