/**
 * Default payload for feriado E2E tests.
 *
 * The `TEST_` prefix on `descripcion` (used as a fallback discriminator
 * by `helpers.cleanTestFeriados`) identifies records that can be
 * safely deleted during cleanup. `fecha` is always a future date
 * (30+ days from now) to avoid the past-date validation in S2.3.1.
 *
 * Note: the `/api/feriados` schema has NO `descripcion` field (only
 * fecha, todo_dia, hora_inicio, hora_fin). The cleanup contract uses
 * the `fecha` ISO date as the discriminator, but the existing
 * `cleanTestFeriados` in helpers.ts is currently a no-op (the API
 * returns a flat array, not `{feriados: []}`). Specs track IDs
 * manually and clean up in `afterEach` via `DELETE /api/feriados?id=`.
 */

import { TEST_DATA_PREFIX } from '../helpers';

export const RUN_ID = Date.now();

export interface FeriadoFixture {
  /** YYYY-MM-DD, always a future date (30+ days from now). */
  fecha: string;
  todo_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  /** Human-readable label for logs (not sent to the API). */
  label: string;
}

/** Returns a date `daysFromNow` days in the future, formatted YYYY-MM-DD. */
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/** Fresh fixture per test (unique fecha to avoid duplicate-date collisions). */
export function createFeriadoFixture(overrides: Partial<FeriadoFixture> = {}): FeriadoFixture {
  return {
    fecha: futureDate(30 + Math.floor(Math.random() * 60)),
    todo_dia: true,
    hora_inicio: null,
    hora_fin: null,
    label: `${TEST_DATA_PREFIX}Feriado_${RUN_ID}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  };
}

/** Helper: yesterday's date in YYYY-MM-DD (for the past-date test S2.3.1). */
export function yesterdayDate(): string {
  return futureDate(-1);
}
