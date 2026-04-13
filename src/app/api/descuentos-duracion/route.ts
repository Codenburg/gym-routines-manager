import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/descuentos-duracion
 * Returns all duration discounts
 *
 * Response 200:
 * - Array of DescuentoDuracion objects
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(): Promise<NextResponse> {
  try {
    const descuentos = await prisma.descuentoDuracion.findMany({
      orderBy: { meses: 'asc' },
    })

    return NextResponse.json({ descuentos })
  } catch (error) {
    console.error('Failed to fetch descuentos:', error)

    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again later.' },
      { status: 500 }
    )
  }
}