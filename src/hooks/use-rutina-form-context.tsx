"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type RefCallback,
} from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { type RutinaCompletaInput } from "@/lib/schemas";

// ============================================
// TYPES
// ============================================

interface DefaultDia {
  nombre: string;
  musculosEnfocados: string[];
  ejercicios: Array<{ nombre: string; formato: string }>;
}

type RutinaFormData = Omit<RutinaCompletaInput, "creador"> & { dias: DefaultDia[] };

interface RutinaFormContextValue {
  // Form methods - stable reference
  form: UseFormReturn<RutinaFormData>;
  diasFields: ReturnType<typeof useFieldArray<any, any, any>>["fields"];
  diasMove: (oldIndex: number, newIndex: number) => void;
  appendDia: (data: DefaultDia) => void;
  removeDia: (index: number) => void;

  // UI State - expanded days (separate from form state)
  expandedDayIds: Set<string>;
  toggleDay: (diaId: string) => void;
  expandDay: (diaId: string) => void;
  collapseDay: (diaId: string) => void;

  // DnD state
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;

  // Ejercicios move functions registry
  registerEjerciciosMove: (diaIndex: number, moveFn: (from: number, to: number) => void) => void;
  getEjerciciosMove: (diaIndex: number) => ((from: number, to: number) => void) | undefined;

  // Validation errors
  errors: any;

  // Max days constraint
  maxDays: number;
  canAddDay: boolean;
}

// ============================================
// CONTEXT
// ============================================

const RutinaFormContext = createContext<RutinaFormContextValue | null>(null);

export function useRutinaFormContext(): RutinaFormContextValue {
  const context = useContext(RutinaFormContext);
  if (!context) {
    throw new Error("useRutinaFormContext must be used within RutinaFormProvider");
  }
  return context;
}

// ============================================
// PROVIDER PROPS
// ============================================

