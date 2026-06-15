/**
 * E2E tests for the Feriado admin CRUD flow.
 *
 * Phase: PR 3 (Slice 2) of `e2e-coverage-critical-flows`.
 * Design: openspec/changes/e2e-coverage-critical-flows/design.md §6.2.
 *
 * Covered scenarios:
 *   S2.1.1 - create feriado (full day)
 *   S2.2.1 - create feriado (partial hours)
 *   S2.3.1 - reject past date
 *   S2.4.1 - reject inverted hours
 *   S2.5.1 - delete feriado
 *   S2.6.1 - duplicate date (409)
 *
 * The 8 new data-testid attributes in feriado-manager.tsx are the
 * test contract — added in T2.1, consumed here.
 *
 * Notes on the component behavior (read from src/components/admin/feriado-manager.tsx):
 *   - Past-date validation shows a sonner TOAST ("No se pueden seleccionar
 *     fechas pasadas"), NOT the inline `feriado-error` div.
 *   - Inverted-hours validation shows a sonner TOAST ("La hora de inicio
 *     debe ser menor que la hora de fin"), NOT the inline error.
 *   - Duplicate-date (409) shows a sonner TOAST ("Ya existe un feriado
 *     para esta fecha"), NOT the inline error.
 *   - The list item text is `formatDate(fecha)` (e.g. "lunes, 15 de
 *     diciembre de 2026"), NOT the raw `YYYY-MM-DD` string.
 *   - Delete uses a React `AlertDialog` (not a native `confirm()`), so
 *     we click the "Eliminar" button in the dialog.
 *
 * Cleanup: the existing `cleanTestFeriados` in helpers.ts is a no-op
 * (the API returns a flat array, and the fecha is a date string, not
 * a TEST_-prefixed value). Each test tracks its created feriado IDs
 * and deletes them in `afterEach` via `DELETE /api/feriados?id=`.
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { loginAsAdmin, waitForToast } from './helpers';
import { FeriadoAdminPage } from './pages/FeriadoAdminPage';
import { createFeriadoFixture, yesterdayDate } from './fixtures/feriado.fixture';

test.setTimeout(120_000);

/** Deletes a feriado by ID via the admin API. Logs but never throws. */
async function deleteFeriadoById(request: APIRequestContext, id: string): Promise<void> {
  try {
    await request.delete(`/api/feriados?id=${id}`);
  } catch {
    // Cleanup is best-effort.
  }
}

/** Fills a `<input type="date">` via React-friendly keystrokes. */
async function fillDateInput(page: Page, testId: string, value: string): Promise<void> {
  const input = page.getByTestId(testId);
  await input.fill(value);
  // React-controlled inputs sometimes need a blur to commit the value.
  await input.blur();
}

