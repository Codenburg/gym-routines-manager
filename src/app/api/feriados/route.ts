import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createFeriadoSchema, updateFeriadoSchema } from "@/lib/schemas";
import { normalizeToDate } from "@/lib/dates";

/**
 * Extended response interface for API (includes new fields)
 */
interface FeriadoApiResponse {
  id: string;
  fecha: string;
  todo_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  createdAt: string;
}

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(headers: Headers): Promise<{ authorized: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    if (session.user.role !== "ADMIN") {
      return { authorized: false, message: "No tienes permisos de administrador" };
    }
    return { authorized: true };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

/**
 * GET /api/feriados
 * Returns a list of all holidays
 *
 * Response 200:
 * - Array of Feriado objects with id, fecha, createdAt
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: "asc" },
    });

    const response: FeriadoApiResponse[] = feriados.map((feriado) => ({
      id: feriado.id,
      fecha: normalizeToDate(feriado.fecha),
      todo_dia: feriado.todo_dia,
      hora_inicio: feriado.hora_inicio,
      hora_fin: feriado.hora_fin,
      createdAt: feriado.createdAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch feriados:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feriados
 * Creates a new holiday
 *
 * Request Body:
 * - fecha: Date string (required)
 *
 * Response 201:
 * - Created Feriado object
 *
 * Response 400:
 * - Validation error
 *
 * Response 401:
 * - Unauthorized (not logged in)
 *
 * Response 403:
 * - Forbidden (not admin)
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify admin access
  const authCheck = await verifyAdmin(request.headers);
  if (!authCheck.authorized) {
    const status = authCheck.message === "Debes iniciar sesión" ? 401 : 403;
    return NextResponse.json({ error: authCheck.message }, { status });
  }

  try {
    const body = await request.json();
    const parsed = createFeriadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Normalize fecha to YYYY-MM-DD
    const normalizedFecha = normalizeToDate(parsed.data.fecha);

    const feriado = await prisma.feriado.create({
      data: {
        ...parsed.data,
        fecha: normalizedFecha, // Keep as string
      },
    });

    const response: FeriadoApiResponse = {
      id: feriado.id,
      fecha: normalizeToDate(feriado.fecha), // Use normalizeToDate for output
      todo_dia: feriado.todo_dia,
      hora_inicio: feriado.hora_inicio,
      hora_fin: feriado.hora_fin,
      createdAt: feriado.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create feriado:", error);

    // Check for Prisma P2002 unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un feriado para esta fecha", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feriados
 * Updates an existing holiday
 *
 * Query Parameters:
 * - id: UUID of the holiday to update
 *
 * Request Body:
 * - fecha: Date string (optional)
 * - todo_dia: boolean (optional)
 * - hora_inicio: string (optional)
 * - hora_fin: string (optional)
 *
 * Response 200:
 * - Updated Feriado object
 *
 * Response 400:
 * - Validation error
 *
 * Response 401:
 * - Unauthorized (not logged in)
 *
 * Response 403:
 * - Forbidden (not admin)
 *
 * Response 404:
 * - Holiday not found
 *
 * Response 409:
 * - Duplicate holiday for this date
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  // Verify admin access
  const authCheck = await verifyAdmin(request.headers);
  if (!authCheck.authorized) {
    const status = authCheck.message === "Debes iniciar sesión" ? 401 : 403;
    return NextResponse.json({ error: authCheck.message }, { status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID parameter is required" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateFeriadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if holiday exists
    const existing = await prisma.feriado.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    // Normalize fecha if provided (keep as string)
    const updateData: { fecha?: string; todo_dia?: boolean; hora_inicio?: string | null; hora_fin?: string | null } = {
      ...parsed.data,
    };

    if (parsed.data.fecha) {
      const normalizedFecha = normalizeToDate(parsed.data.fecha);
      updateData.fecha = normalizedFecha; // Keep as string
    }

    const feriado = await prisma.feriado.update({
      where: { id },
      data: updateData,
    });

    const response: FeriadoApiResponse = {
      id: feriado.id,
      fecha: normalizeToDate(feriado.fecha),
      todo_dia: feriado.todo_dia,
      hora_inicio: feriado.hora_inicio,
      hora_fin: feriado.hora_fin,
      createdAt: feriado.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update feriado:", error);

    // Check for Prisma P2002 unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un feriado para esta fecha", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feriados
 * Deletes a holiday by ID
 *
 * Query Parameters:
 * - id: UUID of the holiday to delete
 *
 * Response 200:
 * - Success message
 *
 * Response 400:
 * - Invalid ID format
 *
 * Response 401:
 * - Unauthorized (not logged in)
 *
 * Response 403:
 * - Forbidden (not admin)
 *
 * Response 404:
 * - Holiday not found
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  // Verify admin access
  const authCheck = await verifyAdmin(request.headers);
  if (!authCheck.authorized) {
    const status = authCheck.message === "Debes iniciar sesión" ? 401 : 403;
    return NextResponse.json({ error: authCheck.message }, { status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID parameter is required" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    // Check if holiday exists
    const existing = await prisma.feriado.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    await prisma.feriado.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Failed to delete feriado:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
