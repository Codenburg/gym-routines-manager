"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { reorderSchema, type FormState } from "@/lib/schemas";

/**
 * Reorder Ejercicios within a Dia
 * Uses Prisma transaction for atomic update
 */
export async function reorderEjercicios(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const diaId = formData.get("diaId") as string;
  const ejercicioIdsRaw = formData.get("ejercicioIds");

  // Validate JSON parse with try-catch
  let ejercicioIds: string[];
  try {
    ejercicioIds = JSON.parse(ejercicioIdsRaw as string) as string[];
  } catch {
    return {
      success: false,
      message: "Formato de IDs inválido",
    };
  }

  // Validate input
  const parsed = reorderSchema.safeParse({ diaId, ejercicioIds });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Datos de reorder inválidos",
    };
  }

  try {
    // Get the rutinaId for revalidation
    const dia = await prisma.dia.findUnique({
      where: { id: parsed.data.diaId },
      select: { rutinaId: true },
    });

    if (!dia) {
      return {
        success: false,
        message: "Día no encontrado",
      };
    }

    // Use transaction for atomic update - all exercises get new orden values
    await prisma.$transaction(
      parsed.data.ejercicioIds.map((id, index) =>
        prisma.ejercicio.update({
          where: { id },
          data: { orden: index },
        })
      )
    );

    revalidatePath(`/admin/rutinas/${dia.rutinaId}`);

    return {
      success: true,
      message: "Ejercicios reordenados exitosamente",
    };
  } catch (error) {
    console.error("Error reordering ejercicios:", error);
    return {
      success: false,
      message: "Error al reordenar los ejercicios",
    };
  }
}
