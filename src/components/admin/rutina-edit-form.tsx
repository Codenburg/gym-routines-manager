"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { usePersistedForm } from "@/hooks/use-persisted-form";
import { updateRutinaCompleta } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SegmentedControl } from "./segmented-control";
import { DiaSection } from "./dia-section";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ClientOnly } from "@/components/client-only";
import { toast } from "sonner";
import type { FormState } from "@/lib/schemas";
import type { RutinaCompletaInput } from "@/lib/schemas";

// DnD imports
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRutinaDnd } from "@/hooks/use-rutina-dnd";
import { type DragItem, type DragEndResult } from "@/lib/dnd-utils";

const STORAGE_KEY = "rutina-edit-draft";
const STORAGE_VERSION = 1;
const MAX_DAYS = 7;

// Default values for a new day
const defaultDia = {
  musculosEnfocados: [] as string[],
  ejercicios: [{ nombre: "", formato: "" }],
};

// Default values for the entire form
const defaultValues: Omit<RutinaCompletaInput, "creador"> & { dias: typeof defaultDia[] } = {
  nombre: "",
  tipo: "fuerza",
  descripcion: "",
  dias: [{ ...defaultDia }],
};

type RutinaFormData = typeof defaultValues;

// Interface for edit form props
interface RutinaEditFormProps {
  initialData: {
    id: string;
    nombre: string;
    tipo: "fuerza" | "cardio" | "flexibilidad" | "hipertrofia";
    descripcion?: string;
    dias: Array<{
      id?: string;
      musculosEnfocados: string[];
      ejercicios: Array<{ id?: string; nombre: string; formato: string }>;
    }>;
  };
  onSuccess?: () => void;
}

// Alias for backward compatibility
export { RutinaEditFormV2 as RutinaEditForm };

