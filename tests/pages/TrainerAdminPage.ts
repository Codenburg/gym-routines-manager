/**
 * TrainerAdminPage — page object for /admin/trainers.
 *
 * Encapsulates the trainer CRUD form interactions:
 *   - goto():         navigate to /admin/trainers
 *   - fillName():     fill the trainer's name
 *   - fillDni():      fill the DNI (8-digit unique identifier)
 *   - fillPassword(): fill the initial password
 *   - submitCreate(): click the submit button
 *   - expectCreated(): assert the new trainer is in the list
 *
 * Per design §5.3 (TrainerAdminPage) and Decision 8 (data-testid list):
 *   - nameInput       → data-testid='trainer-name-input'
 *   - dniInput        → data-testid='trainer-dni-input'
 *   - passwordInput   → data-testid='trainer-password-input'
 *   - submitButton    → data-testid='trainer-submit-button'
 *   - listItem(dni)   → [data-testid="trainer-list-item"]:has-text(dni)
 *
 * Per design §6.4 test scenarios:
 *   S3.T.1 create (+ login as trainer verification)
 *   S3.T.2 edit name
 *   S3.T.3 remove trainer membership
 *   S3.T.4 reject duplicate DNI
 *
 * Note: `deleteByDni` + `expectNotActive` were removed because
 * the actual spec handles deletion inline (AlertDialog click
 * per discovery #213). Keeping the page object thin per Decision 6.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TrainerAdminPage extends BasePage {
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly nameInput: Locator;
  readonly dniInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /Trainers/i }).first();
    this.addButton = page.getByTestId('trainer-add-button');
    this.nameInput = page.getByTestId('trainer-name-input');
    this.dniInput = page.getByTestId('trainer-dni-input');
    this.passwordInput = page.getByTestId('trainer-password-input');
    this.submitButton = page.getByTestId('trainer-submit-button');
  }

  /** Navigate to /admin/trainers. */
  async goto(): Promise<void> {
    await this.page.goto('/admin/trainers');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the trainer admin page is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Fill the trainer's name. */
  async fillName(value: string): Promise<void> {
    await this.nameInput.fill(value);
  }

  /** Fill the DNI (8-digit). */
  async fillDni(value: string): Promise<void> {
    await this.dniInput.fill(value);
  }

  /** Fill the initial password. */
  async fillPassword(value: string): Promise<void> {
    await this.passwordInput.fill(value);
  }

  /** Click the submit button to create the trainer. */
  async submitCreate(): Promise<void> {
    await this.submitButton.click();
  }

  /** Assert the new trainer is visible in the list (matched by DNI). */
  async expectCreated(dni: string): Promise<void> {
    await expect(this.listItem(dni)).toBeVisible({ timeout: 10_000 });
  }

  /** Build the locator for a list item by DNI. */
  private listItem(dni: string): Locator {
    return this.page.locator(
      `[data-testid="trainer-list-item"]:has-text("${dni}")`
    ).first();
  }
}
