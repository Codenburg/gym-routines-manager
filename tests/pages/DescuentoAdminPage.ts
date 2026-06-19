/**
 * DescuentoAdminPage — page object for /admin/descuentos-duracion.
 *
 * Encapsulates the descuento (duration discount) CRUD form interactions:
 *   - goto():              navigate to /admin/descuentos-duracion
 *   - fillPorcentaje():    fill the discount percentage (0-100)
 *   - fillMinMeses():      fill the minimum months for this discount
 *   - submitCreate():      click the submit button
 *   - expectInList():      assert a descuento is visible
 *   - deleteByPorcentaje(): click delete on a list item by percentage
 *   - expectValidationError(): assert a validation error for a given field
 *
 * Per design §5.3 (DescuentoAdminPage) and Decision 8 (data-testid list):
 *   - porcentajeInput     → data-testid='descuento-porcentaje-input'
 *   - minMesesInput       → data-testid='descuento-min-meses-input'
 *   - submitButton        → data-testid='descuento-submit-button'
 *   - listItem(porcentaje) → [data-testid="descuento-list-item"]:has-text(porcentaje)
 *
 * Per design §6.3 test scenarios:
 *   S2.D.1 create happy path
 *   S2.D.2 porcentaje > 100 → validation error
 *   S2.D.3 delete
 *
 * Note: `fillMaxMeses` was removed because the `DescuentoDuracion`
 * schema has a single `meses` field, not min/max. The dead
 * `maxMesesInput` locator + helper went with it. The
 * `expectValidationError` signature was narrowed to `porcentaje |
 * minMeses` accordingly.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { clickConfirmDelete } from '../helpers';

export class DescuentoAdminPage extends BasePage {
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly porcentajeInput: Locator;
  readonly minMesesInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /Descuentos/i }).first();
    this.addButton = page.getByTestId('descuento-add-button');
    this.porcentajeInput = page.getByTestId('descuento-porcentaje-input');
    this.minMesesInput = page.getByTestId('descuento-min-meses-input');
    this.submitButton = page.getByTestId('descuento-submit-button');
  }

  /** Navigate to /admin/descuentos-duracion. */
  async goto(): Promise<void> {
    await this.page.goto('/admin/descuentos-duracion');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the descuento admin page is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Fill the discount percentage (0-100). */
  async fillPorcentaje(value: number): Promise<void> {
    await this.porcentajeInput.fill(String(value));
  }

  /** Fill the minimum months for this discount tier. */
  async fillMinMeses(value: number): Promise<void> {
    await this.minMesesInput.fill(String(value));
  }

  /** Click the submit button to create the descuento. */
  async submitCreate(): Promise<void> {
    await this.submitButton.click();
  }

  /** Assert a descuento is visible in the list (matched by porcentaje text). */
  async expectInList(porcentaje: number): Promise<void> {
    await expect(this.listItem(String(porcentaje))).toBeVisible({ timeout: 10_000 });
  }

  /** Click delete on a list item by porcentaje, confirm the AlertDialog. */
  async deleteByPorcentaje(porcentaje: number): Promise<void> {
    const item = this.listItem(String(porcentaje));
    const deleteButton = item.getByTestId('descuento-delete-button');
    await deleteButton.click();
    await clickConfirmDelete(this.page);
  }

  /**
   * Assert a validation error is visible for a given field.
   * `field` is the field name (porcentaje or minMeses).
   */
  async expectValidationError(field: 'porcentaje' | 'minMeses'): Promise<void> {
    // Field-level errors typically render under the input. We use a
    // role/text match for the common zod error messages.
    const errorPattern = /inv[aá]lido|requerido|mayor|menor/i;
    const inputByField = {
      porcentaje: this.porcentajeInput,
      minMeses: this.minMesesInput,
    }[field];
    const errorMessage = this.page.locator(`[data-testid="descuento-${field}-error"]`);
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible({ timeout: 5_000 });
      await expect(errorMessage).toContainText(errorPattern);
    } else {
      // Fallback: look for any visible error message near the input
      const nearby = inputByField.locator('xpath=following-sibling::*[1]');
      await expect(nearby).toContainText(errorPattern, { timeout: 5_000 });
    }
  }

  /** Build the locator for a list item by porcentaje string. */
  private listItem(porcentaje: string): Locator {
    return this.page.locator(
      `[data-testid="descuento-list-item"]:has-text("${porcentaje}")`
    ).first();
  }
}
