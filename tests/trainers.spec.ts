/**
 * E2E tests for the Trainer admin CRUD flow.
 *
 * Phase: PR 4 (Slice 3) of `e2e-coverage-critical-flows`.
 * Design: openspec/changes/e2e-coverage-critical-flows/design.md §6.4.
 *
 * Covered scenarios:
 *   S3.T.1 - create trainer end-to-end (with login-as-trainer verification)
 *   S3.T.2 - edit trainer name
 *   S3.T.3 - remove trainer membership
 *   S3.T.4 - reject duplicate DNI
 *
 * The 7 new data-testid attributes (3 in trainer-manager.tsx + 4 in
 * trainer-dialog.tsx) are the test contract — added in T3.1, consumed
 * here.
 *
 * Notes on the component behavior (read from source):
 *   - The create button is "Nuevo Entrenador" in the page header.
 *   - The form is in a base-ui Dialog (rendered via a portal), so the
 *     list items remain in the DOM but are visually behind the
 *     dialog. Locator-based lookups work either way.
 *   - On create success, the dialog closes via `onOpenChange(false)`
 *     and the new trainer is added to the list by `onSuccess`.
 *   - Delete uses the `useConfirm` React hook → AlertDialog with an
 *     "Eliminar" button (NOT a native `confirm()` — discovery #213).
 *     The page object uses `page.once('dialog')` which never fires;
 *     the spec clicks the AlertDialog button directly.
 *   - The `/api/trainers` REST endpoint has NO DELETE route
 *     (confirmed via `ls src/app/api/trainers/`). The only delete
 *     path is the server action via the UI. Cleanup uses the UI.
 *   - Delete removes the trainer Member row for the active organization.
 *     The admin layout's organization-scoped role check then redirects
 *     that user to `/` instead of allowing them in.
 *
 * Cleanup: the spec tracks created DNIs. In `afterEach`, each tracked
 * DNI is deleted via the UI (click trash → click "Eliminar" in the
 * AlertDialog). The `serial` mode flag is added at the spec level
 * (per the existing pattern from T1.1/T2.2/T2.3) — T3.4 only adds
 * the afterEach cleanup hook on top of this.
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin, waitForToast } from './helpers';
import { TrainerAdminPage } from './pages/TrainerAdminPage';
import { createTrainerFixture } from './fixtures/trainer.fixture';

test.setTimeout(120_000);

/**
 * Remove a trainer membership via the UI: click the trash button, then click
 * "Eliminar" in the React AlertDialog (NOT a native browser dialog).
 */
async function deleteTrainerByDni(page: Page, dni: string): Promise<void> {
  const item = page
    .locator('[data-testid="trainer-list-item"]')
    .filter({ hasText: dni })
    .first();
  // The trainer may have already been removed (e.g., a deletion test
  // in the same suite). In that case, this is a no-op.
  if ((await item.count()) === 0) return;
  const deleteButton = item.getByTestId('trainer-delete-button');
  await deleteButton.click();
  const confirmButton = page.getByRole('button', { name: /^Eliminar$/ });
  await expect(confirmButton).toBeVisible({ timeout: 10_000 });
  await confirmButton.click();
  await expect(item).toHaveCount(0, { timeout: 15_000 });
}