interface RutinaFormProviderProps {
  children: ReactNode;
  /** Initial data for editing an existing routine */
  initialData?: {
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
  /** Callback when form is successfully submitted */
  onSuccess?: () => void;
  /** Storage key for localStorage persistence (optional) */
  storageKey?: string;
  /** Whether to skip persistence (e.g., during drag) */
  skipPersistence?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_DAYS = 7;

const defaultDia: DefaultDia = {
  nombre: "",
  musculosEnfocados: [],
  ejercicios: [{ nombre: "", formato: "" }],
};

const defaultValues: RutinaFormData = {
  nombre: "",
  tipo: "fuerza",
  descripcion: "",
  dias: [{ ...defaultDia }],
};

// ============================================
// PROVIDER COMPONENT
// ============================================

export function RutinaFormProvider({
  children,
  initialData,
  onSuccess,
  storageKey,
  skipPersistence = false,
}: RutinaFormProviderProps) {
  // Separate form state from UI state to prevent cross-re-renders
  // Changes to routine details (nombre, tipo, descripcion) should NOT re-render DiaSection

  // ---- Form State ----
  const form = useForm<RutinaFormData>({
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          tipo: initialData.tipo,
          descripcion: initialData.descripcion || "",
          dias: initialData.dias.map((d) => ({
            nombre: d.nombre,
            musculosEnfocados: Array.isArray(d.musculosEnfocados) ? d.musculosEnfocados : [d.musculosEnfocados],
            ejercicios: d.ejercicios.length > 0
              ? d.ejercicios.map((e) => ({
                  nombre: e.nombre,
                  formato: e.formato,
                }))
              : [{ nombre: "", formato: "" }],
          })),
        }
      : defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const {
    control,
    formState: { errors },
  } = form;

  // ---- Days Field Array ----
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

  // ---- UI State (separate from form) ----
  // This state changes frequently but doesn't need to trigger form re-renders
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(diasFields.length > 0 ? [diasFields[0].id] : [])
  );

  // ---- DnD State ----
  const [isDragging, setIsDragging] = useState(false);

  // ---- Ejercicios Move Functions Registry ----
  // Each DiaSection registers its ejercicios move function here
  const ejerciciosMoveRef = useRef<Map<number, (from: number, to: number) => void>>(new Map());

  // ---- Ref for latest diasFields ----
  const fieldsRef = useRef(diasFields);
  useEffect(() => {
    fieldsRef.current = diasFields;
  }, [diasFields]);

  // ---- Memoized Callbacks ----

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

  const expandDay = useCallback((diaId: string) => {
    setExpandedDayIds((prev) => new Set(prev).add(diaId));
  }, []);

  const collapseDay = useCallback((diaId: string) => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      next.delete(diaId);
      return next;
    });
  }, []);

  const registerEjerciciosMove = useCallback(
    (diaIndex: number, moveFn: (from: number, to: number) => void) => {
      ejerciciosMoveRef.current.set(diaIndex, moveFn);
    },
    []
  );

  const getEjerciciosMove = useCallback((diaIndex: number) => {
    return ejerciciosMoveRef.current.get(diaIndex);
  }, []);

  // ---- Memoized Computed Values ----
  const canAddDay = useMemo(
    () => diasFields.length < MAX_DAYS,
    [diasFields.length]
  );

  // ---- Value Object ----
  // Memoize the entire value to prevent unnecessary re-renders of consumers
  const value = useMemo<RutinaFormContextValue>(
    () => ({
      // Form - stable reference
      form,
      diasFields,
      diasMove,
      appendDia: (data: DefaultDia) => {
        if (diasFields.length < MAX_DAYS) {
          appendDia(data);
        }
      },
      removeDia: (index: number) => removeDia(index),

      // UI State
      expandedDayIds,
      toggleDay,
      expandDay,
      collapseDay,

      // DnD
      isDragging,
      setIsDragging,

      // Registry
      registerEjerciciosMove,
      getEjerciciosMove,

      // Errors
      errors,

      // Constraints
      maxDays: MAX_DAYS,
      canAddDay,
    }),
    [
      form,
      diasFields,
      diasMove,
      appendDia,
      removeDia,
      expandedDayIds,
      toggleDay,
      expandDay,
      collapseDay,
      isDragging,
      registerEjerciciosMove,
      getEjerciciosMove,
      errors,
      canAddDay,
    ]
  );

  return (
    <RutinaFormContext.Provider value={value}>
      {children}
    </RutinaFormContext.Provider>
  );
}

// ============================================
// HOOKS FOR CONSUMERS
// ============================================

/**
 * Hook to access only the dias-related state.
 * Use this in DiaSection to prevent re-renders when routine details change.
 */
export function useDiasContext() {
  const {
    diasFields,
    diasMove,
    appendDia,
    removeDia,
    expandedDayIds,
    toggleDay,
    expandDay,
    collapseDay,
    isDragging,
    setIsDragging,
    registerEjerciciosMove,
    getEjerciciosMove,
    errors,
    maxDays,
    canAddDay,
  } = useRutinaFormContext();

  return useMemo(
    () => ({
      diasFields,
      diasMove,
      appendDia,
      removeDia,
      expandedDayIds,
      toggleDay,
      expandDay,
      collapseDay,
      isDragging,
      setIsDragging,
      registerEjerciciosMove,
      getEjerciciosMove,
      errors,
      maxDays,
      canAddDay,
    }),
    [
      diasFields,
      diasMove,
      appendDia,
      removeDia,
      expandedDayIds,
      toggleDay,
      expandDay,
      collapseDay,
      isDragging,
      setIsDragging,
      registerEjerciciosMove,
      getEjerciciosMove,
      errors,
      maxDays,
      canAddDay,
    ]
  );
}

/**
 * Hook to access only the routine details state.
 * Use this in the details section to prevent re-renders when days change.
 */
export function useRoutineDetailsContext() {
  const { form } = useRutinaFormContext();

  return useMemo(
    () => ({ form }),
    [form]
  );
}
