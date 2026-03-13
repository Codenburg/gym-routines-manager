"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  rutinaSchema,
  rutinaUpdateSchema,
  rutinaCompletaSchema,
  idSchema,
  type FormState,
} from "@/lib/schemas";
import type { RutinaCompletaInput } from "@/lib/schemas";

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(headers: Headers): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    const user = session.user as { admin?: boolean } | undefined;
    if (!user?.admin) {
      return { authorized: false, message: "No tienes permisos de administrador" };
    }
    return { authorized: true };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

/**
 * Create a new Rutina
 */
export async function createRutina(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = rutinaSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const rutina = await prisma.rutina.create({
      data: parsed.data,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");

    return {
      success: true,
      data: { id: rutina.id },
      message: "Rutina creada exitosamente",
    };
  } catch (error) {
    console.error("Error creating rutina:", error);
    return {
      success: false,
      message: "Error al crear la rutina",
    };
  }
}

/**
 * Update an existing Rutina
 */
export async function updateRutina(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  const id = formData.get("id") as string;

  // Validate UUID format
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) {
    return {
      success: false,
      message: "ID de rutina inválido",
    };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = rutinaUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const rutina = await prisma.rutina.update({
      where: { id: idParsed.data },
      data: parsed.data,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");
    revalidatePath(`/admin/rutinas/${idParsed.data}`);

    return {
      success: true,
      data: { id: rutina.id },
      message: "Rutina actualizada exitosamente",
    };
  } catch (error) {
    console.error("Error updating rutina:", error);
    return {
      success: false,
      message: "Error al actualizar la rutina",
    };
  }
}

/**
 * Delete a Rutina
 */
export async function deleteRutina(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  const id = formData.get("id") as string;

  // Validate UUID format
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return {
      success: false,
      message: "ID de rutina inválido",
    };
  }

  try {
    await prisma.rutina.delete({
      where: { id: parsed.data },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");

    return {
      success: true,
      message: "Rutina eliminada exitosamente",
    };
  } catch (error) {
    console.error("Error deleting rutina:", error);
    return {
      success: false,
      message: "Error al eliminar la rutina",
    };
  }
}

/**
 * Get all Rutinas (for server components)
 */
export async function getRutinas() {
  try {
    const rutinas = await prisma.rutina.findMany({
      include: {
        dias: {
          include: {
            ejercicios: true,
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rutinas.map((rutina) => ({
      ...rutina,
      diasCount: rutina.dias.length,
    }));
  } catch (error) {
    console.error("Error fetching rutinas:", error);
    return [];
  }
}

/**
 * Get a single Rutina by ID
 */
export async function getRutina(id: string) {
  try {
    const rutina = await prisma.rutina.findUnique({
      where: { id },
      include: {
        dias: {
          include: {
            ejercicios: {
              orderBy: { orden: "asc" },
            },
          },
          orderBy: { orden: "asc" },
        },
      },
    });

    return rutina;
  } catch (error) {
    console.error("Error fetching rutina:", error);
    return null;
  }
}

/**
 * Parse indexed FormData (dias[0].nombre, dias[0].ejercicios[0].nombre) into nested object
 */
function parseNestedFormData(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    // Match patterns like: dias[0].nombre, dias[0].ejercicios[1].series
    const match = key.match(/^([a-zA-Z_]+)\[(\d+)\](.*)$/);

    if (!match) {
      // Simple key-value (e.g., nombre, tipo)
      result[key] = value;
      continue;
    }

    const [, arrayName, indexStr, rest] = match;
    const index = parseInt(indexStr, 10);

    // Initialize array if it doesn't exist
    if (!result[arrayName]) {
      result[arrayName] = [];
    }
    const array = result[arrayName] as unknown[];

    // Initialize the object at this index if it doesn't exist
    if (!array[index]) {
      array[index] = {};
    }
    const current = array[index] as Record<string, unknown>;

    if (rest.startsWith(".")) {
      // Nested property: dias[0].ejercicios[0].nombre
      const nestedMatch = rest.match(/^\.([a-zA-Z_]+)\[(\d+)\](.*)$/);

      if (nestedMatch) {
        const [, nestedArrayName, nestedIndexStr, nestedRest] = nestedMatch;
        const nestedIndex = parseInt(nestedIndexStr, 10);

        // Initialize nested array if it doesn't exist
        if (!current[nestedArrayName]) {
          current[nestedArrayName] = [];
        }
        const nestedArray = current[nestedArrayName] as unknown[];

        if (!nestedArray[nestedIndex]) {
          nestedArray[nestedIndex] = {};
        }
        const nestedObject = nestedArray[nestedIndex] as Record<string, unknown>;

        if (nestedRest.startsWith(".")) {
          // Direct property: dias[0].ejercicios[0].nombre
          const propName = nestedRest.substring(1);
          nestedObject[propName] = value;
        }
      } else {
        // Simple property after array: dias[0].nombre
        const propName = rest.substring(1);
        current[propName] = value;
      }
    } else {
      // Direct value at array index: dias[0]
      array[index] = value;
    }
  }

  // Clean up empty objects from arrays
  for (const key of Object.keys(result)) {
    const array = result[key] as unknown[];
    if (Array.isArray(array)) {
      result[key] = array.filter(
        (item) =>
          item !== undefined && (typeof item !== "object" || (item !== null && Object.keys(item).length > 0))
      );
    }
  }

  return result;
}

/**
 * Create a complete Rutina with nested Dias and Ejercicios
 */
export async function createRutinaCompleta(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  // Parse nested FormData
  const rawData = parseNestedFormData(formData);

  // Validate with schema
  const parsed = rutinaCompletaSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  const data = parsed.data as RutinaCompletaInput;

  try {
    const rutina = await prisma.$transaction(async (tx) => {
      // Create the Rutina
      const createdRutina = await tx.rutina.create({
        data: {
          nombre: data.nombre,
          tipo: data.tipo,
          descripcion: data.descripcion,
        },
      });

      // Create Dias and Ejercicios with sequential orden
      for (let diaIndex = 0; diaIndex < data.dias.length; diaIndex++) {
        const diaData = data.dias[diaIndex];

        const createdDia = await tx.dia.create({
          data: {
            rutinaId: createdRutina.id,
            nombre: diaData.nombre,
            musculosEnfocados: diaData.musculosEnfocados,
            orden: diaIndex,
          },
        });

        // Create Ejercicios for this Dia
        for (let ejercicioIndex = 0; ejercicioIndex < diaData.ejercicios.length; ejercicioIndex++) {
          const ejercicioData = diaData.ejercicios[ejercicioIndex];

          await tx.ejercicio.create({
            data: {
              diaId: createdDia.id,
              nombre: ejercicioData.nombre,
              series: ejercicioData.series,
              repes: ejercicioData.repes,
              orden: ejercicioIndex,
            },
          });
        }
      }

      return createdRutina;
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");

    return {
      success: true,
      data: { id: rutina.id },
      message: "Rutina creada exitosamente",
    };
  } catch (error) {
    console.error("Error creating rutina completa:", error);
    return {
      success: false,
      message: "Error al crear la rutina",
    };
  }
}
