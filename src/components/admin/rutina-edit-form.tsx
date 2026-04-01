"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { updateRutinaCompleta } from "@/app/actions/rutinas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "./segmented-control";
import { DiaSection } from "./dia-section";
import { useConfirm } from "@/hooks/use-confirm";
import { ClientOnly } from "@/components/client-only";
import { toast } from "sonner";
import type { FormState } from "@/lib/schemas";
import type { RutinaCompletaInput } from "@/lib/schemas";

// DnD imports
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type DragItem, type DragEndResult } from "@/lib/dnd-utils";

// ============================================
// TYPES
// ============================================

interface DefaultDia {
  nombre: string;
  musculosEnfocados: string;
  ejercicios: Array<{ nombre: string; formato: string }>;
}

type RutinaFormData = Omit<RutinaCompletaInput, "creador"> & { dias: DefaultDia[] };

interface RutinaEditFormProps {
  initialData: {
    id: string;
    nombre: string;
    tipo: "fuerza" | "cardio" | "flexibilidad" | "hipertrofia";
    descripcion?: string;
    dias: Array<{
      id?: string;
      nombre: string;
      musculosEnfocados: string;
      ejercicios: Array<{ id?: string; nombre: string; formato: string }>;
    }>;
  };
  onSuccess?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const tipos = [
  { value: "fuerza", label: "Fuerza" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibilidad", label: "Flexibilidad" },
  { value: "hipertrofia", label: "Hipertrofia" },
];

const MAX_DAYS = 7;

const defaultDia: DefaultDia = {
  nombre: "",
  musculosEnfocados: "",
  ejercicios: [{ nombre: "", formato: "" }],
};

// ============================================
// DRAG OVERLAY COMPONENTS
// ============================================

function GripVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function DiaDragOverlay({ diaIndex }: { diaIndex: number }) {
  return (
    <div className="day-card-overlay px-4 py-3 min-w-[200px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
          <GripVerticalIcon className="h-3 w-3 text-accent" />
        </div>
        <span className="font-medium text-foreground">
          {diaIndex >= 0 ? `Día ${diaIndex + 1}` : "Día"}
        </span>
      </div>
    </div>
  );
}

function EjercicioDragOverlay({ nombre }: { nombre?: string }) {
  return (
    <div className="ejercicio-row-overlay px-3 py-2 min-w-[180px]">
      <div className="flex items-center gap-2">
        <GripVerticalIcon className="h-4 w-4 text-accent shrink-0" />
        <span className="text-sm text-foreground truncate max-w-[150px]">
          {nombre || "Ejercicio"}
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN FORM COMPONENT
// ============================================

export function RutinaEditForm({ initialData, onSuccess }: RutinaEditFormProps) {
  const router = useRouter();
  const { confirm, Dialog } = useConfirm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RutinaFormData>({
    defaultValues: {
      nombre: initialData.nombre,
      tipo: initialData.tipo,
      descripcion: initialData.descripcion || "",
      dias: initialData.dias.map((d) => ({
        nombre: d.nombre,
        musculosEnfocados: d.musculosEnfocados,
        ejercicios: d.ejercicios.length > 0
          ? d.ejercicios.map((e) => ({
              nombre: e.nombre,
              formato: e.formato,
            }))
          : [{ nombre: "", formato: "" }],
      })),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

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

  // Refs
  const fieldsRef = useRef(diasFields);
  useEffect(() => {
    fieldsRef.current = diasFields;
  }, [diasFields]);

  // UI State for expanded days
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(initialData.dias.length > 0 ? [initialData.dias[0].id || "initial"] : [])
  );

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 15 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ---- DnD Handlers ----
  const handleDragStart = useCallback((event: any) => {
    setIsDragging(true);
    const baseData = event.active.data.current as DragItem;
    setActiveItem({
      ...baseData,
      id: event.active.id as string,
    });
  }, []);

  const handleDragOver = useCallback((_event: any) => {
    // Could be used for visual feedback
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    setIsDragging(false);
    setActiveItem(null);

    if (!event.over || event.active.id === event.over.id) return;

    const activeData = event.active.data.current as DragItem;

    if (activeData.type === "dia") {
      // Reorder days
      const oldIndex = diasFields.findIndex((f) => f.id === event.active.id);
      const newIndex = diasFields.findIndex((f) => f.id === event.over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        diasMove(oldIndex, newIndex);
      }
    }
  }, [diasFields, diasMove]);

  // ---- UI Callbacks ----
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

  const handleAddDay = useCallback(() => {
    if (diasFields.length < MAX_DAYS) {
      appendDia({ ...defaultDia });
    }
  }, [appendDia, diasFields.length]);

  const handleRemoveDay = useCallback(
    async (diaId: string, index: number) => {
      const confirmed = await confirm({
        title: "Eliminar día",
        description: "¿Estás seguro de que querés eliminar este día?",
        variant: "destructive",
        confirmText: "Eliminar",
      });

      if (confirmed) {
        removeDia(index);
      }
    },
    [confirm, removeDia]
  );

  // ---- Form Submission ----
  const onSubmit = async (data: RutinaFormData) => {
    setIsSubmitting(true);
    try {
      // Build FormData
      const formData = new FormData();
      formData.append("id", initialData.id);
      formData.append("nombre", data.nombre);
      formData.append("tipo", data.tipo);
      if (data.descripcion) {
        formData.append("descripcion", data.descripcion);
      }

      // Append dias as nested data
      data.dias.forEach((dia, diaIndex) => {
        formData.append(`dias[${diaIndex}][nombre]`, dia.nombre);
        formData.append(`dias[${diaIndex}][musculosEnfocados]`, dia.musculosEnfocados);
        dia.ejercicios.forEach((ejercicio, ejercicioIndex) => {
          formData.append(`dias[${diaIndex}][ejercicios][${ejercicioIndex}][nombre]`, ejercicio.nombre);
          formData.append(`dias[${diaIndex}][ejercicios][${ejercicioIndex}][formato]`, ejercicio.formato);
        });
      });

      const result = await updateRutinaCompleta({} as FormState, formData);

      if (result.success) {
        toast.success("¡Rutina actualizada exitosamente!");
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(result.message || "Error al actualizar la rutina");
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar la rutina");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Memoized ----
  const sortableDayIds = useMemo(
    () => diasFields.map((f) => f.id),
    [diasFields]
  );

  const canAddDay = diasFields.length < MAX_DAYS;

  return (
    <ClientOnly>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        autoScroll={{ acceleration: 0.5, threshold: { x: 50, y: 50 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Routine Details */}
          <div className="space-y-3 p-4 bg-card rounded-xl border border-border theme-transition">
            <h2 className="text-sm font-medium text-muted-foreground">Detalles de la Rutina</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Nombre *</label>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ required: "El nombre es requerido" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Ej: Rutina Full Body"
                      disabled={isSubmitting}
                      className="focus-input h-9"
                    />
                  )}
                />
                {errors?.nombre && (
                  <p className="text-destructive text-xs">{errors.nombre.message}</p>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Tipo *</label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <SegmentedControl
                      name="tipo"
                      value={field.value}
                      onChange={field.onChange}
                      options={tipos}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors?.tipo && (
                  <p className="text-destructive text-xs">{errors.tipo.message}</p>
                )}
              </div>
            </div>

            {/* Descripcion */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Descripción</label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Describe los objetivos de esta rutina..."
                    rows={2}
                    disabled={isSubmitting}
                    className="focus-input resize-none"
                  />
                )}
              />
            </div>
          </div>

          {/* Days Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Días de Entrenamiento
              </h2>
              <span className="text-xs text-muted-foreground/70">
                {diasFields.length}/{MAX_DAYS}
              </span>
            </div>

            <SortableContext
              items={sortableDayIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {diasFields.map((field, index) => (
                  <DiaSection
                    key={field.id}
                    field={field}
                    baseName={`dias.${index}`}
                    diaIndex={index}
                    control={control}
                    isExpanded={expandedDayIds.has(field.id)}
                    onToggle={() => toggleDay(field.id)}
                    onRemove={() => handleRemoveDay(field.id, index)}
                    errors={errors?.dias as any}
                    onRegisterEjerciciosMove={() => {}}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Add Day Button */}
            {canAddDay && (
              <button
                type="button"
                onClick={handleAddDay}
                className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-accent hover:border-accent transition-colors theme-transition text-sm"
              >
                + Agregar Día
              </button>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? "Actualizando..." : "Actualizar Rutina"}
            </Button>
          </div>
        </form>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && activeItem.type === "dia" && (
            <DiaDragOverlay diaIndex={diasFields.findIndex((f) => f.id === activeItem.id)} />
          )}
          {activeItem && activeItem.type === "ejercicio" && (
            <EjercicioDragOverlay />
          )}
        </DragOverlay>

        {Dialog}
      </DndContext>
    </ClientOnly>
  );
}
