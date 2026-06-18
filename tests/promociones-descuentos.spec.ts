/**
 * E2E tests for Promociones + Descuentos admin CRUD flows.
 *
 * Phase: PR 3 (Slice 2) of `e2e-coverage-critical-flows`.
 * Design: openspec/changes/e2e-coverage-critical-flows/design.md §6.3.
 *
 * Covered scenarios:
 *   S2.P.1 - create promocion via form (happy path)
 *   S2.P.2 - edit promocion, verify persistence
 *   S2.P.3 - delete promocion via UI
 *   S2.D.1 - create descuento (happy path)
 *   S2.D.2 - create descuento with porcentaje > 100 (validation error)
 *   S2.D.3 - delete descuento
 *   S2.D.4 - descuento list item shows computed final price (descuento-precio-final)
 *
 * The 15 new data-testid attributes (8 in promocion-{card,form,manager}
 * + 7 in descuento-duracion-manager) are the test contract — added
 * in T2.1, consumed here.
 *
 * Notes on the component behavior (read from source):
 *   - PromocionForm uses react-hook-form + zod. Submitting an invalid
 *     form shows inline field errors via aria-invalid + <p> with
 *     `text-xs text-destructive` class.
 *   - Descuento validation: "El porcentaje debe estar entre 0 y 100"
 *     is set via setError (inline error div at the top of the form).
 *   - Delete uses the React `useConfirm` hook → AlertDialog with
 *     "Eliminar" button (NOT a native `confirm()`).
 *   - `descuento-precio-final` is a NEW testid (descuento-precio-final
 *     change) added inside the list item. The literal `15%` stays
 *     adjacent to the number in a separate `<span>` so the existing
 *     `:has-text("15%")` selectors (lines 67, 267) keep matching.
 *
 * Cleanup: the /api/promociones and /api/descuentos-duracion REST
 * endpoints have NO DELETE route (per helpers.ts comment). The
 * component's delete goes through server actions. For tests that
 * don't delete their own record, we track IDs and delete via the UI
 * in afterEach (click delete + confirm dialog).
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';
import { PromocionAdminPage } from './pages/PromocionAdminPage';
import { DescuentoAdminPage } from './pages/DescuentoAdminPage';
import { createPromocionFixture } from './fixtures/promocion.fixture';
import { createDescuentoFixture } from './fixtures/descuento.fixture';
import { setGymPrice } from './utils/gym-reset';

test.setTimeout(120_000);

/** Clicks the "Eliminar" button in the React AlertDialog. */
async function clickConfirmDelete(page: Page): Promise<void> {
  const confirmButton = page.getByRole('button', { name: /^Eliminar$/ });
  await expect(confirmButton).toBeVisible({ timeout: 10_000 });
  await confirmButton.click();
}

/** Deletes a promocion list item by titulo via the UI. */
async function deletePromocionByTitulo(page: Page, titulo: string): Promise<void> {
  const item = page
    .locator('[data-testid="promocion-list-item"]')
    .filter({ hasText: titulo })
    .first();
  const deleteButton = item.getByTestId('promocion-delete-button');
  await deleteButton.click();
  await clickConfirmDelete(page);
  await expect(item).toHaveCount(0, { timeout: 15_000 });
}

/** Deletes a descuento list item by porcentaje string via the UI. */
async function deleteDescuentoByPorcentaje(page: Page, porcentaje: number): Promise<void> {
  const item = page
    .locator('[data-testid="descuento-list-item"]')
    .filter({ hasText: `${porcentaje}%` })
    .first();
  const deleteButton = item.getByTestId('descuento-delete-button');
  await deleteButton.click();
  await clickConfirmDelete(page);
  await expect(item).toHaveCount(0, { timeout: 15_000 });
}

