import { z } from "zod";

// ======================
// Ejercicio Schemas (Flat - for separate creation)
// ======================

export const ejercicioSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre es requerido" }).max(100),
  series: z.string().max(20).optional(),
  repes: z.string().max(20).optional(),
  diaId: z.string().uuid({ error: "ID de día inválido" }),
});

export const ejercicioUpdateSchema = ejercicioSchema.partial();

export type EjercicioInput = z.infer<typeof ejercicioSchema>;
export type EjercicioUpdateInput = z.infer<typeof ejercicioUpdateSchema>;

// ======================
// Ejercicio Schema (Nested - for routine creation)
// ======================

const ejercicioNestedSchema = z.object({
  nombre: z.string().min(1, { error: "El nombre del ejercicio es requerido" }).max(100),
  series: z.string().max(20).optional(),
  repes: z.string().max(20).optional(),
});

export type EjercicioNestedInput = z.infer<typeof ejercicioNestedSchema>;

// ======================
// Dia Schemas (Flat - for separate creation)
// ======================

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
  email: z.email({ error: "Email inválido" }),
  password: z.string().min(1, { error: "La contraseña es requerida" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

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
}
