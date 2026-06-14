/**
 * RoutineAdminPage — page object for /admin/rutinas, /admin/rutinas/new, /admin/rutinas/[id].
 *
 * Encapsulates the rutina CRUD form interactions:
 *   - goto():       navigate to /admin/rutinas (list)
 *   - gotoNew():    navigate to /admin/rutinas/new (create form, ssr: false)
 *   - gotoEdit(id): navigate to /admin/rutinas/[id] (edit form)
 *   - fillNombre() / fillDescripcion(): text fields
 *   - selectTipo():  select the rutina type
 *   - submitCreate(): click the create button + wait for success
 *   - expectCreated(): assert the new rutina is in the list
 *   - deleteByName(): click delete on a list item by name + confirm
 *   - expectInList(): assert a rutina is in the visible list
 *
 * Per design §5.3 (RoutineAdminPage):
 *   - nombreInput       → getByLabel('Nombre') OR data-testid='rutina-nombre-input'
 *   - submitCreateButton → data-testid='rutina-create-button'
 *   - listItem(nombre)  → [data-testid="rutina-list-item"]:has-text(nombre)
 *
 * Per Decision 4 (selector priority): role/label first, data-testid fallback.
 * The form labels exist (Nombre, Descripción); date pickers and dynamic
 * list rows are the only places where data-testid is necessary.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export type RutinaTipo = 'Fuerza' | 'Hipertrofia' | 'Resistencia' | 'Movilidad';

export class RoutineAdminPage extends BasePage {
  readonly listHeading: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    super(page);
    this.listHeading = page.getByRole('heading', { name: /Rutinas/i }).first();
    // "Nueva Rutina" link / button on the list page
    this.addButton = page.getByRole('link', { name: /Nueva Rutina/i }).first();
  }

  /** Navigate to the /admin/rutinas list. */
  async goto(): Promise<void> {
    await this.page.goto('/admin/rutinas');
    // Wait for the list heading OR the empty state — at least one will render
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to the new-rutina form. The form is dynamically imported
   * (ssr: false per design R6) so we wait for an input to appear as the
   * hydration sentinel.
   */
  async gotoNew(): Promise<void> {
    await this.page.goto('/admin/rutinas/new');
    // The form's first input (Nombre) is the hydration sentinel
    await this.page.waitForSelector('input[name="nombre"], [data-testid="rutina-nombre-input"]', {
      timeout: 15_000,
    });
  }

  /** Navigate to the edit page for a given rutina ID. */
  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/admin/rutinas/${id}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the list page is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.listHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Fill the Nombre field (label-first; data-testid fallback for resilience). */
  async fillNombre(value: string): Promise<void> {
    const byLabel = this.page.getByLabel('Nombre');
    if (await byLabel.count() > 0) {
      await byLabel.fill(value);
      return;
    }
    await this.page.getByTestId('rutina-nombre-input').fill(value);
  }

  /** Fill the Descripción field. */
  async fillDescripcion(value: string): Promise<void> {
    const byLabel = this.page.getByLabel('Descripción');
    if (await byLabel.count() > 0) {
      await byLabel.fill(value);
      return;
    }
    await this.page.getByTestId('rutina-descripcion-input').fill(value);
  }

  /** Select the rutina type (Fuerza, Hipertrofia, etc.). */
  async selectTipo(value: RutinaTipo): Promise<void> {
    // The type field is rendered as a <select> in RutinaCompletaForm
    const select = this.page.locator('select[name="tipo"], [data-testid="rutina-tipo-select"]');
    await select.selectOption(value);
  }

  /** Click the create button. The form submits via server action. */
  async submitCreate(): Promise<void> {
    // Try data-testid first (T1.1), fall back to the button text
    const byTestId = this.page.getByTestId('rutina-create-button');
    if (await byTestId.count() > 0) {
      await byTestId.click();
    } else {
      await this.page.getByRole('button', { name: /Crear rutina/i }).first().click();
    }
  }

  /** Assert the new rutina appears in the visible list. */
  async expectCreated(nombre: string): Promise<void> {
    const listItem = this.listItem(nombre);
    await expect(listItem).toBeVisible({ timeout: 10_000 });
  }

  /** Click delete on a list item by nombre, confirm any dialog. */
  async deleteByName(nombre: string): Promise<void> {
    const item = this.listItem(nombre);
    // Accept the confirm dialog if present
    this.page.once('dialog', (d) => d.accept());
    // Look for a delete button inside the item (kebab/three-dots menu pattern)
    const deleteButton = item.getByRole('button', { name: /Eliminar|Borrar/i }).first();
    await deleteButton.click();
  }

  /** Assert a rutina is visible in the list. */
  async expectInList(nombre: string): Promise<void> {
    await expect(this.listItem(nombre)).toBeVisible({ timeout: 10_000 });
  }

  /** Build the locator for a list item by nombre. */
  private listItem(nombre: string): Locator {
    return this.page.locator(
      `[data-testid="rutina-list-item"]:has-text("${nombre}"), tr:has-text("${nombre}"), li:has-text("${nombre}")`
    ).first();
  }
}
