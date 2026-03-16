import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string; diaId: string }>;
}

/**
 * GET /api/rutinas/[id]/dias/[diaId]
 * Returns a single day with its exercises
 *
 * Response 200:
 * - Day object with id, nombre, musculosEnfocados, orden, ejercicios array
 *
 * Response 404:
 * - Error message indicating day not found or routine not found
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: rutinaId, diaId } = await params;

  try {
    // First verify the routine exists
    const rutina = await prisma.rutina.findUnique({
      where: { id: rutinaId },
    });

    if (!rutina) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    // Get the day - must belong to this routine
    const dia = await prisma.dia.findFirst({
      where: {
        id: diaId,
        rutinaId: rutinaId,
      },
      include: {
        ejercicios: {
          orderBy: { orden: "asc" },
        },
      },
    });

    if (!dia) {
      return NextResponse.json(
        { error: "Day not found" },
        { status: 404 }
      );
    }

    // Transform the response
    const response = {
      id: dia.id,
      nombre: dia.nombre,
      musculosEnfocados: dia.musculosEnfocados,
      orden: dia.orden,
      ejercicios: dia.ejercicios.map((ejercicio) => ({
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        series: ejercicio.series,
        orden: ejercicio.orden,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch day:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