test.describe('Trainer CRUD', () => {
  // Serial: state-mutating suite (design Decision 3). Fresh auth per test.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: undefined });

  // Track created DNIs for afterEach cleanup. The /api/trainers REST
  // endpoint has no DELETE route, so we clean up via the UI.
  const createdDnis: string[] = [];

  test.afterEach(async ({ page }) => {
    // The test page is still logged in as admin (loginAsAdmin was called
    // at the start of each test). Navigate to the trainer admin page
    // and delete any tracked trainers.
    if (createdDnis.length === 0) return;
    try {
      await page.goto('/admin/trainers');
      await page
        .locator('[data-testid="trainer-list-item"]')
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 })
        .catch(() => {
          // List may be empty if all trainers were already deleted.
        });
      for (const dni of createdDnis.splice(0)) {
        await deleteTrainerByDni(page, dni);
      }
    } catch {
      // Cleanup is best-effort; never let it mask the real failure.
    }
  });

  test('S3.T.1 - create trainer end-to-end + login as trainer', async ({ page }) => {
    await loginAsAdmin(page);
    const trainerPage = new TrainerAdminPage(page);
    const fixture = createTrainerFixture();

    await trainerPage.goto();
    await trainerPage.expectVisible();

    // Open the create dialog and fill the form.
    await trainerPage.addButton.click();
    await expect(trainerPage.dniInput).toBeVisible({ timeout: 10_000 });
    await trainerPage.fillDni(fixture.dni);
    await trainerPage.fillName(fixture.name);
    await trainerPage.fillPassword(fixture.password);
    await trainerPage.submitCreate();

    // The dialog closes and the new trainer appears in the list. The
    // list item text is "@{username} • Creado el {date}" (where
    // username is the DNI), so we can match by the DNI being present.
    await expect(
      page
        .locator('[data-testid="trainer-list-item"]')
        .filter({ hasText: fixture.dni })
    ).toBeVisible({ timeout: 15_000 });
    createdDnis.push(fixture.dni);

    // Verify the new trainer can log in. Clear cookies, then attempt
    // to log in as the trainer (DNI + password). The trainer has an
    // active organization Member role that allows the admin layout →
    // the trainer lands on /admin.
    await page.context().clearCookies();
    await page.goto('/admin/login');
    await page.waitForSelector('input[id="dni"]', { timeout: 15_000 });
    await page.getByLabel('DNI').fill(fixture.dni);
    await page.getByLabel('Contraseña').fill(fixture.password);
    await page.click('button[type="submit"]');
    // The trainer Member role is allowed by the admin layout, so the trainer
    // lands on /admin (or its subroutes). Wait for the URL to leave
    // /admin/login and stabilize on the admin panel.
    await page.waitForURL((url) => !url.pathname.startsWith('/admin/login'), {
      timeout: 30_000,
    });
    // The admin layout is shown to the trainer (they can see
    // Rutinas, Feriados, Promociones, Descuentos — but not the
    // admin-only Configuración or Entrenadores).
    await expect(
      page.getByRole('heading', { name: /Panel de Administr/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('S3.T.2 - edit trainer name', async ({ page }) => {
    await loginAsAdmin(page);
    const trainerPage = new TrainerAdminPage(page);
    const fixture = createTrainerFixture();

    // Create via the UI (S3.T.1 already covers the API create path
    // implicitly, and the edit dialog opens the same form).
    await trainerPage.goto();
    await trainerPage.expectVisible();
    await trainerPage.addButton.click();
    await expect(trainerPage.dniInput).toBeVisible({ timeout: 10_000 });
    await trainerPage.fillDni(fixture.dni);
    await trainerPage.fillName(fixture.name);
    await trainerPage.fillPassword(fixture.password);
    await trainerPage.submitCreate();
    await expect(
      page
        .locator('[data-testid="trainer-list-item"]')
        .filter({ hasText: fixture.dni })
    ).toBeVisible({ timeout: 15_000 });
    createdDnis.push(fixture.dni);

    // Open the edit dialog by clicking the edit button (Pencil icon)
    // on the list item. The trainer-manager's edit button doesn't
    // have a dedicated testid; we use the title attribute as a
    // stable accessible name.
    const item = page
      .locator('[data-testid="trainer-list-item"]')
      .filter({ hasText: fixture.dni })
      .first();
    const editButton = item.getByRole('button', { name: 'Editar' });
    await expect(editButton).toBeVisible({ timeout: 10_000 });
    await editButton.click();

    // The edit dialog opens. The name input is pre-filled with the
    // current name. We change it to a new value and save.
    const editNameInput = page.getByTestId('trainer-name-input');
    await expect(editNameInput).toBeVisible({ timeout: 10_000 });
    await expect(editNameInput).toHaveValue(fixture.name);
    const updatedName = `${fixture.name}_EDITED`;
    await editNameInput.fill(updatedName);
    const submitButton = page.getByTestId('trainer-submit-button');
    await submitButton.click();

    // The dialog closes and the list reflects the new name.
    await expect(editNameInput).toHaveCount(0, { timeout: 15_000 });
    await expect(
      page
        .locator('[data-testid="trainer-list-item"]')
        .filter({ hasText: updatedName })
    ).toBeVisible({ timeout: 15_000 });
    // The old name is no longer in the list.
    await expect(
      page
        .locator('[data-testid="trainer-list-item"]')
        .filter({ hasText: fixture.name })
    ).toHaveCount(0, { timeout: 5_000 });
  });

  test('S3.T.3 - remove trainer membership + login redirects to /', async ({ page }) => {
    await loginAsAdmin(page);
    const trainerPage = new TrainerAdminPage(page);
    const fixture = createTrainerFixture();

    // Create the trainer.
    await trainerPage.goto();
    await trainerPage.expectVisible();
    await trainerPage.addButton.click();
    await expect(trainerPage.dniInput).toBeVisible({ timeout: 10_000 });
    await trainerPage.fillDni(fixture.dni);
    await trainerPage.fillName(fixture.name);
    await trainerPage.fillPassword(fixture.password);
    await trainerPage.submitCreate();
    await expect(
      page
        .locator('[data-testid="trainer-list-item"]')
        .filter({ hasText: fixture.dni })
    ).toBeVisible({ timeout: 15_000 });
    createdDnis.push(fixture.dni);

    // Remove via the UI: click the trash button, then click
    // "Eliminar" in the React AlertDialog.
    const item = page
      .locator('[data-testid="trainer-list-item"]')
      .filter({ hasText: fixture.dni })
      .first();
    const deleteButton = item.getByTestId('trainer-delete-button');
    await deleteButton.click();
    const confirmButton = page.getByRole('button', { name: /^Eliminar$/ });
    await expect(confirmButton).toBeVisible({ timeout: 10_000 });
    await confirmButton.click();

    // The trainer is removed from the active list.
    await expect(item).toHaveCount(0, { timeout: 15_000 });
    // No need to track for cleanup — the trainer membership has already
    // been removed. The afterEach UI cleanup is a no-op for this DNI
    // because the list item is gone.
    const idx = createdDnis.indexOf(fixture.dni);
    if (idx >= 0) createdDnis.splice(idx, 1);

    // Verify the removed trainer can no longer access the admin panel.
    // Log out (clear cookies), then try to log in as the trainer. The
    // login itself succeeds, but the admin layout's organization-scoped
    // role check fails and redirects to /.
    await page.context().clearCookies();
    await page.goto('/admin/login');
    await page.waitForSelector('input[id="dni"]', { timeout: 15_000 });
    await page.getByLabel('DNI').fill(fixture.dni);
    await page.getByLabel('Contraseña').fill(fixture.password);
    await page.click('button[type="submit"]');

    // The login page pushes to /admin; the admin layout then
    // redirects to /. Wait for the URL to settle on / (the home
    // page), not /admin.
    await page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 });
    // The home page renders (no login form, no admin layout).
    await expect(
      page.getByRole('heading', { name: /Panel de Administr/i })
    ).toHaveCount(0, { timeout: 5_000 });
  });

  test('S3.T.4 - reject duplicate DNI', async ({ page }) => {
    await loginAsAdmin(page);
    const trainerPage = new TrainerAdminPage(page);
    const fixture = createTrainerFixture();

    // Create the first trainer.
    await trainerPage.goto();
    await trainerPage.expectVisible();
    await trainerPage.addButton.click();
    await expect(trainerPage.dniInput).toBeVisible({ timeout: 10_000 });
    await trainerPage.fillDni(fixture.dni);
    await trainerPage.fillName(fixture.name);
    await trainerPage.fillPassword(fixture.password);
    await trainerPage.submitCreate();
    await expect(
      page
        .locator('[data-testid="trainer-list-item"]')
        .filter({ hasText: fixture.dni })
    ).toBeVisible({ timeout: 15_000 });
    createdDnis.push(fixture.dni);

    // Try to create a second trainer with the same DNI. The server
    // action returns `{ success: false, errors: { username: ['Este
    // DNI ya está registrado'] } }` and the dialog fires a sonner
    // toast with the error message (per trainer-dialog.tsx:84).
    await trainerPage.addButton.click();
    await expect(trainerPage.dniInput).toBeVisible({ timeout: 10_000 });
    await trainerPage.fillDni(fixture.dni);
    await trainerPage.fillName(`${fixture.name}_DUP`);
    await trainerPage.fillPassword(fixture.password);
    await trainerPage.submitCreate();

    // The duplicate-DNI error surfaces as a sonner toast.
    const toast = await waitForToast(page, /Este DNI ya está registrado/i);
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // The dialog stays open (the trainer-dialog does NOT close on
    // error — it returns early after toast.error). Close it manually
    // so the next test can run cleanly. Click the "Cancelar" button.
    const cancelButton = page.getByRole('button', { name: /Cancelar/i });
    await expect(cancelButton).toBeVisible({ timeout: 5_000 });
    await cancelButton.click();
  });
});
