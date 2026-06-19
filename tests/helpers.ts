/**
 * E2E test helpers — consolidated from 6 inline `loginAsAdmin` copies.
 *
 * Why this module exists (GGA-FOLLOWUP-4 mitigation):
 * The previous pattern was 6 inline `async function loginAsAdmin(page)`
 * definitions across the spec files, each with subtle variations. The
 * `tests/security-helpers.ts:35` variant used the WRONG credentials
 * (`12345678/admin123` — does not match the seed) and was never imported
 * because it would have failed every call. The GGA-FOLLOWUP-4 hydration
 * race was also only mitigated in `gym-config.spec.ts:97-111` (with the
 * `Panel de Administraci` heading wait), leaving the other 5 specs
 * vulnerable. This module is the single source of truth.
 *
 * Selector strategy (Playwright skill §"Selector Priority"):
 *   1. getByRole / getByLabel (accessible-name)
 *   2. getByText (static content)
 *   3. getByPlaceholder (last resort for accessible-name-less inputs)
 *   4. getByTestId (data-testid, only when nothing stable exists)
 *
 * The login form (`src/app/(auth)/admin/login/page.tsx`) has a clear
 * `<label htmlFor="dni">DNI</label>` and `<label htmlFor="password">Contraseña</label>`,
 * so getByLabel is the natural fit. The submit button is `getByRole`.
 */

import { expect, type Page, type Locator, type Response } from '@playwright/test';
import { setExpiredCookie as setExpiredCookieFromSecurity } from './utils/security-helpers';
import { resetGymNombre } from './utils/gym-reset';

// ============================================
// Constants
// ============================================

/** Seeded admin credentials (see prisma/seed.ts) */
export const ADMIN_DNI = '11111111';
export const ADMIN_PASSWORD = 'nando123';

/** Discriminator prefix for records created by tests. */
export const TEST_DATA_PREFIX = 'TEST_';

// ============================================
// Auth — loginAsAdmin (replaces 6 inline copies)
// ============================================

/**
 * Logs in as the seeded admin (DNI: 11111111, password: nando123).
 *
 * Replaces the 6 inline copies in:
 *   - tests/gym-config.spec.ts
 *   - tests/admin-e2e.spec.ts
 *   - tests/promocion-e2e.spec.ts
 *   - tests/security-admin.spec.ts
 *   - tests/dnd-rutina.spec.ts
 *   - tests/cache-invalidation.spec.ts
 *
 * IMPORTANT: This MUST replicate the rich pattern from gym-config.spec.ts:97-111
 * (15s timeout for the `Panel de Administraci` heading). This is the
 * GGA-FOLLOWUP-4 mitigation: the admin layout has a hydration race where
 * a subsequent `/admin/*` navigation can land on a partially-rendered
 * sidebar. The heading wait is the sentinel for full hydration.
 *
 * Selector strategy: getByLabel (DNI + Contraseña) per Playwright skill.
 * The login form has accessible `<label>` elements that match these names.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login');

  // Wait for the form to be ready (matches gym-config.spec.ts:99)
  await page.waitForSelector('input[id="dni"]', { timeout: 15_000 });

  // Fill credentials using accessible labels (Playwright skill priority)
  await page.getByLabel('DNI').fill(ADMIN_DNI);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to /admin (gym-config uses 30s, others use 10-20s;
  // we pick 30s as the upper bound to keep tests stable across environments)
  await page.waitForURL('/admin', { timeout: 30_000 });

  // Hydration guard: wait for the admin layout sidebar to render.
  // The dashboard h1 is "Panel de Administración" (capital A and Ó).
  // We match a case-insensitive regex to be lenient.
  await expect(page.getByRole('heading', { name: /Panel de Administr/i })).toBeVisible({
    timeout: 15_000,
  });
}

// ============================================
// Data cleanup — cleanTestData
// ============================================

/**
 * Deletes every record across the admin REST APIs whose discriminator
 * field (titulo/nombre/dni) starts with `TEST_`. Use this in `afterEach`
 * of every spec that creates test data, to keep tests hermetic
 * (GGA-FOLLOWUP-2 / 5.2.3 isolation).
 *
 * Current coverage:
 *   - /api/feriados        — GET returns array, DELETE works via ?id=
 *   - /api/promociones     — GET returns {promociones: []}; no DELETE route,
 *                            records left behind (cleanup is a no-op)
 *   - /api/descuentos-duracion — GET returns {descuentos: []}; no DELETE route
 *   - /api/rutinas         — GET returns {rutinas: []}; no DELETE route
 *   - /api/trainers        — GET returns groupBy result (no test-data shape);
 *                            not cleaned here
 *
 * Specs that need deletion of records the REST API can't handle should
 * delete via the in-app form (the form server action is the canonical
 * delete path) or call `prisma.<model>.deleteMany({ where: { ... } })`
 * from a test-only script. This is the same contract as the existing
 * `cleanupTestPromociones` in `promocion-e2e.spec.ts:41-50`.
 */
