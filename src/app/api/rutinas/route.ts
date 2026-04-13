import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RutinaQueryResult {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  creadorId: string;
  creadorUser: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
  _count: {
    dias: number;
  };
  dias: {
    id: string;
    musculosEnfocados: string[] | null;
    orden: number;
    ejercicios: {
      id: string;
      nombre: string;
      series: number | null;
      repes: number | null;
    }[];
  }[];
}

/**
 * GET /api/rutinas
 * Returns a list of routines with optional search filter
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const trainersParam = searchParams.get("trainers") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
  const skip = (page - 1) * limit;

  try {
    // Build the where clause for filtering
    const where: Record<string, unknown> = {};

    // Search: filter by nombre ONLY (not creator)
    if (search.trim().length > 0) {
      where.nombre = {
        contains: search.trim(),
        mode: "insensitive" as const,
      };
    }

    // Filter by multiple trainers (comma-separated) - use creadorUser.name
    if (trainersParam.trim().length > 0) {
      const trainersList = trainersParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (trainersList.length > 0) {
        where.creadorUser = {
          name: {
            in: trainersList,
            mode: "insensitive" as const,
          },
        };
      }
    }

    // Get total count for pagination
    const total = await prisma.rutina.count({ where });

    // Query with proper TypeScript typing
    const rutinas: RutinaQueryResult[] = await prisma.rutina.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        tipo: true,
        descripcion: true,
        creadorId: true,
        creadorUser: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            dias: true,
          },
        },
        dias: {
          select: {
            id: true,
            musculosEnfocados: true,
            orden: true,
            ejercicios: {
              select: {
                id: true,
                nombre: true,
                series: true,
                repes: true,
              },
              orderBy: {
                orden: "asc",
              },
            },
          },
          orderBy: {
            orden: "asc",
          },
        },
      },
      skip,
      take: limit,
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
      creadorId: rutina.creadorId,
      creadorUser: rutina.creadorUser,
      createdAt: rutina.createdAt.toISOString(),
      updatedAt: rutina.updatedAt.toISOString(),
      diasCount: rutina._count.dias,
      dias: rutina.dias.map((dia) => ({
        id: dia.id,
        musculosEnfocados: dia.musculosEnfocados,
        orden: dia.orden,
        ejercicios: dia.ejercicios.map((ej) => ({
          id: ej.id,
          nombre: ej.nombre,
          series: ej.series,
          repes: ej.repes,
        })),
      })),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: response,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch rutinas:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
