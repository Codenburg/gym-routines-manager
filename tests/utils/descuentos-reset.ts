/**
 * Test-only utility: reset the `DescuentoDuracion` table to the 4
 * seed values from `prisma/seed.ts`.
 *
 * Why this exists:
 * The `fix-e2e-promociones-descuentos` SDD change is the S2.D.1 + S2.D.4
 * isolation fix. Both tests create a new `DescuentoDuracion` row via the
 * admin form, which enforces `@@unique([gymId, meses])` at the DB level.
 * With the seed values `{3:10, 6:15, 9:17, 12:20}`, any test that creates
 * with one of these `meses` values collides with the seed and fails
 * silently (toast error, no list item).
 *
 * The admin form's `createDescuentoDuracion` server action validates
 * `meses` as an integer 1-12 (after the MESES_OPTIONS expansion), so
 * tests can use any `meses` not in the seed pool. The `randomMeses` flag
 * in `tests/fixtures/descuento.fixture.ts` picks from
 * `NON_SEED_MESES = [1, 2, 4, 5, 7, 8, 10, 11]`.
 *
 * The reset pattern mirrors `tests/utils/gym-reset.ts`: a singleton
 * Prisma client (reused across calls) disconnected on
 * `closeDescuentosReset()` for graceful teardown.
 *
 * Best-effort: never throws. If the DB is unreachable, the test
 * continues — the unique-constraint collision would surface as a
 * test failure with a clear Prisma error.
 */

import { PrismaClient } from '../../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let prismaSingleton: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaSingleton) {
    // Prisma 7 requires either an adapter or accelerateUrl.
    // Mirror the project's production pattern (`src/lib/prisma.ts`).
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prismaSingleton = new PrismaClient({ adapter });
  }
  return prismaSingleton;
}

/**
 * Seed values — MUST stay in sync with `prisma/seed.ts:121-126`.
 * Hardcoded here to keep the test reset independent of the seed
 * script (tests should not depend on `pnpm db:seed` having run).
 */
const SEED_DESCUENTOS = [
  { meses: 3, porcentaje: 10 },
  { meses: 6, porcentaje: 15 },
  { meses: 9, porcentaje: 17 },
  { meses: 12, porcentaje: 20 },
];

/**
 * Reset `DescuentoDuracion` to the 4 seed values via direct Prisma
 * access. Best-effort — never throws. The Gym singleton is the row
 * with `id: 'gym'` (see `prisma/schema.prisma:229-239`).
 */
export async function resetDescuentos(): Promise<void> {
  try {
    const prisma = getPrisma();
    // Prisma 7 requires explicit `where: {}` for deleteMany.
    await prisma.descuentoDuracion.deleteMany({ where: {} });
    for (const seed of SEED_DESCUENTOS) {
      await prisma.descuentoDuracion.create({
        data: { ...seed, gymId: 'gym' },
      });
    }
  } catch (error) {
    console.warn('[descuentos-reset] Failed to reset descuentos:', error);
  }
}

/**
 * Disconnect the singleton prisma client. Call from
 * `test.afterAll` if the test file uses `resetDescuentos` to avoid
 * open-connection warnings.
 */
export async function closeDescuentosReset(): Promise<void> {
  if (prismaSingleton) {
    try {
      await prismaSingleton.$disconnect();
    } catch {
      // Ignore.
    }
    prismaSingleton = null;
  }
}
