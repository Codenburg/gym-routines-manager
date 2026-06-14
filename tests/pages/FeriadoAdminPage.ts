/**
 * FeriadoAdminPage — page object for /admin/feriados.
 *
 * Encapsulates the feriado CRUD form interactions:
 *   - goto():           navigate to /admin/feriados
 *   - fillFecha():      fill the date input (YYYY-MM-DD)
 *   - toggleTodoDia():  check/uncheck the "todo el día" checkbox
 *   - fillHoraInicio() / fillHoraFin(): partial-day hours (HH:mm)
 *   - submitCreate():   click the submit button
 *   - expectCreated():  assert the new feriado is in the list
 *   - expectDuplicateError(): assert the 409 / duplicate-date error
 *   - deleteByFecha():  click delete on a list item by fecha
 *   - expectNotInList(): assert a feriado is no longer in the list
 *
 * Per design §5.3 (FeriadoAdminPage):
 *   - fechaInput        → data-testid='feriado-date-input' (no accessible name)
 *   - todoDiaCheckbox   → data-testid='feriado-todo-dia-checkbox'
 *   - listItem(fecha)   → [data-testid="feriado-list-item"]:has-text(fecha)
 *
 * Per design §6.2 test scenarios:
 *   S2.1.1 create (full day)   S2.2.1 create (partial hours)
 *   S2.3.1 reject past date    S2.4.1 reject inverted hours
 *   S2.5.1 delete              S2.6.1 duplicate date (409)
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class FeriadoAdminPage extends BasePage {
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly fechaInput: Locator;
  readonly todoDiaCheckbox: Locator;
  readonly horaInicioInput: Locator;
  readonly horaFinInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /Feriados/i }).first();
    this.addButton = page.getByTestId('feriado-add-button');
    this.fechaInput = page.getByTestId('feriado-date-input');
    this.todoDiaCheckbox = page.getByTestId('feriado-todo-dia-checkbox');
    this.horaInicioInput = page.getByTestId('feriado-hora-inicio-input');
    this.horaFinInput = page.getByTestId('feriado-hora-fin-input');
    this.submitButton = page.getByTestId('feriado-submit-button');
    this.errorMessage = page.getByTestId('feriado-error');
  }

  /** Navigate to /admin/feriados. */
  async goto(): Promise<void> {
    await this.page.goto('/admin/feriados');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the feriado admin page is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Fill the date input (YYYY-MM-DD). */
  async fillFecha(value: string): Promise<void> {
    await this.fechaInput.fill(value);
  }

  /** Set the "todo el día" checkbox state. */
  async toggleTodoDia(checked: boolean): Promise<void> {
    if (checked) {
      await this.todoDiaCheckbox.check();
    } else {
      await this.todoDiaCheckbox.uncheck();
    }
  }

  /** Fill the partial-day start hour (HH:mm). */
  async fillHoraInicio(value: string): Promise<void> {
    await this.horaInicioInput.fill(value);
  }

  /** Fill the partial-day end hour (HH:mm). */
  async fillHoraFin(value: string): Promise<void> {
    await this.horaFinInput.fill(value);
  }

  /** Click the submit button to create the feriado. */
  async submitCreate(): Promise<void> {
    await this.submitButton.click();
  }

  /** Assert the new feriado is visible in the list (by fecha string). */
  async expectCreated(fecha: string): Promise<void> {
    await expect(this.listItem(fecha)).toBeVisible({ timeout: 10_000 });
  }

  /** Assert the duplicate-date error is visible. */
  async expectDuplicateError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 10_000 });
  }

  /** Click delete on a list item by fecha, accept any confirm dialog. */
  async deleteByFecha(fecha: string): Promise<void> {
    const item = this.listItem(fecha);
    this.page.once('dialog', (d) => d.accept());
    const deleteButton = item.getByTestId('feriado-delete-button');
    await deleteButton.click();
  }

  /** Assert a feriado is no longer visible in the list. */
  async expectNotInList(fecha: string): Promise<void> {
    await expect(this.listItem(fecha)).toHaveCount(0, { timeout: 10_000 });
  }

  /** Build the locator for a list item by fecha. */
  private listItem(fecha: string): Locator {
    return this.page.locator(
      `[data-testid="feriado-list-item"]:has-text("${fecha}")`
    ).first();
  }
}
