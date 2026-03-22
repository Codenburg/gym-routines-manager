"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRutinaCompleta } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { ChipSelector } from "./chip-selector";
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

type RutinaFormState = FormState<{ id: string }>;

const initialState: RutinaFormState = {
  success: false,
};

// Cast to bypass type mismatch
const createAction = createRutinaCompleta as unknown as (
  state: RutinaFormState,
  formData: FormData
) => Promise<RutinaFormState>;

const MAX_DAYS = 7;

export function RutinaCompletaForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(createAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Client-side state for routine type (ChipSelector)
  const [tipo, setTipo] = useState("");

  // Client-side state for dynamic days and exercises
  const [dias, setDias] = useState<Dia[]>([
    {
      id: crypto.randomUUID(),
      nombre: "",
      musculosEnfocados: "",
      ejercicios: [{ id: crypto.randomUUID(), nombre: "", series: "", repes: "" }],
    },
  ]);

  // State for tracking expanded days (Day 1 is always expanded initially)
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(dias.length > 0 ? [dias[0].id] : [])
  );

  // Handle success - redirect to routine detail
  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/admin/rutinas/${state.data.id}`);
    }
  }, [state, router]);

  // Toggle day expansion
  const toggleDay = (dayId: string) => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  // Add a new day (starts collapsed, max 7 days)
  const addDay = () => {
    if (dias.length >= MAX_DAYS) {
      // Could show toast here - for now just return
      return;
    }

    const newDia: Dia = {
      id: crypto.randomUUID(),
      nombre: "",
      musculosEnfocados: "",
      ejercicios: [{ id: crypto.randomUUID(), nombre: "", series: "", repes: "" }],
    };

    setDias((prev) => [...prev, newDia]);
    // New day starts collapsed
  };

  // Remove a day by ID
  const removeDay = (diaId: string) => {
    setDias((prev) => {
      const updated = prev.filter((dia) => dia.id !== diaId);
      // If we removed an expanded day, expand the next available day or first day
      if (expandedDayIds.has(diaId)) {
        setExpandedDayIds(() => {
          const newExpanded = new Set<string>();
          if (updated.length > 0) {
            newExpanded.add(updated[0].id);
          }
          return newExpanded;
        });
      }
      return updated;
    });
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
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive text-sm">{state.message}</p>
        </div>
      )}

      {/* Routine Basic Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <AdminFormField variant="default" label="Nombre de la rutina" error={state?.errors?.nombre?.[0]}>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="Ej: Rutina Full Body"
              className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            />
          </AdminFormField>

          {/* Tipo */}
          <AdminFormField variant="default" label="Tipo" error={state?.errors?.tipo?.[0]}>
            <input type="hidden" name="tipo" value={tipo} />
            <ChipSelector
              options={[
                { value: "fuerza", label: "💪 Fuerza" },
                { value: "cardio", label: "🏃 Cardio" },
                { value: "flexibilidad", label: "🧘 Flexibilidad" },
                { value: "hipertrofia", label: "🏋️ Hipertrofia" },
              ]}
              value={tipo}
              onChange={setTipo}
              name="tipo"
            />
          </AdminFormField>
        </div>

        {/* Descripcion */}
        <AdminFormField variant="default" label="Descripción" error={state?.errors?.descripcion?.[0]}>
          <Textarea
            id="descripcion"
            name="descripcion"
            placeholder="Describe los objetivos de esta rutina..."
            rows={3}
            className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
          />
        </AdminFormField>
      </div>

      {/* Separator */}
      <div className="border-t border-border my-6" />

      {/* Dias Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-medium">Días de entrenamiento</h2>
          <span className="text-muted-foreground text-xs">Al menos 1 día</span>
        </div>

        {state?.errors?.dias && (
          <p className="text-destructive text-sm">{state.errors.dias[0]}</p>
        )}

        <div className="space-y-4">
          {dias.map((dia) => (
            <DiaSection
              key={dia.id}
              diaId={dia.id}
              diaIndex={dias.indexOf(dia)}
              isExpanded={expandedDayIds.has(dia.id)}
              onToggle={() => toggleDay(dia.id)}
              onRemove={removeDay}
              onAddExercise={addExercise}
              onRemoveExercise={removeExercise}
              ejercicios={dia.ejercicios}
              errors={state?.errors}
            />
          ))}
        </div>

        {/* Add day button - gray bar in light mode */}
        {dias.length < MAX_DAYS && (
          <button
            type="button"
            onClick={addDay}
            className="w-full py-3 px-4 bg-[#f3f4f6] hover:bg-gray-200 text-[#6b7280] hover:text-[#4b5563] transition-colors rounded-2xl flex items-center justify-center gap-2 text-sm font-medium border border-[#e5e7eb] dark:bg-[#1a1a1a] dark:hover:bg-[#222222] dark:text-[#6b7280] dark:hover:text-[#9ca3af] dark:border-[#2a2a2a]"
          >
            <span className="h-4 w-4">+</span>
            <span>Agregar Día</span>
          </button>
        )}
        {dias.length >= MAX_DAYS && (
          <p className="text-center text-[#6b7280] dark:text-[#6b7280] text-sm py-2">
            Máximo {MAX_DAYS} días por rutina
          </p>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-border my-6" />

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/rutinas")}
          className="border-[#e5e7eb] text-[#6b7280] hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer dark:border-[#2a2a2a] dark:text-[#9ca3af] dark:hover:border-[#ef4444] dark:hover:text-[#ef4444] dark:hover:bg-[#fef2f2]"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#48b8c9] text-white hover:bg-[#3da4b3] hover:border-2 hover:border-black cursor-pointer font-semibold dark:bg-[#48b8c9] dark:text-white dark:hover:bg-[#3da4b3] dark:hover:border-2 dark:hover:border-white"
        >
          {isPending ? "Creando..." : "Crear Rutina"}
        </Button>
      </div>
    </form>
  );
}
