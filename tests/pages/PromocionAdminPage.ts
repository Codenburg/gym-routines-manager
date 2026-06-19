/**
 * PromocionAdminPage — page object for /admin/promociones.
 *
 * Encapsulates the promocion CRUD form interactions:
 *   - goto():           navigate to /admin/promociones
 *   - fillTitulo():     fill the titulo input
 *   - fillDescripcion(): fill the descripcion input
 *   - fillPrecio():     fill the precio input (number)
 *   - submitCreate():   click the submit button
 *   - editByTitulo():   click edit on a list item
 *   - expectInList():   assert a promocion is visible
 *   - deleteByTitulo(): click delete on a list item
 *   - expectNotInList(): assert a promocion is no longer visible
 *
 * Per design §5.3 (PromocionAdminPage) and Decision 8 (data-testid list):
 *   - tituloInput       → data-testid='promocion-titulo-input'
 *   - descripcionInput  → data-testid='promocion-descripcion-input'
 *   - precioInput       → data-testid='promocion-precio-input'
 *   - submitButton      → data-testid='promocion-submit-button'
 *   - listItem(titulo)  → [data-testid="promocion-list-item"]:has-text(titulo)
 *
 * Per design §6.3 test scenarios:
 *   S2.P.1 create via form       S2.P.2 edit + persist
 *   S2.P.3 delete via UI
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { clickConfirmDelete } from '../helpers';

export class PromocionAdminPage extends BasePage {
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly tituloInput: Locator;
  readonly descripcionInput: Locator;
  readonly precioInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /Promociones/i }).first();
    this.addButton = page.getByTestId('promocion-add-button');
    this.tituloInput = page.getByTestId('promocion-titulo-input');
    this.descripcionInput = page.getByTestId('promocion-descripcion-input');
    this.precioInput = page.getByTestId('promocion-precio-input');
    this.submitButton = page.getByTestId('promocion-submit-button');
  }

  /** Navigate to /admin/promociones. */
  async goto(): Promise<void> {
    await this.page.goto('/admin/promociones');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the promocion admin page is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Fill the titulo input. */
  async fillTitulo(value: string): Promise<void> {
    await this.tituloInput.fill(value);
  }

  /** Fill the descripcion input. */
  async fillDescripcion(value: string): Promise<void> {
    await this.descripcionInput.fill(value);
  }

  /** Fill the precio input. Clears existing content first. */
  async fillPrecio(value: number): Promise<void> {
    await this.precioInput.fill(String(value));
  }

  /** Click the submit button to create the promocion. */
  async submitCreate(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click the edit-mode submit button to save changes to an existing promocion.
   *
   * Distinct from `submitCreate()` because the form's edit-mode button
   * exposes a different testid (`promocion-submit-edit-button`) and a
   * different label ("Guardar cambios"). Tests should assert the button
   * text BEFORE calling this method to surface "form is in the wrong
   * mode at click time" failures explicitly.
   */
  async submitEdit(): Promise<void> {
    const editSubmitButton = this.page.getByTestId('promocion-submit-edit-button');
    await editSubmitButton.click();
  }

  /** Click edit on a list item by titulo. */
  async editByTitulo(titulo: string): Promise<void> {
    const item = this.listItem(titulo);
    const editButton = item.getByTestId('promocion-edit-button');
    await editButton.click();
  }

  /** Assert a promocion is visible in the list. */
  async expectInList(titulo: string): Promise<void> {
    await expect(this.listItem(titulo)).toBeVisible({ timeout: 10_000 });
  }

  /** Click delete on a list item by titulo, confirm the AlertDialog. */
  async deleteByTitulo(titulo: string): Promise<void> {
    const item = this.listItem(titulo);
    const deleteButton = item.getByTestId('promocion-delete-button');
    await deleteButton.click();
    await clickConfirmDelete(this.page);
  }

  /** Assert a promocion is no longer visible in the list. */
  async expectNotInList(titulo: string): Promise<void> {
    await expect(this.listItem(titulo)).toHaveCount(0, { timeout: 10_000 });
  }

  /** Build the locator for a list item by titulo. */
  private listItem(titulo: string): Locator {
    return this.page.locator(
      `[data-testid="promocion-list-item"]:has-text("${titulo}")`
    ).first();
  }
}
