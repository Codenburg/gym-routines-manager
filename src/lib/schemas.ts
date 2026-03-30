import { z } from "zod";
import { getToday } from "@/lib/dates";

// ======================
// Formato 4x12 helper
// ======================

export function parseFormato(value: string | undefined): { series: number | undefined; repes: number | undefined } | null {
  if (!value) return { series: undefined, repes: undefined };

  const match = value.match(/^(\d+)x(\d+)$/);

  if (!match) return null;

  return {
    series: Number(match[1]),
    repes: Number(match[2]),
  };
};

// ======================
// Ejercicio Schemas (Flat - for separate creation)
// ======================

export const ejercicioSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  formato: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+x\d+$/.test(val), {
      message: "Formato inválido (usar 4x12)",
    })
    .transform((val) => {
      if (!val) return { series: undefined, repes: undefined };
      return parseFormato(val);
    }),
  diaId: z.string().uuid({ error: "ID de día inválido" }),
});

export const ejercicioUpdateSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  formato: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+x\d+$/.test(val), {
      message: "Formato inválido (usar 4x12)",
    })
    .transform((val) => {
      if (!val) return { series: undefined, repes: undefined };
      return parseFormato(val);
    }),
  diaId: z.string().uuid({ error: "ID de día inválido" }),
});

export type EjercicioInput = z.infer<typeof ejercicioSchema>;
export type EjercicioUpdateInput = z.infer<typeof ejercicioUpdateSchema>;

// ======================
// Ejercicio Schema (Nested - for routine creation)
// ======================

const ejercicioNestedSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre del ejercicio es requerido" }).max(100),
  formato: z.string().optional(),
});

export type EjercicioNestedInput = z.infer<typeof ejercicioNestedSchema>;

// ======================
// Dia Schemas (Flat - for separate creation)
// ======================

// Backend-only: nombre is generated automatically
export const createDiaSchema = z.object({
  rutinaId: z.string().uuid({ error: "ID de rutina inválido" }),
});

export const diaSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(50),
  musculosEnfocados: z.string().max(200).optional(),
  rutinaId: z.string().uuid({ error: "ID de rutina inválido" }),
});

export const diaUpdateSchema = diaSchema.partial();

export type DiaInput = z.infer<typeof diaSchema>;
export type DiaUpdateInput = z.infer<typeof diaUpdateSchema>;

// ======================
// Dia Schema (Nested - for routine creation)
// ======================

const diaNestedSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre del día es requerido" }).max(50),
  musculosEnfocados: z.string().max(200).optional(),
  ejercicios: z
    .array(ejercicioNestedSchema)
    .min(1, { error: "Cada día debe tener al menos un ejercicio" }),
});

export type DiaNestedInput = z.infer<typeof diaNestedSchema>;

// ======================
// Rutina Schema (Flat - for separate creation)
// NOTE: creadorId is set server-side from session user.id
// ======================

export const rutinaSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  tipo: z.enum(["fuerza", "cardio", "flexibilidad", "hipertrofia"], {
    error: "Tipo inválido",
  }),
  descripcion: z.string().max(500).optional(),
});

export const rutinaUpdateSchema = rutinaSchema.partial();

export type RutinaInput = z.infer<typeof rutinaSchema>;
export type RutinaUpdateInput = z.infer<typeof rutinaUpdateSchema>;

// ======================
// Rutina Completa Schema (Nested - for routine creation)
// NOTE: creadorId is set server-side from session user.id
// ======================

export const rutinaCompletaSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  tipo: z.enum(["fuerza", "cardio", "flexibilidad", "hipertrofia"], {
    error: "Tipo inválido",
  }),
  descripcion: z.string().max(500).optional(),
  dias: z
    .array(diaNestedSchema)
    .min(1, { error: "La rutina debe tener al menos un día" }),
});

export type RutinaCompletaInput = z.infer<typeof rutinaCompletaSchema>;

// ======================
// Reorder Schema
// ======================

export const reorderSchema = z.object({
  diaId: z.string().uuid({ error: "ID de día inválido" }),
  ejercicioIds: z.array(z.string().uuid({ error: "ID de ejercicio inválido" })),
});

export type ReorderInput = z.infer<typeof reorderSchema>;

// ======================
// Auth Schemas
// ======================

export const loginSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, { error: "DNI inválido (7-8 dígitos)" }),
  password: z.string().min(1, { error: "La contraseña es requerida" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ======================
// Feriado Schema
// ======================

// Base Feriado schema without transforms (for shared refinements)
const baseFeriadoSchema = z.object({
  fecha: z.string().min(1, { message: "La fecha es requerida" }),
  todo_dia: z
    .union([z.literal("on"), z.literal("true"), z.literal("false")])
    .transform((v) => v === "on" || v === "true")
    .default(true),
  hora_inicio: z.string().optional(),
  hora_fin: z.string().optional(),
});

// Feriado refinements shared between create and update
const feriadoRefinements = baseFeriadoSchema
  // If todo_dia=false, both times are required
  .refine(
    (data) => {
      if (data.todo_dia === false) {
        return Boolean(data.hora_inicio && data.hora_fin);
      }
      return true;
    },
    {
      message: "Hora de inicio y fin son requeridas para horarios parciales",
    }
  )
  // hora_inicio must be strictly less than hora_fin
  .refine(
    (data) => {
      if (data.hora_inicio && data.hora_fin) {
        return data.hora_inicio < data.hora_fin;
      }
      return true;
    },
    {
      message: "La hora de inicio debe ser anterior a la hora de fin",
    }
  );

// Schema for creating a Feriado (fecha stays as string YYYY-MM-DD)
export const createFeriadoSchema = baseFeriadoSchema
  .transform((data) => ({
    fecha: data.fecha, // Keep as string, calendar date only
    todo_dia: data.todo_dia,
    hora_inicio: data.hora_inicio,
    hora_fin: data.hora_fin,
  }))
  .refine(
    (data) => data.fecha >= getToday(),
    { message: "No se pueden seleccionar fechas pasadas", path: ["fecha"] }
  );

// Schema for updating a Feriado (fecha is optional and kept as string if provided)
export const updateFeriadoSchema = baseFeriadoSchema
  .partial()
  .transform((data) => ({
    fecha: data.fecha, // Keep as string, calendar date only
    todo_dia: data.todo_dia,
    hora_inicio: data.hora_inicio,
    hora_fin: data.hora_fin,
  }))
  .refine(
    (data) => !data.fecha || data.fecha >= getToday(),
    { message: "No se pueden seleccionar fechas pasadas", path: ["fecha"] }
  );

// Keep antiguo name as alias for backwards compatibility
export const feriadoSchema = createFeriadoSchema;

export type FeriadoInput = z.infer<typeof createFeriadoSchema>;
export type FeriadoUpdateInput = z.infer<typeof updateFeriadoSchema>;

// ======================
// ID Validation Schema
// ======================

export const idSchema = z.string().uuid({ error: "ID inválido" });

// ======================
// Form State Type
// ======================

export interface FormState<T = void> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
  statusCode?: number;
  code?: string;
}
