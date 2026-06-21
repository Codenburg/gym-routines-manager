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
}

/**
 * Parse a "4x12" format string into its components.
 * Used to populate split inputs when editing existing exercises.
 */
export function parseInitialFormat(value: string | undefined): { series: string; reps: string } {
  if (!value) return { series: "", reps: "" };

  const match = value.match(/^(\d+)x(\d+)$/);

  if (!match) return { series: "", reps: "" };

  return {
    series: match[1],
    reps: match[2],
  };
}

/**
 * Combine series and reps values into "4x12" format string.
 * Returns "0x0" if both inputs are empty/invalid.
 */
export function combineToFormat(series: number | string, reps: number | string): string {
  const s = Number(series) || 0;
  const r = Number(reps) || 0;
  return `${s}x${r}`;
}

// ======================
// Ejercicio Schemas (Flat - for separate creation)
// ======================

export const ejercicioSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  series: z.coerce.number().int().min(1, { error: "Las series son requeridas" }).max(999),
  repes: z.coerce.number().int().min(1, { error: "Las repes son requeridas" }).max(999),
  diaId: z.string().uuid({ error: "ID de día inválido" }),
});

export const ejercicioUpdateSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  series: z.coerce.number().int().min(1, { error: "Las series son requeridas" }).max(999),
  repes: z.coerce.number().int().min(1, { error: "Las repes son requeridas" }).max(999),
  diaId: z.string().uuid({ error: "ID de día inválido" }),
});

export type EjercicioInput = z.infer<typeof ejercicioSchema>;
export type EjercicioUpdateInput = z.infer<typeof ejercicioUpdateSchema>;

// ======================
// Ejercicio Schema (Nested - for routine creation)
// ======================

const ejercicioNestedSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre del ejercicio es requerido" }).max(100),
  formato: z.string().min(1, { message: "Series y reps son requeridas" }).default(""),
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
  musculosEnfocados: z.array(z.string().max(50)).max(10).optional(),
  rutinaId: z.string().uuid({ error: "ID de rutina inválido" }),
});

export const diaUpdateSchema = diaSchema.partial();

export type DiaInput = z.infer<typeof diaSchema>;
export type DiaUpdateInput = z.infer<typeof diaUpdateSchema>;

// ======================
// Dia Schema (Nested - for routine creation)
// ======================

const diaNestedSchema = z.object({
  musculosEnfocados: z.array(z.string().max(50)).max(10).optional().default([]),
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
// Promocion Schemas
// ======================

export const createPromocionSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  precio: z.coerce.number({ error: "El precio debe ser un número válido" }).int({ error: "El precio debe ser un número entero" }).positive({ error: "El precio debe ser un valor positivo" }),
  activo: z.boolean().default(true),
});

export const updatePromocionSchema = createPromocionSchema.partial();

// Per-action schemas for atomic updates (single responsibility)
export const updatePromocionContentSchema = z.object({
  id: z.string().min(1, { message: "ID requerido" }),
  titulo: z.string().min(1, { message: "El título es requerido" }),
  descripcion: z.string().optional(),
});

export const updatePromocionPrecioSchema = z.object({
  id: z.string().min(1, { message: "ID requerido" }),
  precio: z.coerce.number({ error: "El precio debe ser un número válido" }).int({ error: "El precio debe ser un número entero" }).positive({ error: "El precio debe ser un valor positivo" }),
});

export const togglePromocionActivoSchema = z.object({
  id: z.string().min(1, { message: "ID requerido" }),
  activo: z.boolean(),
});

export type CreatePromocionInput = z.infer<typeof createPromocionSchema>;
export type UpdatePromocionInput = z.infer<typeof updatePromocionSchema>;
export type UpdatePromocionContentInput = z.infer<typeof updatePromocionContentSchema>;
export type UpdatePromocionPrecioInput = z.infer<typeof updatePromocionPrecioSchema>;
export type TogglePromocionActivoInput = z.infer<typeof togglePromocionActivoSchema>;

// Promocion type (matches Prisma model)
export interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  gymId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ActionResult pattern for server actions
export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

// FormState for Promocion - use any to allow Prisma entity returns with id, createdAt, etc.
export type PromocionFormState = FormState<any>;

// ======================
// DescuentoDuracion Schemas
// ======================

// meses is any integer in [1, 12] — matches the 12-option UI dropdown (MESES_OPTIONS)
export const mesesEnum = z.number().int().min(1).max(12);

export const createDescuentoDuracionSchema = z.object({
  meses: mesesEnum,
  porcentaje: z.coerce.number({ error: "El porcentaje debe ser un número válido" }).int({ error: "El porcentaje debe ser un número entero" }).min(0, { error: "El porcentaje no puede ser negativo" }).max(100, { error: "El porcentaje no puede superar 100" }),
});

export const updateDescuentoDuracionSchema = createDescuentoDuracionSchema.partial();

export type CreateDescuentoDuracionInput = z.infer<typeof createDescuentoDuracionSchema>;
export type UpdateDescuentoDuracionInput = z.infer<typeof updateDescuentoDuracionSchema>;

