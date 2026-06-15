/**
 * Default payload for trainer E2E tests.
 *
 * The `TEST_` prefix on `name` and `username` (which is the DNI) is the
 * discriminator used by cleanup helpers (design §5.4, §6.4). `RUN_ID` is
 * a per-test-run timestamp + random suffix so successive runs don't
 * collide and so concurrent test runs in the same suite get distinct
 * trainers.
 *
 * The DNI is generated as `TEST_<8 random digits>` to avoid colliding
 * with seeded users (the seeded admin has DNI `11111111`).
 *
 * Password is a fixed known string ("TestPass123") so S3.T.3 can log
 * back in as the soft-deleted trainer with the same creds.
 */

import { TEST_DATA_PREFIX } from '../helpers';

export const RUN_ID = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export interface TrainerFixture {
  name: string;
  /** DNI — also used as the username for the trainer's login. */
  dni: string;
  password: string;
}

/** Fresh fixture per test (unique DNI to avoid collisions). */
export function createTrainerFixture(overrides: Partial<TrainerFixture> = {}): TrainerFixture {
  // 8-digit DNI starting with 9 (high range, won't collide with seeded
  // values or with realistic Argentine DNI prefixes).
  const dni = `${TEST_DATA_PREFIX}9${Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, '0')}`;
  return {
    name: `${TEST_DATA_PREFIX}Trainer_${RUN_ID}`,
    dni,
    password: 'TestPass123',
    ...overrides,
  };
}
