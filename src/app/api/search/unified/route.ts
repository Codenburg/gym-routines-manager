import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  filterRoutinesByQuery,
  rankSearchResults,
  groupByTrainer,
} from "@/lib/search-utils";

const MAX_AUTOCOMPLETE_RESULTS = 5;

/**
 * GET /api/search/unified
 * Returns unified search results for autocomplete
 *
 * Query Parameters:
 * - q (required): Search query
 *
 * Response 200:
 * - rutinas: Array of routines matching the query (max 5)
 * - trainers: Array of unique trainers matching the query (max 5)
 * - message: Optional message when no results found
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  // Validate query
  if (!query.trim()) {
    return NextResponse.json({
      rutinas: [],
      trainers: [],
    });
  }

  try {
    // Fetch all routines (lightweight query for autocomplete)
    const rutinas = await prisma.rutina.findMany({
      select: {
        id: true,
        nombre: true,
        creador: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    // Filter by query
    const filteredRutinas = filterRoutinesByQuery(rutinas, query);

    // Rank results
    const rankedRutinas = rankSearchResults(filteredRutinas, query);

    // Get top results
    const topRutinas = rankedRutinas.slice(0, MAX_AUTOCOMPLETE_RESULTS);

    // Group by trainer
    const allTrainers = groupByTrainer(filteredRutinas);
    const topTrainers = allTrainers.slice(0, MAX_AUTOCOMPLETE_RESULTS);

    // Check if no results
    const hasResults = topRutinas.length > 0 || topTrainers.length > 0;

    return NextResponse.json({
      rutinas: topRutinas,
      trainers: topTrainers,
      ...(!hasResults && {
        message: `No se encontraron resultados para '${query}'. Prueba con términos más cortos o diferentes.`,
      }),
    });
  } catch (error) {
    console.error("Failed to fetch unified search results:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
