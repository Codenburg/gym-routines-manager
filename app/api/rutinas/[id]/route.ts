import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/rutinas/[id]
 * Returns a single routine by ID with all its days and exercises
 *
 * Response 200:
 * - Rutina object with id, nombre, tipo, descripcion, dias (array of Dia objects)
 *
 * Response 404:
 * - Error message indicating routine not found
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const rutina = await prisma.rutina.findUnique({
      where: { id },
      include: {
        dias: {
          orderBy: { orden: "asc" },
          include: {
            ejercicios: {
              orderBy: { orden: "asc" },
            },
          },
        },
      },
    });

    if (!rutina) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    // Transform the response
    const response = {
      id: rutina.id,
      nombre: rutina.nombre,
      tipo: rutina.tipo,
      descripcion: rutina.descripcion,
      createdAt: rutina.createdAt.toISOString(),
      updatedAt: rutina.updatedAt.toISOString(),
      dias: rutina.dias.map((dia) => ({
        id: dia.id,
        nombre: dia.nombre,
        musculosEnfocados: dia.musculosEnfocados,
        orden: dia.orden,
        ejercicios: dia.ejercicios.map((ejercicio) => ({
          id: ejercicio.id,
          nombre: ejercicio.nombre,
          orden: ejercicio.orden,
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch rutina:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