export function RutinaEditFormV2({ initialData, onSuccess }: RutinaEditFormProps) {
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();

  // Track drag state to pause localStorage persistence during drag operations
  // This prevents persisting transient intermediate states that occur during
  // useFieldArray.move() which causes multiple renders with changing indices
  const [isDragging, setIsDragging] = useState(false);

  // Build default values from initialData
  const formDefaultValues = useMemo(() => {
    return {
      nombre: initialData.nombre || "",
      tipo: initialData.tipo || "fuerza",
      descripcion: initialData.descripcion || "",
      dias: initialData.dias.length > 0
        ? initialData.dias.map((d) => ({
            musculosEnfocados: d.musculosEnfocados || [],
            ejercicios: d.ejercicios.length > 0
              ? d.ejercicios.map((e) => ({
                  nombre: e.nombre || "",
                  formato: e.formato || "",
                }))
              : [{ nombre: "", formato: "" }],
          }))
        : [{ ...defaultDia }],
    };
  }, [initialData]);

  // Persisted form state with localStorage
  const form = usePersistedForm<RutinaFormData>({
    storageKey: STORAGE_KEY,
    version: STORAGE_VERSION,
    defaultValues: formDefaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    skipPersistence: isDragging,
  });

  // Reset form when navigating between routines (initialData.id changes)
  // This fixes the bug where form wasn't updating because usePersistedForm
  // only restores once with isRestoredRef
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData?.id]);

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = form;

  // Field array for dias
  const {
    fields: diasFields,
    append: appendDia,
    remove: removeDia,
    move: diasMove,
  } = useFieldArray({
    control,
    name: "dias",
    shouldUnregister: false,
  });

  // UI state for expanded days (not persisted, just local UI)
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(diasFields.length > 0 ? [diasFields[0].id] : [])
  );

  // Ref to track the index of the newly added day that needs auto-expansion
  const newlyAddedDayIndexRef = useRef<number | null>(null);

  // Ref to keep updated snapshot of diasFields for use in effects
  const fieldsRef = useRef(diasFields);
  useEffect(() => {
    fieldsRef.current = diasFields;
  }, [diasFields]);

  // Ref to store each day's ejercicios move function: Map<diaIndex, moveFn>
  const ejerciciosMoveRef = useRef<Map<number, (from: number, to: number) => void>>(new Map());

  // Callback to register a day's ejercicios move function
  const handleRegisterEjerciciosMove = useCallback(
    (diaIndex: number, moveFn: (from: number, to: number) => void) => {
      ejerciciosMoveRef.current.set(diaIndex, moveFn);
    },
    []
  );



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
    if (submitCount === 0) return;

    const diasErrors = errors.dias as Record<string, any> | undefined;
    const fields = fieldsRef.current;

    if (!diasErrors) return;

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
  }, [submitCount, errors.dias]);

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

  // ========== DnD Integration ==========

  // Memoized sortable days for root SortableContext
  const sortableDays = useMemo(
    () => diasFields.map((f) => f.id),
    [diasFields]
  );

  /**
   * Hierarchical resolution of the drop target.
   * When dragging a DAY and dropping on an EJERCICIO, we need to resolve
   * the ejercicio → its parent DAY container.
   *
   * RHF field IDs are like "dias[0]" for days and "dias[0].ejercicios[0]" for ejercicios.
   * We extract the parent day ID from the ejercicio's field path.
   */
  const resolveTargetDiaId = useCallback((overItem: DragEndResult["over"]): string | null => {
    if (!overItem) return null;

    // overItem IS the DragItem directly (already extracted by use-rutina-dnd hook)
    // Access properties directly - no .data wrapper
    const overData = overItem as { type: string; diaId?: string } | undefined;

    // If dropping on a DAY directly, use its ID
    if (overData?.type === "dia") {
      return overItem.id as string;
    }

    // If dropping on an EJERCICIO, resolve to parent day
    // The ejercicio's baseName is like "dias[0].ejercicios[0]"
    // We need to extract "dias[0]" (the parent day ID)
    if (overData?.type === "ejercicio") {
      const overId = overItem.id as string;
      // Extract parent day ID from ejercicio's field path
      // "dias[0].ejercicios[0]" → "dias[0]"
      const parentMatch = overId.match(/^(dias\[\d+\])/);
      if (parentMatch) {
        return parentMatch[1];
      }
      // Fallback to diaId if regex fails
      if (overData.diaId) {
        return overData.diaId;
      }
    }

    return null;
  }, []);

  // Drag end handler - wires DnD to RHF move
  const handleDragEnd = useCallback(
    (result: DragEndResult) => {
      const { active, over } = result;

      // If no valid drop target
      if (!over) {
        return;
      }

      // Extract drag item data - active IS the DragItem directly (already extracted)
      const activeData = active as { type: string; diaId?: string; id: string } | undefined;

      if (!activeData) {
        return;
      }

      // ========== DAY DRAG ==========
      if (activeData.type === "dia") {
        // Find old index of the day being dragged
        const oldIndex = diasFields.findIndex((f) => f.id === active.id);

        // HIERARCHICAL RESOLUTION: Resolve over to parent day if it's an ejercicio
        const targetDiaId = resolveTargetDiaId(over);

        if (!targetDiaId) {
          return;
        }

        const newIndex = diasFields.findIndex((f) => f.id === targetDiaId);

        // Call diasMove if indices are valid
        if (oldIndex !== -1 && newIndex !== -1) {
          diasMove(oldIndex, newIndex);
        }
        return;
      }

      // ========== EJERCICIO DRAG ==========
      if (activeData.type === "ejercicio") {
        // Extract indices directly from sortable data (set in useSortable data prop)
        const fromEjercicioIndex = (active as any).ejercicioIndex;
        const toEjercicioIndex = (over as any).ejercicioIndex;
        const activeDiaIndex = (active as any).diaIndex;

        if (
          typeof fromEjercicioIndex !== "number" ||
          typeof toEjercicioIndex !== "number" ||
          typeof activeDiaIndex !== "number"
        ) {
          return;
        }

        // Same day - call the registered move function
        // RHF useFieldArray.move(from, to) moves item AT from TO to
        // move(0, 2) on [A,B,C] → [B,C,A] — item at 0 goes to position 2
        if (fromEjercicioIndex !== toEjercicioIndex) {
          const moveFn = ejerciciosMoveRef.current.get(activeDiaIndex);
          if (moveFn) {
            moveFn(fromEjercicioIndex, toEjercicioIndex);
          }
        }
        return;
      }
    },
    [diasFields, diasMove, resolveTargetDiaId]
  );

  // useRutinaDnd hook
  const { activeItem, sensors, collisionDetection, autoScroll, handlers } = useRutinaDnd({
    onDragEnd: handleDragEnd,
  });

  // Wrap drag handlers to track isDragging state for persistence pause
  const wrappedHandlers = useMemo(
    () => ({
      onDragStart: (...args: Parameters<typeof handlers.onDragStart>) => {
        setIsDragging(true);
        handlers.onDragStart(...args);
      },
      onDragOver: handlers.onDragOver,
      onDragEnd: (...args: Parameters<typeof handlers.onDragEnd>) => {
        handlers.onDragEnd(...args);
        setIsDragging(false);
      },
    }),
    [handlers]
  );

  // ========== End DnD Integration ==========

  // Convert form data to FormData for server action
  const convertToFormData = useCallback((data: RutinaFormData): FormData => {
    const formData = new FormData();

    // Add routine ID
    formData.append("id", initialData.id);

    // Add simple fields
    formData.append("nombre", data.nombre || "");
    formData.append("tipo", data.tipo || "");
    if (data.descripcion) {
      formData.append("descripcion", data.descripcion);
    }

    // Add nested dias and ejercicios
    data.dias.forEach((dia, diaIndex) => {
      // Send multiple entries (one per tag) so parseNestedFormData collects them into an array
      dia.musculosEnfocados.forEach((tag) => {
        formData.append(`dias[${diaIndex}].musculosEnfocados`, tag);
      });
      dia.ejercicios.forEach((ejercicio, ejIndex) => {
        formData.append(`dias[${diaIndex}].ejercicios[${ejIndex}].nombre`, ejercicio.nombre || "");
        if (ejercicio.formato) {
          formData.append(`dias[${diaIndex}].ejercicios[${ejIndex}].formato`, ejercicio.formato);
        }
      });
    });

    return formData;
  }, [initialData.id]);

  // Handle form submission
  const onSubmit = useCallback(
    async (data: RutinaFormData) => {
      // eslint-disable-next-line @admin/no-window-alert
      const confirmed = await confirm({
        title: "¿Actualizar rutina?",
        description: "Se actualizarán los datos de la rutina.",
        variant: "default",
        confirmText: "Actualizar",
      });

      if (!confirmed) return;

      const formData = convertToFormData(data);
      const result: FormState<{ id: string }> = await updateRutinaCompleta(
        { success: false },
        formData
      );

      if (result.success && result.data?.id) {
        form.clear(); // Clear persisted draft
        router.back();
        setTimeout(() => {
          toast.success("¡Rutina actualizada exitosamente!");
        }, 100);
      } else {
        toast.error(result.message || "Error al actualizar la rutina");
      }
    },
    [confirm, convertToFormData, router, form]
  );

  // Get current dias values for passing to DiaSection
  const diasValues = getValues("dias");

  // Render drag overlay preview
  const renderDragOverlay = () => {
    if (!activeItem) return null;

    if (activeItem.type === "dia") {
      const index = diasFields.findIndex((f) => f.id === activeItem.id);
      return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border-2 border-[#48b8c9] dark:border-[#E11D48] px-4 py-3 min-w-[200px] opacity-90">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#48b8c9]/20 dark:bg-[#E11D48]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[#48b8c9] dark:text-[#E11D48]">
                {index + 1}
              </span>
            </div>
            <span className="font-semibold text-[#111827] dark:text-white">
              Día {index + 1}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border-2 border-[#48b8c9] dark:border-[#E11D48] px-4 py-3 min-w-[180px] opacity-90">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#48b8c9]/20 dark:bg-[#E11D48]/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#48b8c9] dark:text-[#E11D48]">E</span>
          </div>
          <span className="text-sm text-[#111827] dark:text-white truncate max-w-[150px]">
            Ejercicio
          </span>
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      autoScroll={autoScroll}
      {...wrappedHandlers}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
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
              <Controller
                name="nombre"
                control={control}
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <Input
                    id="nombre"
                    type="text"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="Ej: Rutina Full Body"
                    className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
                  />
                )}
              />
            </AdminFormField>

            {/* Tipo */}
            <AdminFormField variant="default" label="Tipo" error={errors.tipo?.message}>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <SegmentedControl
                    name="tipo"
                    value={field.value ?? "fuerza"}
                    onChange={field.onChange}
                    options={[
                      { value: "fuerza", label: "Fuerza" },
                      { value: "cardio", label: "Cardio" },
                      { value: "flexibilidad", label: "Flexibilidad" },
                      { value: "hipertrofia", label: "Hipertrofia" },
                    ]}
                  />
                )}
              />
            </AdminFormField>
          </div>

          {/* Descripcion */}
          <AdminFormField
            variant="default"
            label="Descripción"
            error={errors.descripcion?.message}
          >
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="descripcion"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  placeholder="Describe los objetivos de esta rutina..."
                  rows={3}
                  className="seamless-input w-full placeholder:text-[#d1d5db] dark:placeholder:text-[#6b7280]"
                />
              )}
            />
          </AdminFormField>
        </div>

        {/* Separator */}
        <div className="border-t border-border my-6" />

        {/* Dias Section with SortableContext */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-lg font-medium">Días de entrenamiento</h2>
            <span className="text-muted-foreground text-xs">Al menos 1 día</span>
          </div>

          {errors.dias?.root && (
            <p className="text-destructive text-sm">{errors.dias.root.message}</p>
          )}

          <SortableContext items={sortableDays} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {diasFields.map((field, index) => {
                const diaValues = diasValues?.[index];
                const baseName = `dias[${index}]`;
                return (
                  <DiaSection
                    key={`${field.id}-${index}`}
                    field={field}
                    baseName={baseName}
                    diaIndex={index}
                    dayNumber={index + 1}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    control={control as Control<any>}
                    errors={errors as any}
                    isExpanded={expandedDayIds.has(field.id)}
                    onToggle={() => toggleDay(field.id)}
                    onRemove={() => removeDay(field.id, index)}
                    onRegisterEjerciciosMove={(moveFn) =>
                      handleRegisterEjerciciosMove(index, moveFn)
                    }
                  />
                );
              })}
            </div>
          </SortableContext>

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
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-[#e5e7eb] text-[#6b7280] hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer dark:border-[#2a2a2a] dark:text-[#9ca3af] dark:hover:border-[#E11D48] dark:hover:text-[#E11D48] dark:hover:bg-[#fef2f2]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#48b8c9] text-white hover:bg-[#3da4b3] hover:border-2 hover:border-black cursor-pointer font-semibold dark:bg-[#E11D48] dark:text-white dark:hover:bg-[#c01030] dark:hover:border-2 dark:hover:border-white"
          >
            {isSubmitting ? "Actualizando..." : "Actualizar Rutina"}
          </Button>
        </div>
        {Dialog}
      </form>

      {/* DragOverlay - rendered outside form via portal */}
      <DragOverlay>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}
