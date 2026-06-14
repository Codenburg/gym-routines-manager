/**
 * BasePage — abstract base class for all Playwright page objects.
 *
 * Per Playwright skill (v1.2 §"Page Object Pattern"), every page object
 * extends this class. Provides:
 *   - `page` accessor (readonly)
 *   - `waitForAdminLayout()` — hydration guard (GGA-FOLLOWUP-4 mitigation):
 *     waits for the "Panel de Administraci" heading visible for 15s,
 *     which is the canonical sentinel for the admin layout being fully
 *     hydrated. Use in admin page objects' `goto()` methods.
 *   - `waitForToast(message)` — sonner toast visibility wait
 *   - `waitForNetworkIdle()` — common action wait
 *
 * Per design §5.3 Decision 6: page objects are THIN wrappers.
 * Forbidden inside page objects: cross-page navigation, auth flows,
 * data cleanup, direct API calls. Each method is the smallest user-
 * meaningful action.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { waitForToast } from '../helpers';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to the page and wait for the loading skeleton to disappear. */
  abstract goto(): Promise<void>;

  /** Assert the page is fully loaded (post-hydration). */
  abstract expectVisible(): Promise<void>;

  /**
   * Hydration guard for admin pages: wait for the "Panel de Administraci"
   * heading to be visible. Matches the gym-config.spec.ts:97-111 pattern
   * (the original GGA-FOLLOWUP-4 mitigation).
   *
   * Why: the admin layout sidebar has a hydration race where subsequent
   * navigations can land on a partially-rendered layout, causing flakiness
   * in save/submit actions. The dashboard h1 is the only stable sentinel.
   */
  protected async waitForAdminLayout(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /Panel de Administr/i })).toBeVisible({
      timeout: 15_000,
    });
  }

  /**
   * Common: wait for a sonner toast matching the given message.
   * Returns the toast locator for further assertions.
   */
  protected waitForToast(message: string | RegExp): Promise<Locator> {
    return waitForToast(this.page, message);
  }

  /**
   * Common: wait for network idle (no in-flight requests for 500ms).
   * Use after form submissions that don't have a server-action response
   * matcher.
   */
  protected async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 });
  }
}