export async function cleanTestData(page: Page): Promise<void> {
  await cleanTestFeriados(page);
  // Otros recursos: el endpoint REST no tiene DELETE. Las specs
  // deben limpiar via formulario o via script directo a Prisma.
}

/** Helper: deletes all /api/feriados whose fecha (used as discriminator) starts with TEST_ */
async function cleanTestFeriados(page: Page): Promise<void> {
  try {
    const response = await page.request.get('/api/feriados');
    if (!response.ok()) return;
    const data = (await response.json()) as {
      feriados?: Array<{ id: string; fecha?: string; motivo?: string }>;
    };
    const records = data.feriados ?? [];
    for (const record of records) {
      // Feriados have fecha but we use motivo/descripcion as a fallback
      // discriminator if present. Most tests won't set these.
      const discriminator = record.fecha ?? record.motivo ?? '';
      if (discriminator.startsWith(TEST_DATA_PREFIX)) {
        await page.request.delete(`/api/feriados?id=${record.id}`);
      }
    }
  } catch {
    // Cleanup is best-effort; never fail the test on cleanup.
  }
}

// ============================================
// UI helpers — toasts and server actions
// ============================================

/**
 * Waits for a sonner toast to appear with the given message (substring
 * match). Returns the toast locator so callers can assert visibility or
 * wait for dismissal.
 *
 * Sonner renders toasts in a `<section aria-label="Notifications" />`
 * region. The toast itself is a `[data-sonner-toast]` element.
 */
export function waitForToast(page: Page, message: string | RegExp): Promise<Locator> {
  const toast = page.locator('[data-sonner-toast]', { hasText: message }).first();
  return toast.waitFor({ state: 'visible', timeout: 10_000 }).then(() => Promise.resolve(toast));
}

/**
 * Waits for a server action POST response to complete. Matches the
 * `useActionState` pattern: `response.url().includes(actionPath) &&
 * response.status() === 200`. Returns the response.
 */
export async function waitForServerAction(
  page: Page,
  actionPath: string,
  options: { timeout?: number; status?: number } = {}
): Promise<Response> {
  const { timeout = 10_000, status = 200 } = options;
  return page.waitForResponse(
    (response) => response.url().includes(actionPath) && response.status() === status,
    { timeout }
  );
}

// ============================================
// Re-exports for convenience
// ============================================

/** Re-exported from `security-helpers.ts` so future specs (auth.spec.ts) can
 *  import session helpers from a single place. */
export const setExpiredCookie = setExpiredCookieFromSecurity;

// ============================================
// UI helpers — AlertDialog confirm
// ============================================

/**
 * Clicks the "Eliminar" button inside the React `AlertDialog` rendered
 * by the `useConfirm` hook (see `src/hooks/use-confirm.tsx`).
 *
 * Playwright's `page.once('dialog', ...)` only fires for NATIVE browser
 * dialogs (`alert`, `confirm`, `prompt`, `beforeunload`). It does NOT
 * fire for React-rendered modals/AlertDialogs, so page objects that
 * delete rows via the UI MUST call this helper AFTER clicking the row's
 * delete button.
 *
 * Relocated from `tests/promociones-descuentos.spec.ts:50-55` so page
 * objects (which can't import from spec files without a circular
 * dependency) can use it directly.
 */
export async function clickConfirmDelete(page: Page): Promise<void> {
  const confirmButton = page.getByRole('button', { name: /^Eliminar$/ });
  await expect(confirmButton).toBeVisible({ timeout: 10_000 });
  await confirmButton.click();
}

// ============================================
// Gym config reset (T3.4 — 5.2.3 isolation fix)
// ============================================

/**
 * Reset the Gym singleton's `nombre` field to `null` via direct
 * Prisma access. Used by `gym-config.spec.ts` afterEach to keep the
 * 5.2.3 fallback-chain test hermetic: 5.1.1/5.2.1 set the field to
 * TEST_ values, and 5.2.3 asserts the chain terminates at the env
 * var or "Gimnasio" (which requires `nombre` to be NULL).
 *
 * The admin form's `updateGymField` and the `/api/gym` PATCH both
 * validate `nombre` as non-empty, so neither can clear it. This is
 * the smallest possible change to fix the isolation bug. See
 * `tests/utils/gym-reset.ts` for the implementation + rationale.
 *
 * Best-effort: never throws. If the DB is unreachable, the test
 * continues (the 5.2.3 issue is a soft signal).
 */
export async function resetGymConfig(): Promise<void> {
  // Static import (see top of file). The previous dynamic import
  // (`await import('./utils/gym-reset')`) avoided loading the Prisma
  // client at import time, but Playwright's runtime doesn't transform
  // dynamic imports of .ts files, so every test in the file errored
  // with "Cannot use import statement outside a module" in afterEach.
  // Static import is safe: `gym-reset.ts` only instantiates PrismaClient
  // when `getPrisma()` is called (lazy singleton), so loading the module
  // doesn't open a DB connection.
  await resetGymNombre();
}
