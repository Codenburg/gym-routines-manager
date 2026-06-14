/* eslint-disable react-hooks/rules-of-hooks */
import { Page, test as base } from '@playwright/test';

/**
 * Extended test fixture that automatically handles browser dialogs
 * Useful for XSS testing where alert() might be triggered
 */
export const test = base.extend({
  page: async ({ page }, usePage) => {
    // Auto-accept all dialogs
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await usePage(page);
  },
});

export { expect } from '@playwright/test';

// Type definitions for rutina response
interface Rutina {
  id: string;
  nombre: string;
  [key: string]: unknown;
}

// Test credentials
// Note: The previous `loginAsAdmin` helper lived here but used WRONG
// credentials (`12345678/admin123`) that do not match the seed. It was
// never imported by any spec (the 6 spec files all defined their own
// `loginAsAdmin` with the correct `11111111/nando123`). Removed in
// `e2e-coverage-critical-flows` T0.1 — the canonical helper is now
// `tests/helpers.ts:loginAsAdmin`.

/**
 * Login as regular (non-admin) user
 * Used for authorization security tests
 */
export async function loginAsUser(page: Page, dni: string, password: string): Promise<void> {
  await page.goto('/admin/login');
  
  // Wait for the form to be ready
  await page.waitForSelector('input[id="dni"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[id="dni"]', dni);
  await page.fill('input[id="password"]', password);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to home page (regular users go to /, admins go to /admin)
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Create a non-admin test user via Better Auth sign-up API
 * Returns the credentials of the created user
 */
export async function createTestUser(): Promise<{ dni: string; password: string }> {
  const timestamp = Date.now();
  const dni = `test${timestamp}`.slice(-8); // 8 digit DNI
  const password = 'TestUser123!';
  
  // Using Better Auth's sign-up endpoint
  const response = await fetch('http://localhost:3000/api/auth/sign-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dni,
      password,
      name: 'Test User',
    }),
  });
  
  if (!response.ok) {
    // If user already exists, try with a different dni
    if (response.status === 400) {
      return createTestUser();
    }
    throw new Error(`Failed to create test user: ${response.status}`);
  }
  
  return { dni, password };
}

/**
 * Set expired session cookie to simulate session timeout
 * This helps test session expiration handling
 */
export async function setExpiredCookie(page: Page): Promise<void> {
  // Set a cookie with an expired date
  await page.context().addCookies([
    {
      name: 'better-auth.session_token',
      value: 'expired-token',
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 - 3600, // Expired 1 hour ago
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Clear all session cookies to simulate logged out state
 */
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * Get routine IDs for testing
 * Used to get valid routine IDs for test scenarios
 */
export async function getRoutineIds(page: Page): Promise<Record<string, Rutina | undefined>> {
  const response = await page.request.get('/api/rutinas');
  const rutinas: Rutina[] = await response.json();
  
  return {
    fullBody: rutinas.find((r) => r.nombre === 'Full Body'),
    upperBody: rutinas.find((r) => r.nombre === 'Upper Body'),
    legDay: rutinas.find((r) => r.nombre === 'Leg Day'),
    pushPullLegs: rutinas.find((r) => r.nombre === 'Push Pull Legs'),
  };
}

/**
 * Get API response with custom headers (for authorization testing)
 */
export async function apiRequest(
  page: Page,
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    data?: Record<string, unknown>;
  } = {}
): Promise<{ status: number; body: unknown }> {
  const response = await page.request.fetch(url, {
    method: options.method || 'GET',
    headers: options.headers,
    data: options.data,
  });
  
  const body = await response.json().catch(() => null);
  
  return {
    status: response.status(),
    body,
  };
}
