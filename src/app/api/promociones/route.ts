import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/promociones
 * Returns all active promotions
 *
 * Response 200:
 * - Array of Promocion objects
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(): Promise<NextResponse> {
  try {
    const promociones = await prisma.promocion.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ promociones })
  } catch (error) {
    console.error('Failed to fetch promociones:', error)

    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again later.' },
      { status: 500 }
    )
  }
}