import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Gym singleton response
 */
interface GymResponse {
  id: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Schema for updating gym price
 */
const gymUpdateSchema = z.object({
  price: z.number().positive({ message: "El precio debe ser un número positivo" }),
});

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(
  headers: Headers
): Promise<{ authorized: boolean; message?: string }> {
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
 * GET /api/gym
 * Returns the singleton gym configuration
 *
 * Response 200:
 * - Gym object with id, price, createdAt, updatedAt
 *
 * Response 404:
 * - Gym configuration not found
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(): Promise<NextResponse> {
  try {
    let gym = await prisma.gym.findUnique({
      where: { id: "gym" },
    });

    // Auto-create gym if it doesn't exist
    if (!gym) {
      gym = await prisma.gym.create({
        data: { id: "gym", price: 45000 },
      });
    }

    // Convert Decimal to number for JSON response
    const response: GymResponse = {
      id: gym.id,
      price: Number(gym.price),
      createdAt: gym.createdAt.toISOString(),
      updatedAt: gym.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch gym config:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gym
 * Updates the singleton gym configuration (admin only)
 *
 * Request Body:
 * - price: number (required, positive)
 *
 * Response 200:
 * - Updated Gym object
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
 * - Gym configuration not found
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

  try {
    const body = await request.json();
    const parsed = gymUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if gym exists
    const existing = await prisma.gym.findUnique({
      where: { id: "gym" },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuración del gym no encontrada" },
        { status: 404 }
      );
    }

    const gym = await prisma.gym.update({
      where: { id: "gym" },
      data: { price: parsed.data.price },
    });

    // Revalidate pages that display gym price
    revalidatePath("/informacion");
    revalidatePath("/api/gym");

    const response: GymResponse = {
      id: gym.id,
      price: Number(gym.price),
      createdAt: gym.createdAt.toISOString(),
      updatedAt: gym.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update gym config:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
