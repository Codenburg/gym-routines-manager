"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { usePersistedForm } from "@/hooks/use-persisted-form";
import { createRutinaCompleta } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SegmentedControl } from "./segmented-control";
import { DiaSection } from "./dia-section";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { FormState } from "@/lib/schemas";
import type { RutinaCompletaInput } from "@/lib/schemas";

const STORAGE_KEY = "rutina-draft";
const STORAGE_VERSION = 1;
const MAX_DAYS = 7;

// Default values for a new day
const defaultDia = {
  nombre: "",
  musculosEnfocados: "",
  ejercicios: [{ nombre: "", series: "", repes: "" }],
};

// Default values for the entire form
const defaultValues: RutinaCompletaInput & { dias: typeof defaultDia[] } = {
  nombre: "",
  tipo: "fuerza",
  descripcion: "",
  creador: "",
  dias: [{ ...defaultDia }],
};

type RutinaFormData = typeof defaultValues;

export function RutinaCompletaForm() {
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  // Persisted form state with localStorage
  const form = usePersistedForm<RutinaFormData>({
    storageKey: STORAGE_KEY,
    version: STORAGE_VERSION,
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  // Field array for dias
  const {
    fields: diasFields,
    append: appendDia,
    remove: removeDia,
  } = useFieldArray({
    control,
    name: "dias",
  });

  // UI state for expanded days (not persisted, just local UI)
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(diasFields.length > 0 ? [diasFields[0].id] : [])
  );

  // Ref to track the index of the newly added day that needs auto-expansion
  const newlyAddedDayIndexRef = useRef<number | null>(null);

  // Ref to track submit attempts (for error auto-expand)
  const submitAttemptRef = useRef(false);

  // Ref to keep updated snapshot of diasFields for use in effects
  const fieldsRef = useRef(diasFields);
  useEffect(() => {
    fieldsRef.current = diasFields;
  }, [diasFields]);

  // Watch tipo for segmented control
  const tipo = watch("tipo");

  // Effect to auto-expand newly added day after append
  useEffect(() => {
    if (newlyAddedDayIndexRef.current === null) return;

    const fields = fieldsRef.current;
    const index = newlyAddedDayIndexRef.current;
    const field = fields[index];

    if (!field) {
      newlyAddedDayIndexRef.current = null;
      return;
    }

    setExpandedDayIds(new Set([field.id]));
    newlyAddedDayIndexRef.current = null;
  }, [diasFields]);

  // Effect to auto-expand days with validation errors after failed submit
  useEffect(() => {
    if (!submitAttemptRef.current) return;

    const diasErrors = errors.dias as Record<string, any> | undefined;
    const fields = fieldsRef.current;

    if (!diasErrors) {
      submitAttemptRef.current = false;
      return;
    }

    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      let changed = false;

      Object.keys(diasErrors).forEach((key) => {
        if (isNaN(Number(key))) return; // Skip non-numeric keys like 'root'
        const index = Number(key);
        const field = fields[index];
        if (!field) return;
        if (!next.has(field.id)) {
          next.add(field.id);
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    submitAttemptRef.current = false;
  }, [errors.dias]);

  // Toggle day expansion
  const toggleDay = useCallback((diaId: string) => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(diaId)) {
        next.delete(diaId);
      } else {
        next.add(diaId);
      }
      return next;
    });
  }, []);

  // Add new day and auto-expand it (collapse others)
  const addDay = useCallback(() => {
    if (diasFields.length >= MAX_DAYS) return;
    // Track the index of the day that will be added (current length = new index)
    newlyAddedDayIndexRef.current = diasFields.length;
    appendDia({ ...defaultDia });
  }, [appendDia, diasFields]);

  // Remove day
  const removeDay = useCallback(
    (diaId: string, index: number) => {
      removeDia(index);
      // If we removed an expanded day, expand the next available day or first day
      if (expandedDayIds.has(diaId)) {
        setExpandedDayIds((prev) => {
          const newExpanded = new Set<string>();
          const remainingIds = diasFields.filter((_, i) => i !== index).map((f) => f.id);
          if (remainingIds.length > 0) {
            newExpanded.add(remainingIds[0]);
          }
          return newExpanded;
        });
      }
    },
    [removeDia, expandedDayIds, diasFields]
  );

  // Convert form data to FormData for server action
  const convertToFormData = useCallback((data: RutinaFormData): FormData => {
    const formData = new FormData();

    // Add simple fields
    formData.append("nombre", data.nombre || "");
    formData.append("tipo", data.tipo || "");
    if (data.descripcion) {
      formData.append("descripcion", data.descripcion);
    }
    if (data.creador) {
      formData.append("creador", data.creador);
    }

    // Add nested dias and ejercicios
    data.dias.forEach((dia, diaIndex) => {
      formData.append(`dias[${diaIndex}].nombre`, dia.nombre || "");
      if (dia.musculosEnfocados) {
        formData.append(`dias[${diaIndex}].musculosEnfocados`, dia.musculosEnfocados);
      }
      dia.ejercicios.forEach((ejercicio, ejIndex) => {
        formData.append(`dias[${diaIndex}].ejercicios[${ejIndex}].nombre`, ejercicio.nombre || "");
        if (ejercicio.series) {
          formData.append(`dias[${diaIndex}].ejercicios[${ejIndex}].series`, ejercicio.series);
        }
        if (ejercicio.repes) {
          formData.append(`dias[${diaIndex}].ejercicios[${ejIndex}].repes`, ejercicio.repes);
        }
      });
    });

    return formData;
  }, []);

  // Handle form submission
  const onSubmit = useCallback(
    async (data: RutinaFormData) => {
      const confirmed = await confirm({
        title: "¿Crear rutina?",
        description: "Se creará una nueva rutina con los datos ingresados.",
        variant: "default",
        confirmText: "Crear",
      });

      if (!confirmed) return;

      const formData = convertToFormData(data);
      const result: FormState<{ id: string }> = await createRutinaCompleta(
        { success: false },
        formData
      );

      if (result.success && result.data?.id) {
        form.clear(); // Clear persisted draft
        router.push("/admin");
        setTimeout(() => {
          toast.success("¡Rutina creada exitosamente!");
        }, 100);
      } else {
        toast.error(result.message || "Error al crear la rutina");
      }
    },
    [confirm, convertToFormData, router, form]
  );

  // Get current dias values for passing to DiaSection
  const diasValues = getValues("dias");

  // Callback when validation fails (to trigger error auto-expand)
  const onInvalid = useCallback(() => {
    submitAttemptRef.current = true;
  }, []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white dark:bg-[#121212] rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a2a]"
    >
      {/* Error Message */}
      {errors.root && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive text-sm">{errors.root.message}</p>
        </div>
      )}

      {/* Routine Basic Info */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <AdminFormField
            variant="default"
            label="Nombre de la rutina"
            error={errors.nombre?.message}
          >
            <Input
              id="nombre"
              type="text"
              placeholder="Ej: Rutina Full Body"
              className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
              {...register("nombre", { required: "El nombre es requerido" })}
            />
          </AdminFormField>

          {/* Tipo */}
          <AdminFormField variant="default" label="Tipo" error={errors.tipo?.message}>
            <SegmentedControl
              name="tipo"
              value={tipo}
              onChange={(value) => form.setValue("tipo", value as any)}
              options={[
                { value: "fuerza", label: "Fuerza" },
                { value: "cardio", label: "Cardio" },
                { value: "flexibilidad", label: "Flexibilidad" },
                { value: "hipertrofia", label: "Hipertrofia" },
              ]}
            />
          </AdminFormField>
        </div>

        {/* Descripcion */}
        <AdminFormField
          variant="default"
          label="Descripción"
          error={errors.descripcion?.message}
        >
          <Textarea
            id="descripcion"
            placeholder="Describe los objetivos de esta rutina..."
            rows={3}
            className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
            {...register("descripcion")}
          />
        </AdminFormField>
      </div>

      {/* Separator */}
      <div className="border-t border-border my-6" />

      {/* Dias Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-medium">Días de entrenamiento</h2>
          <span className="text-muted-foreground text-xs">Al menos 1 día</span>
        </div>

        {errors.dias?.root && (
          <p className="text-destructive text-sm">{errors.dias.root.message}</p>
        )}

        <div className="space-y-4">
          {diasFields.map((field, index) => {
            const diaValues = diasValues?.[index];
            return (
              <DiaSection
                key={field.id}
                control={control}
                diaIndex={index}
                isExpanded={expandedDayIds.has(field.id)}
                onToggle={() => toggleDay(field.id)}
                onRemove={() => removeDay(field.id, index)}
                errors={errors}
              />
            );
          })}
        </div>

        {/* Add day button */}
        {diasFields.length < MAX_DAYS && (
          <button
            type="button"
            onClick={addDay}
            className="w-full py-3 px-4 bg-[#f3f4f6] hover:bg-gray-200 text-[#6b7280] hover:text-[#4b5563] transition-colors rounded-2xl flex items-center justify-center gap-2 text-sm font-medium border border-[#e5e7eb] dark:bg-[#1a1a1a] dark:hover:bg-[#222222] dark:text-[#6b7280] dark:hover:text-[#9ca3af] dark:border-[#2a2a2a]"
          >
            <span className="h-4 w-4">+</span>
            <span>Agregar Día</span>
          </button>
        )}
        {diasFields.length >= MAX_DAYS && (
          <p className="text-center text-[#6b7280] dark:text-[#6b7280] text-sm py-2">
            Máximo {MAX_DAYS} días por rutina
          </p>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-border my-6" />

      {/* Submit */}
      <div className="flex justify-end gap-3 p-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
          className="border-[#e5e7eb] text-[#6b7280] hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer dark:border-[#2a2a2a] dark:text-[#9ca3af] dark:hover:border-[#E11D48] dark:hover:text-[#E11D48] dark:hover:bg-[#fef2f2]"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#48b8c9] text-white hover:bg-[#3da4b3] hover:border-2 hover:border-black cursor-pointer font-semibold dark:bg-[#E11D48] dark:text-white dark:hover:bg-[#c01030] dark:hover:border-2 dark:hover:border-white"
        >
          {isSubmitting ? "Creando..." : "Crear Rutina"}
        </Button>
      </div>
      {Dialog}
    </form>
  );
}
