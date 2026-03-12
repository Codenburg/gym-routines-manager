"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { diaSchema, diaUpdateSchema, type FormState } from "@/lib/schemas";

/**
 * Create a new Dia in a Rutina
 */
export async function createDia(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = diaSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    // Get the current max order for this rutina
    const lastDia = await prisma.dia.findFirst({
      where: { rutinaId: parsed.data.rutinaId },
      orderBy: { orden: "desc" },
    });

    const newOrden = (lastDia?.orden ?? -1) + 1;

    const dia = await prisma.dia.create({
      data: {
        ...parsed.data,
        orden: newOrden,
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/rutinas/${parsed.data.rutinaId}`);

    return {
      success: true,
      data: { id: dia.id },
      message: "Día creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating dia:", error);
    return {
      success: false,
      message: "Error al crear el día",
    };
  }
}

/**
 * Update an existing Dia
 */
export async function updateDia(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  const id = formData.get("id") as string;
  const rutinaId = formData.get("rutinaId") as string;

  if (!id) {
    return {
      success: false,
      message: "ID de día requerido",
    };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = diaUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    const dia = await prisma.dia.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/rutinas/${rutinaId || dia.rutinaId}`);

    return {
      success: true,
      data: { id: dia.id },
      message: "Día actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error updating dia:", error);
    return {
      success: false,
      message: "Error al actualizar el día",
    };
  }
}

/**
 * Delete a Dia
 */
export async function deleteDia(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get("id") as string;
  const rutinaId = formData.get("rutinaId") as string;

  if (!id) {
    return {
      success: false,
      message: "ID de día requerido",
    };
  }

  try {
    await prisma.dia.delete({
      where: { id },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/rutinas/${rutinaId}`);

    return {
      success: true,
      message: "Día eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error deleting dia:", error);
    return {
      success: false,
      message: "Error al eliminar el día",
    };
  }
}

/**
 * Reorder Dias within a Rutina
 */
export async function reorderDias(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rutinaId = formData.get("rutinaId") as string;
  const diaIdsRaw = formData.get("diaIds");

  // Validate JSON parse with try-catch
  let diaIds: string[];
  try {
    diaIds = JSON.parse(diaIdsRaw as string) as string[];
  } catch {
    return {
      success: false,
      message: "Formato de IDs inválido",
    };
  }

  if (!rutinaId || !diaIds || !Array.isArray(diaIds)) {
    return {
      success: false,
      message: "Datos de reorder inválidos",
    };
  }

  try {
    // Use transaction for atomic update
    await prisma.$transaction(
      diaIds.map((id, index) =>
        prisma.dia.update({
          where: { id },
          data: { orden: index },
        })
      )
    );

    revalidatePath(`/admin/rutinas/${rutinaId}`);

    return {
      success: true,
      message: "Días reordenados exitosamente",
    };
  } catch (error) {
    console.error("Error reordering dias:", error);
    return {
      success: false,
      message: "Error al reordenar los días",
    };
  }
}
