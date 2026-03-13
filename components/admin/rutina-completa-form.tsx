"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRutinaCompleta } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DiaSection } from "./dia-section";
import type { FormState } from "@/lib/schemas";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string;
  repes?: string;
}

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados?: string;
  ejercicios: Ejercicio[];
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

// Cast to bypass type mismatch
const createAction = createRutinaCompleta as unknown as (
  state: RutinaFormState,
  formData: FormData
) => Promise<RutinaFormState>;

export function RutinaCompletaForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(createAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Client-side state for dynamic days and exercises
  const [dias, setDias] = useState<Dia[]>([
    {
      id: crypto.randomUUID(),
      nombre: "",
      musculosEnfocados: "",
      ejercicios: [{ id: crypto.randomUUID(), nombre: "", series: "", repes: "" }],
    },
  ]);

  // Handle success - redirect to routine detail
  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/admin/rutinas/${state.data.id}`);
    }
  }, [state, router]);

  // Add a new day
  const addDay = () => {
    setDias((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre: "",
        musculosEnfocados: "",
        ejercicios: [{ id: crypto.randomUUID(), nombre: "", series: "", repes: "" }],
      },
    ]);
  };

  // Remove a day by ID
  const removeDay = (diaId: string) => {
    setDias((prev) => prev.filter((dia) => dia.id !== diaId));
  };

  // Add an exercise to a day
  const addExercise = (diaIndex: number) => {
    setDias((prev) =>
      prev.map((dia, index) =>
        index === diaIndex
          ? {
              ...dia,
              ejercicios: [...dia.ejercicios, { id: crypto.randomUUID(), nombre: "", series: "", repes: "" }],
            }
          : dia
      )
    );
  };

  // Remove an exercise from a day (prevent removing last one) by IDs
  const removeExercise = (diaId: string, ejercicioId: string) => {
    setDias((prev) =>
      prev.map((dia) =>
        dia.id === diaId && dia.ejercicios.length > 1
          ? {
              ...dia,
              ejercicios: dia.ejercicios.filter((ej) => ej.id !== ejercicioId),
            }
          : dia
      )
    );
  };

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {/* Error Message */}
      {state && !state.success && state.message && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-sm">{state.message}</p>
        </div>
      )}

      {/* Routine Basic Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="space-y-2">
            <label htmlFor="nombre" className="text-white text-sm font-medium">
              Nombre de la rutina *
            </label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="Ej: Rutina Full Body"
              className="bg-black/50"
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
              defaultValue=""
              className="flex h-10 w-full rounded-lg border bg-black px-3 py-2 text-sm text-white placeholder:text-white/50 border-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="" disabled>
                Seleccionar tipo
              </option>
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
            placeholder="Describe los objetivos de esta rutina..."
            rows={3}
            className="bg-black/50"
          />
          {state?.errors?.descripcion && (
            <p className="text-red-500 text-xs">{state.errors.descripcion[0]}</p>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/10 my-6" />

      {/* Dias Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-medium">Días de entrenamiento</h2>
          <span className="text-white/50 text-xs">Al menos 1 día</span>
        </div>

        {state?.errors?.dias && (
          <p className="text-red-500 text-sm">{state.errors.dias[0]}</p>
        )}

        <div className="space-y-4">
          {dias.map((dia) => (
            <DiaSection
              key={dia.id}
              diaId={dia.id}
              diaIndex={dias.indexOf(dia)}
              onRemove={removeDay}
              onAddExercise={addExercise}
              onRemoveExercise={removeExercise}
              ejercicios={dia.ejercicios}
              errors={state?.errors}
            />
          ))}
        </div>

        {/* Add day button */}
        <Button type="button" variant="secondary" onClick={addDay} className="w-full">
          + Agregar Día
        </Button>
      </div>

      {/* Separator */}
      <div className="border-t border-white/10 my-6" />

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/rutinas")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear Rutina Completa"}
        </Button>
      </div>
    </form>
  );
}