test.describe('Feriado CRUD', () => {
  // Serial: state-mutating suite (design Decision 3). Fresh auth per test.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: undefined });

  // Track IDs created during each test for afterEach cleanup.
  const createdIds: string[] = [];

  test.afterEach(async ({ page }) => {
    // Delete all feriados created during this test (or previous tests in
    // the serial run, if cleanup was deferred).
    for (const id of createdIds.splice(0)) {
      await deleteFeriadoById(page.request, id);
    }
  });

  test('S2.1.1 - create feriado (full day)', async ({ page }) => {
    await loginAsAdmin(page);
    const feriadoPage = new FeriadoAdminPage(page);
    const fixture = createFeriadoFixture({ todo_dia: true, hora_inicio: null, hora_fin: null });

    await feriadoPage.goto();
    await feriadoPage.expectVisible();

    const listCountBefore = await page.locator('[data-testid="feriado-list-item"]').count();

    await fillDateInput(page, 'feriado-date-input', fixture.fecha);
    // todo_dia is checked by default — no need to toggle.
    await feriadoPage.submitCreate();

    // The new feriado appears in the list. The list item text is the
    // formatted date (e.g. "lunes, 15 de diciembre de 2026"), so we
    // assert by count and by year/month presence.
    await expect(page.locator('[data-testid="feriado-list-item"]')).toHaveCount(
      listCountBefore + 1,
      { timeout: 15_000 }
    );
    const newItem = page.locator('[data-testid="feriado-list-item"]').nth(listCountBefore);
    const [year, month] = fixture.fecha.split('-');
    await expect(newItem).toContainText(year);
    await expect(newItem).toContainText(getMonthNameEs(parseInt(month, 10)));

    // Track the created feriado for cleanup. We need the ID — fetch it
    // from the API (the list doesn't expose IDs).
    const list = await page.request.get('/api/feriados');
    const records = (await list.json()) as Array<{ id: string; fecha: string }>;
    const created = records.find((r) => r.fecha === fixture.fecha);
    if (created) createdIds.push(created.id);
  });

  test('S2.2.1 - create feriado (partial hours)', async ({ page }) => {
    await loginAsAdmin(page);
    const feriadoPage = new FeriadoAdminPage(page);
    const fixture = createFeriadoFixture({
      todo_dia: false,
      hora_inicio: '09:00',
      hora_fin: '18:00',
    });

    await feriadoPage.goto();
    await feriadoPage.expectVisible();

    await fillDateInput(page, 'feriado-date-input', fixture.fecha);
    await feriadoPage.toggleTodoDia(false);
    await feriadoPage.fillHoraInicio(fixture.hora_inicio!);
    await feriadoPage.fillHoraFin(fixture.hora_fin!);
    await feriadoPage.submitCreate();

    // The new list item should contain the hours "09:00 - 18:00" (the
    // partial-day badge format in the component).
    await expect(
      page.locator('[data-testid="feriado-list-item"]').filter({ hasText: '09:00 - 18:00' })
    ).toBeVisible({ timeout: 15_000 });

    // Track for cleanup.
    const list = await page.request.get('/api/feriados');
    const records = (await list.json()) as Array<{ id: string; fecha: string }>;
    const created = records.find((r) => r.fecha === fixture.fecha);
    if (created) createdIds.push(created.id);
  });

  test('S2.3.1 - reject past date', async ({ page }) => {
    await loginAsAdmin(page);
    const feriadoPage = new FeriadoAdminPage(page);

    await feriadoPage.goto();
    await feriadoPage.expectVisible();

    const listCountBefore = await page.locator('[data-testid="feriado-list-item"]').count();

    await fillDateInput(page, 'feriado-date-input', yesterdayDate());
    await feriadoPage.submitCreate();

    // The component shows a sonner toast for past-date validation.
    // Assert the toast appears with the expected message.
    const toast = await waitForToast(page, /No se pueden seleccionar fechas pasadas/i);
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // No new feriado was created.
    await expect(page.locator('[data-testid="feriado-list-item"]')).toHaveCount(
      listCountBefore,
      { timeout: 5_000 }
    );
  });

  test('S2.4.1 - reject inverted hours', async ({ page }) => {
    await loginAsAdmin(page);
    const feriadoPage = new FeriadoAdminPage(page);
    const fixture = createFeriadoFixture({ todo_dia: false });

    await feriadoPage.goto();
    await feriadoPage.expectVisible();

    const listCountBefore = await page.locator('[data-testid="feriado-list-item"]').count();

    await fillDateInput(page, 'feriado-date-input', fixture.fecha);
    await feriadoPage.toggleTodoDia(false);
    // Inverted: start > end.
    await feriadoPage.fillHoraInicio('18:00');
    await feriadoPage.fillHoraFin('09:00');
    await feriadoPage.submitCreate();

    // The component shows a sonner toast for inverted-hours validation.
    const toast = await waitForToast(page, /hora de inicio debe ser menor/i);
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // No new feriado was created.
    await expect(page.locator('[data-testid="feriado-list-item"]')).toHaveCount(
      listCountBefore,
      { timeout: 5_000 }
    );
  });

  test('S2.5.1 - delete feriado', async ({ page }) => {
    await loginAsAdmin(page);
    const feriadoPage = new FeriadoAdminPage(page);
    const fixture = createFeriadoFixture();

    // Create via API (faster; S2.1.1 already covers the UI create path).
    const createResponse = await page.request.post('/api/feriados', {
      data: {
        fecha: fixture.fecha,
        todo_dia: fixture.todo_dia,
        hora_inicio: fixture.hora_inicio,
        hora_fin: fixture.hora_fin,
      },
    });
    expect(createResponse.ok()).toBe(true);
    const createdBody = (await createResponse.json()) as { id: string; fecha: string };
    createdIds.push(createdBody.id);

    await feriadoPage.goto();
    await feriadoPage.expectVisible();

    // Find the list item for our feriado (by fecha year+month — the
    // list renders the formatted date, not the raw fecha).
    const [year, month] = fixture.fecha.split('-');
    const item = page
      .locator('[data-testid="feriado-list-item"]')
      .filter({ hasText: year })
      .filter({ hasText: getMonthNameEs(parseInt(month, 10)) });
    await expect(item).toBeVisible({ timeout: 15_000 });

    const deleteButton = item.getByTestId('feriado-delete-button');
    await deleteButton.click();

    // The useConfirm hook renders a React AlertDialog (NOT a native
    // confirm). Click the "Eliminar" button in the dialog footer.
    const confirmButton = page.getByRole('button', { name: /^Eliminar$/ });
    await expect(confirmButton).toBeVisible({ timeout: 10_000 });
    await confirmButton.click();

    // The item is removed from the list.
    await expect(item).toHaveCount(0, { timeout: 15_000 });

    // The ID is no longer in the API response.
    const list = await page.request.get('/api/feriados');
    const records = (await list.json()) as Array<{ id: string }>;
    expect(records.find((r) => r.id === createdBody.id)).toBeUndefined();

    // Remove from cleanup list since we already deleted it.
    const idx = createdIds.indexOf(createdBody.id);
    if (idx >= 0) createdIds.splice(idx, 1);
  });

  test('S2.6.1 - duplicate date (409)', async ({ page }) => {
    await loginAsAdmin(page);
    const feriadoPage = new FeriadoAdminPage(page);
    const fixture = createFeriadoFixture();

    // Create the first feriado via API.
    const first = await page.request.post('/api/feriados', {
      data: { fecha: fixture.fecha, todo_dia: true },
    });
    expect(first.ok()).toBe(true);
    const firstBody = (await first.json()) as { id: string };
    createdIds.push(firstBody.id);

    // Navigate to the admin page and try to create a second one with
    // the same fecha. The component's server action will return 409.
    await feriadoPage.goto();
    await feriadoPage.expectVisible();

    const listCountBefore = await page.locator('[data-testid="feriado-list-item"]').count();

    await fillDateInput(page, 'feriado-date-input', fixture.fecha);
    await feriadoPage.submitCreate();

    // The component shows a sonner toast for the 409 duplicate error.
    const toast = await waitForToast(page, /Ya existe un feriado para esta fecha/i);
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // No new item was added to the list.
    await expect(page.locator('[data-testid="feriado-list-item"]')).toHaveCount(
      listCountBefore,
      { timeout: 5_000 }
    );

    // Remove from cleanup — the first one still exists.
    const idx = createdIds.indexOf(firstBody.id);
    if (idx >= 0) createdIds.splice(idx, 1);
  });
});

/** Returns the Spanish month name for a 1-indexed month number. */
function getMonthNameEs(month: number): string {
  const names = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return names[month - 1] ?? '';
}
