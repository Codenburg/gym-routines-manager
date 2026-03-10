import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RutinaQueryResult {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    dias: number;
  };
}

/**
 * GET /api/rutinas
 * Returns a list of routines with optional search filter
 *
 * Query Parameters:
 * - search (optional): Filter by nombre (case-insensitive)
 *
 * Response 200:
 * - Array of Rutina objects with id, nombre, tipo, descripcion, createdAt, updatedAt, diasCount
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  try {
    // Build the where clause for filtering
    const where =
      search.trim().length > 0
        ? {
            nombre: {
              contains: search.trim(),
              mode: "insensitive" as const,
            },
          }
        : {};

    // Query with proper TypeScript typing
    const rutinas: RutinaQueryResult[] = await prisma.rutina.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        tipo: true,
        descripcion: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            dias: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response to match the expected format
    const response = rutinas.map((rutina) => ({
      id: rutina.id,
      nombre: rutina.nombre,
      tipo: rutina.tipo,
      descripcion: rutina.descripcion,
      createdAt: rutina.createdAt.toISOString(),
      updatedAt: rutina.updatedAt.toISOString(),
      diasCount: rutina._count.dias,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch rutinas:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