// FormState for DescuentoDuracion - use any to allow Prisma entity returns with id, createdAt, etc.
export type DescuentoDuracionFormState = FormState<any>;

// ======================
// Trainer Schemas
// ======================

export const createTrainerSchema = z.object({
  username: z
    .string()
    .min(7, { message: "El DNI debe tener 7-8 dígitos" })
    .regex(/^\d{7,8}$/, { message: "El DNI debe tener solo números" }),
  name: z.string().min(2, { message: "El nombre es requerido (mínimo 2 caracteres)" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export const updateTrainerSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).optional(),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }).optional(),
});

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerInput = z.infer<typeof updateTrainerSchema>;

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

// ======================
// Gym Display Field Schema
// ======================
//
// Per-field validation for the gym config admin page. Each variant is keyed
// by its `field` discriminant so Zod can apply the right rule:
//   - string-typed fields: trimmed, non-empty, bounded length
//   - URL-typed fields: must be a valid URL, bounded length
//   - horarioJson: a full HorarioSemanal object (or null when unconfigured)
//
// Designed for the `updateGymField` server action, which accepts a
// FormData payload with `field` and `value` keys. Pairs with GymField type.

// HH:MM 24-hour format regex — used by horarioDiaSchema.
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Per-day schedule entry.
 *
 * `abierto: false` indicates the gym is closed that day; the time pickers
 * are hidden at the form level so `apertura`/`cierre` are typically `null`,
 * but the Zod schema is intentionally permissive (nullish) so partial
 * data can be saved if needed. Cross-midnight schedules (apertura > cierre)
 * are NOT handled in v1 — documented in the spec.
 */
export const horarioDiaSchema = z.object({
  abierto: z.boolean(),
  apertura: z.string().regex(HHMM, { error: "Formato de hora inválido (HH:MM)" }).nullish(),
  cierre: z.string().regex(HHMM, { error: "Formato de hora inválido (HH:MM)" }).nullish(),
});

/**
 * Full weekly schedule — exactly 7 day entries in fixed order.
 * Validation is strict: every day key MUST be present.
 * `horarioJson` on the Gym singleton is either `null` or this exact shape.
 */
export const horarioSemanalSchema = z.object({
  lun: horarioDiaSchema,
  mar: horarioDiaSchema,
  mie: horarioDiaSchema,
  jue: horarioDiaSchema,
  vie: horarioDiaSchema,
  sab: horarioDiaSchema,
  dom: horarioDiaSchema,
});

export type HorarioDia = z.infer<typeof horarioDiaSchema>;
export type HorarioSemanal = z.infer<typeof horarioSemanalSchema>;

export const GYM_FIELD_NAMES = [
  "nombre",
  "horarioJson",
  "direccion",
  "mapsEmbedUrl",
  "socialInstagram",
  "socialWhatsapp",
] as const;

export type GymField = (typeof GYM_FIELD_NAMES)[number];

export const gymFieldSchema = z.discriminatedUnion("field", [
  z.object({
    field: z.literal("nombre"),
    value: z
      .string()
      .trim()
      .min(1, { error: "El nombre no puede estar vacío" })
      .max(80, { error: "El nombre no puede superar 80 caracteres" }),
  }),
  z.object({
    field: z.literal("horarioJson"),
    // The form posts a JSON-stringified HorarioSemanal; Zod parses
    // the string first and then validates the inner object.
    value: z
      .string()
      .transform((raw, ctx) => {
        try {
          return JSON.parse(raw);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "horarioJson debe ser JSON válido",
          });
          return z.NEVER;
        }
      })
      .pipe(horarioSemanalSchema.nullable()),
  }),
  z.object({
    field: z.literal("direccion"),
    value: z
      .string()
      .trim()
      .min(1, { error: "La dirección no puede estar vacía" })
      .max(200, { error: "La dirección no puede superar 200 caracteres" }),
  }),
  z.object({
    field: z.literal("mapsEmbedUrl"),
    value: z
      .string()
      .trim()
      .url({ error: "URL de mapa inválida" })
      .max(2000, { error: "La URL de mapa es demasiado larga" }),
  }),
  z.object({
    field: z.literal("socialInstagram"),
    value: z
      .string()
      .trim()
      .url({ error: "URL de Instagram inválida" })
      .max(500, { error: "La URL de Instagram es demasiado larga" }),
  }),
  z.object({
    field: z.literal("socialWhatsapp"),
    value: z
      .string()
      .trim()
      .url({ error: "URL de WhatsApp inválida" })
      .max(500, { error: "La URL de WhatsApp es demasiado larga" }),
  }),
]);

export type GymFieldInput = z.infer<typeof gymFieldSchema>;

// Public type for the display fields — used by readers and form components.
export interface GymDisplay {
  nombre: string | null;
  horarioJson: HorarioSemanal | null;
  direccion: string | null;
  mapsEmbedUrl: string | null;
  socialInstagram: string | null;
  socialWhatsapp: string | null;
}

// Generic last-resort fallback for unauthenticated gym-name rendering.
// Intentionally neutral — must NOT identify any specific gym or client.
export const GENERIC_GYM_NAME = "Gimnasio";
