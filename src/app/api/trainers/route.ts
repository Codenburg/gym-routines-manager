import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/trainers
 * Returns a list of trainers with their routine counts
 *
 * Response 200:
 * - Array of { nombre: string, count: number } objects
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse> {
  try {
    // Get all unique creators with their routine counts using raw query
    const trainers = await prisma.$queryRaw<Array<{ creador: string; count: bigint }>>`
      SELECT creador, COUNT(*)::int as count
      FROM "Rutina"
      WHERE creador IS NOT NULL
      GROUP BY creador
      ORDER BY creador ASC
    `;

    // Transform to the expected format
    const response = trainers.map((t) => ({
      nombre: t.creador,
      count: Number(t.count),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch trainers:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
