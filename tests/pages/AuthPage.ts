/**
 * AuthPage — page object for /admin/login.
 *
 * Encapsulates the login form interactions:
 *   - goto(): navigate to /admin/login and wait for the form
 *   - loginAsAdmin(): fill seeded creds + submit
 *   - fillDni() / fillPassword(): individual field fillers
 *   - submit(): click the submit button and wait for /admin redirect
 *   - expectError(): assert the login-error-message toast
 *
 * Per design §5.3 (AuthPage):
 *   - dniInput      → getByLabel('DNI')
 *   - passwordInput → getByLabel('Contraseña')
 *   - submitButton  → getByRole('button', { name: /Iniciar sesi/i })
 *   - errorToast    → getByTestId('login-error-message') (added in T3.1)
 *
 * Per Decision 6: this page object does NOT auto-login. The login flow
 * is exposed as discrete methods (fillDni → fillPassword → submit) so
 * tests can compose both happy and error paths. For tests that just
 * want a logged-in admin, use `loginAsAdmin(page)` from `tests/helpers.ts`.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { ADMIN_DNI, ADMIN_PASSWORD } from '../helpers';

export class AuthPage extends BasePage {
  readonly dniInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    this.dniInput = page.getByLabel('DNI');
    this.passwordInput = page.getByLabel('Contraseña');
    this.submitButton = page.getByRole('button', { name: /Iniciar Sesi[oó]n/i });
    // login-error-message testid is added in T3.1 (app-code change)
    this.errorToast = page.getByTestId('login-error-message');
  }

  /** Navigate to /admin/login and wait for the form to be ready. */
  async goto(): Promise<void> {
    await this.page.goto('/admin/login');
    await this.page.waitForSelector('input[id="dni"]', { timeout: 15_000 });
  }

  /** Assert the login form is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.dniInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /** Fill the DNI field. */
  async fillDni(value: string): Promise<void> {
    await this.dniInput.fill(value);
  }

  /** Fill the password field. */
  async fillPassword(value: string): Promise<void> {
    await this.passwordInput.fill(value);
  }

  /** Click the submit button and wait for the /admin redirect. */
  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForURL('/admin', { timeout: 30_000 });
  }

  /**
   * Convenience: fill seeded admin credentials and submit.
   * For the more thorough pattern (with hydration guard) use
   * `loginAsAdmin(page)` from `tests/helpers.ts` instead.
   */
  async loginAsAdmin(): Promise<void> {
    await this.fillDni(ADMIN_DNI);
    await this.fillPassword(ADMIN_PASSWORD);
    await this.submit();
  }

  /**
   * Assert the login error toast is visible with the expected message.
   * `expected` is matched as a substring (toast messages include the
   * "DNI o contraseña incorrectos" wrapper from the app).
   */
  async expectError(expected: string | RegExp): Promise<void> {
    await expect(this.errorToast).toBeVisible({ timeout: 10_000 });
    await expect(this.errorToast).toContainText(expected);
  }
}
