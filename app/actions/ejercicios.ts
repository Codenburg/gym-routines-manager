"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ejercicioSchema, ejercicioUpdateSchema, type FormState } from "@/lib/schemas";

/**
 * Create a new Ejercicio in a Dia
 */
export async function createEjercicio(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = ejercicioSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    // Get the current max order for this dia
    const lastEjercicio = await prisma.ejercicio.findFirst({
      where: { diaId: parsed.data.diaId },
      orderBy: { orden: "desc" },
    });

    const newOrden = (lastEjercicio?.orden ?? -1) + 1;

    const ejercicio = await prisma.ejercicio.create({
      data: {
        ...parsed.data,
        orden: newOrden,
      },
    });

    // Get the rutinaId for revalidation
    const dia = await prisma.dia.findUnique({
      where: { id: parsed.data.diaId },
      select: { rutinaId: true },
    });

    revalidatePath("/admin/dashboard");
    if (dia) {
      revalidatePath(`/admin/rutinas/${dia.rutinaId}`);
    }

    return {
      success: true,
      data: { id: ejercicio.id },
      message: "Ejercicio creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating ejercicio:", error);
    return {
      success: false,
      message: "Error al crear el ejercicio",
    };
  }
}

/**
 * Update an existing Ejercicio
 */
export async function updateEjercicio(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  const id = formData.get("id") as string;

  if (!id) {
    return {
      success: false,
      message: "ID de ejercicio requerido",
    };
  }

  // Validate form data
  const rawData = Object.fromEntries(formData.entries());
  const parsed = ejercicioUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Error de validación",
    };
  }

  try {
    // Get the dia first to know the rutinaId for revalidation
    const ejercicio = await prisma.ejercicio.findUnique({
      where: { id },
      select: { dia: { select: { rutinaId: true } } },
    });

    const updatedEjercicio = await prisma.ejercicio.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/admin/dashboard");
    if (ejercicio) {
      revalidatePath(`/admin/rutinas/${ejercicio.dia.rutinaId}`);
    }

    return {
      success: true,
      data: { id: updatedEjercicio.id },
      message: "Ejercicio actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error updating ejercicio:", error);
    return {
      success: false,
      message: "Error al actualizar el ejercicio",
    };
  }
}

/**
 * Delete an Ejercicio
 */
export async function deleteEjercicio(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get("id") as string;

  if (!id) {
    return {
      success: false,
      message: "ID de ejercicio requerido",
    };
  }

  try {
    // Get the dia first to know the rutinaId for revalidation
    const ejercicio = await prisma.ejercicio.findUnique({
      where: { id },
      select: { dia: { select: { rutinaId: true } } },
    });

    await prisma.ejercicio.delete({
      where: { id },
    });

    revalidatePath("/admin/dashboard");
    if (ejercicio) {
      revalidatePath(`/admin/rutinas/${ejercicio.dia.rutinaId}`);
    }

    return {
      success: true,
      message: "Ejercicio eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error deleting ejercicio:", error);
    return {
      success: false,
      message: "Error al eliminar el ejercicio",
    };
  }
}
