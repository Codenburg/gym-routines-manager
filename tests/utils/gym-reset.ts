/**
 * Test-only utility: reset the Gym singleton's `nombre` field to `null`.
 *
 * Why this exists:
 * The `e2e-coverage-critical-flows` T3.4 task is the 5.2.3 isolation
 * fix. 5.1.1 and 5.2.1 mutate `gym.nombre` to TEST_ values; 5.2.3
 * asserts the fallback chain terminates at the env var or "Gimnasio"
 * (which requires `gym.nombre` to be NULL).
 *
 * The admin form's `updateGymField` server action AND the `/api/gym`
 * PATCH endpoint both validate `nombre` as a non-empty string — so
 * neither can clear the field to `null`. The only way to reset is
 * direct DB access. This utility uses Prisma to do that.
 *
 * The deviation from project convention (tests normally don't touch
 * Prisma directly) is intentional and scoped: this is the smallest
 * possible change to fix a real test-isolation bug. It's marked
 * test-only by its location in `tests/utils/`.
 *
 * The `setGymPrice` function is a similar Prisma direct-access
 * escape hatch for the `descuento-precio-final` E2E scenario,
 * which needs a deterministic `gym.price` to assert the
 * computed final price. It is NOT a test-isolation bug fix but
 * follows the same singleton pattern.
 *
 * The prisma client is a singleton (reused across calls) and is
 * disconnected on `closeGymReset()` for graceful teardown.
 */

import { PrismaClient } from '../../generated/client';

let prismaSingleton: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient();
  }
  return prismaSingleton;
}

/**
 * Reset `gym.nombre` to `null`. Best-effort — never throws. The Gym
 * singleton is the row with `id: 'gym'`.
 */
export async function resetGymNombre(): Promise<void> {
  try {
    const prisma = getPrisma();
    await prisma.gym.update({
      where: { id: 'gym' },
      data: { nombre: null },
    });
  } catch (error) {
    // Best-effort. If the DB is unreachable, the test continues —
    // the 5.2.3 isolation issue is a soft signal, not a hard fail.
      
    console.warn('[gym-reset] Failed to reset gym.nombre:', error);
  }
}

/**
 * Set `gym.price` to a known value. Best-effort — never throws.
 * Used by the `descuento-precio-final` E2E scenario to assert the
 * computed final price deterministically. Callers should record the
 * previous price and restore it in `afterEach` if the existing price
 * is part of other tests' contract.
 *
 * @param price - The new `Gym.price` (clamped to a non-negative
 *   integer by the DB schema's `Decimal(10, 2)` column).
 */
export async function setGymPrice(price: number): Promise<void> {
  try {
    const prisma = getPrisma();
    await prisma.gym.update({
      where: { id: 'gym' },
      data: { price },
    });
  } catch (error) {
    console.warn('[gym-reset] Failed to set gym.price:', error);
  }
}

/**
 * Disconnect the singleton prisma client. Call from
 * `test.afterAll` if the test file uses `resetGymNombre` to avoid
 * open-connection warnings.
 */
export async function closeGymReset(): Promise<void> {
  if (prismaSingleton) {
    try {
      await prismaSingleton.$disconnect();
    } catch {
      // Ignore.
    }
    prismaSingleton = null;
  }
}