test.describe('Promociones + Descuentos CRUD', () => {
  // Serial: state-mutating suite (design Decision 3). Fresh auth per test.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: undefined });

  // Promociones cleanup tracking — titulos created in any test.
  const createdPromocionTitulos: string[] = [];

  // Descuentos cleanup tracking — (meses, porcentaje) pairs. The
  // descuento API has no DELETE route, so we use the UI.
  const createdDescuentoKeys: Array<{ meses: number; porcentaje: number }> = [];

  test.afterEach(async ({ page }) => {
    // Clean up any promociones that weren't deleted by their own test.
    for (const titulo of createdPromocionTitulos.splice(0)) {
      try {
        const stillVisible = await page
          .locator('[data-testid="promocion-list-item"]')
          .filter({ hasText: titulo })
          .count();
        if (stillVisible > 0) {
          await deletePromocionByTitulo(page, titulo);
        }
      } catch {
        // Best-effort.
      }
    }
    // Clean up any descuentos that weren't deleted by their own test.
    for (const key of createdDescuentoKeys.splice(0)) {
      try {
        const stillVisible = await page
          .locator('[data-testid="descuento-list-item"]')
          .filter({ hasText: `${key.porcentaje}%` })
          .count();
        if (stillVisible > 0) {
          await deleteDescuentoByPorcentaje(page, key.porcentaje);
        }
      } catch {
        // Best-effort.
      }
    }
  });

  // ============================================
  // Promociones (3 tests)
  // ============================================

  test('S2.P.1 - create promocion via form', async ({ page }) => {
    await loginAsAdmin(page);
    const promoPage = new PromocionAdminPage(page);
    const fixture = createPromocionFixture();

    await promoPage.goto();
    await promoPage.expectVisible();

    await promoPage.fillTitulo(fixture.titulo);
    await promoPage.fillDescripcion(fixture.descripcion);
    await promoPage.fillPrecio(fixture.precio);
    await promoPage.submitCreate();

    // The new promocion appears in the list.
    await promoPage.expectInList(fixture.titulo);

    createdPromocionTitulos.push(fixture.titulo);
  });

  test('S2.P.2 - edit promocion and verify persistence', async ({ page }) => {
    await loginAsAdmin(page);
    const promoPage = new PromocionAdminPage(page);
    const fixture = createPromocionFixture();

    // Create via the UI.
    await promoPage.goto();
    await promoPage.expectVisible();
    await promoPage.fillTitulo(fixture.titulo);
    await promoPage.fillDescripcion(fixture.descripcion);
    await promoPage.fillPrecio(fixture.precio);
    await promoPage.submitCreate();
    await promoPage.expectInList(fixture.titulo);
    createdPromocionTitulos.push(fixture.titulo);

    // Click edit on the list item.
    await promoPage.editByTitulo(fixture.titulo);

    // The form should be in edit mode and pre-filled.
    const tituloInput = page.getByTestId('promocion-titulo-input');
    await expect(tituloInput).toHaveValue(fixture.titulo, { timeout: 10_000 });

    // Change the titulo.
    const newTitulo = `${fixture.titulo}_EDITED`;
    await tituloInput.fill(newTitulo);
    await promoPage.submitCreate();

    // The old titulo is gone; the new one is visible.
    await expect(
      page.locator('[data-testid="promocion-list-item"]').filter({ hasText: fixture.titulo })
    ).toHaveCount(0, { timeout: 15_000 });
    await promoPage.expectInList(newTitulo);

    // Update the cleanup tracker.
    const idx = createdPromocionTitulos.indexOf(fixture.titulo);
    if (idx >= 0) createdPromocionTitulos.splice(idx, 1);
    createdPromocionTitulos.push(newTitulo);
  });

  test('S2.P.3 - delete promocion via UI', async ({ page }) => {
    await loginAsAdmin(page);
    const promoPage = new PromocionAdminPage(page);
    const fixture = createPromocionFixture();

    // Create via the UI.
    await promoPage.goto();
    await promoPage.expectVisible();
    await promoPage.fillTitulo(fixture.titulo);
    await promoPage.fillDescripcion(fixture.descripcion);
    await promoPage.fillPrecio(fixture.precio);
    await promoPage.submitCreate();
    await promoPage.expectInList(fixture.titulo);

    // Delete via the UI.
    await promoPage.deleteByTitulo(fixture.titulo);
    await promoPage.expectNotInList(fixture.titulo);

    // No need to track for cleanup — the item is already gone.
  });

  // ============================================
  // Descuentos (3 tests)
  // ============================================

  test('S2.D.1 - create descuento (happy path)', async ({ page }) => {
    await loginAsAdmin(page);
    const descuentoPage = new DescuentoAdminPage(page);
    const fixture = createDescuentoFixture({ meses: 3, porcentaje: 15 });

    await descuentoPage.goto();
    await descuentoPage.expectVisible();

    await descuentoPage.fillPorcentaje(fixture.porcentaje);
    await descuentoPage.submitCreate();

    // The new descuento appears in the list. The list item shows the
    // meses label and the porcentaje with a "%" suffix.
    await descuentoPage.expectInList(fixture.porcentaje);

    createdDescuentoKeys.push({ meses: fixture.meses, porcentaje: fixture.porcentaje });
  });

  test('S2.D.2 - create descuento with porcentaje > 100 (validation error)', async ({ page }) => {
    await loginAsAdmin(page);
    const descuentoPage = new DescuentoAdminPage(page);

    await descuentoPage.goto();
    await descuentoPage.expectVisible();

    const listCountBefore = await page.locator('[data-testid="descuento-list-item"]').count();

    // The component validates "El porcentaje debe estar entre 0 y 100"
    // via setError (inline error div). The <input type="number" max="100">
    // HTML attribute does NOT block typing 150 — the React handler
    // catches it and calls setError.
    await descuentoPage.fillPorcentaje(150);
    await descuentoPage.submitCreate();

    // The component renders the error message in an inline div with
    // the destructive styling. We match by text since there's no
    // dedicated testid on the error div.
    const errorMessage = page.getByText(/El porcentaje debe estar entre 0 y 100/i);
    await expect(errorMessage).toBeVisible({ timeout: 10_000 });

    // No new descuento was created.
    await expect(page.locator('[data-testid="descuento-list-item"]')).toHaveCount(
      listCountBefore,
      { timeout: 5_000 }
    );
  });

  test('S2.D.3 - delete descuento', async ({ page }) => {
    await loginAsAdmin(page);
    const descuentoPage = new DescuentoAdminPage(page);
    const fixture = createDescuentoFixture({ meses: 6, porcentaje: 20 });

    // Create via the UI.
    await descuentoPage.goto();
    await descuentoPage.expectVisible();
    await descuentoPage.fillPorcentaje(fixture.porcentaje);
    await descuentoPage.submitCreate();
    await descuentoPage.expectInList(fixture.porcentaje);

    // Delete via the UI.
    await descuentoPage.deleteByPorcentaje(fixture.porcentaje);
    await expect(
      page.locator('[data-testid="descuento-list-item"]').filter({ hasText: `${fixture.porcentaje}%` })
    ).toHaveCount(0, { timeout: 15_000 });
  });

  test('S2.D.4 - descuento list item shows computed Precio final', async ({ page }) => {
    // Deterministic price anchor: 50000 ARS base, 15% off → 50000 * 0.85
    // = 42500 (after `Intl.NumberFormat` rounds the float noise).
    // We set the gym price BEFORE the test navigates so the admin
    // page picks it up on its initial RSC render.
    await setGymPrice(50000);

    await loginAsAdmin(page);
    const descuentoPage = new DescuentoAdminPage(page);
    const fixture = createDescuentoFixture({ meses: 3, porcentaje: 15 });

    await descuentoPage.goto();
    await descuentoPage.expectVisible();

    await descuentoPage.fillPorcentaje(fixture.porcentaje);
    await descuentoPage.submitCreate();
    await descuentoPage.expectInList(fixture.porcentaje);

    // The NEW testid MUST be visible inside the list item, with the
    // expected formatted ARS string. The expected value mirrors
    // `formatPriceARS(50000 * (1 - 15/100))`.
    const item = page
      .locator('[data-testid="descuento-list-item"]')
      .filter({ hasText: `${fixture.porcentaje}%` })
      .first();
    const precioFinal = item.getByTestId('descuento-precio-final');
    await expect(precioFinal).toBeVisible({ timeout: 10_000 });
    // es-AR currency: "$ 42.500" (whitespace may be NBSP — we match
    // the digits so the assertion is robust to ICU/Node variations).
    await expect(precioFinal).toContainText('42.500');
    await expect(precioFinal).toContainText('$');

    // Regression: the existing `:has-text("15%")` selector MUST
    // continue to match the parent list item (R1 in
    // openspec/changes/descuento-precio-final/tasks.md).
    await expect(item).toContainText('15%');

    createdDescuentoKeys.push({ meses: fixture.meses, porcentaje: fixture.porcentaje });
  });
});
