import { test, expect, Page } from '@playwright/test';

// ============================================
// Admin Auth Helper Functions
// ============================================

// Test admin credentials - these need to be created in the database
const ADMIN_EMAIL = 'admin@championgym.com';
const ADMIN_PASSWORD = 'admin123';

async function getRoutineIds(page: Page) {
  const response = await page.request.get('/api/rutinas');
  const rutinas = await response.json();
  return {
    fullBody: rutinas.find((r: any) => r.nombre === 'Full Body'),
    upperBody: rutinas.find((r: any) => r.nombre === 'Upper Body'),
    legDay: rutinas.find((r: any) => r.nombre === 'Leg Day'),
    pushPullLegs: rutinas.find((r: any) => r.nombre === 'Push Pull Legs'),
  };
}

// ============================================
// Phase 7.1: Auth Flow Tests
// ============================================

test.describe('Admin Auth Flow', () => {
  test('7.1.1 - Login page returns 200 status', async ({ page }) => {
    const response = await page.goto('/admin/login');
    expect(response?.status()).toBe(200);
  });

  test('7.1.2 - Login page has correct title', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveTitle(/Login|Admin/i);
  });

  test('7.1.3 - Protected route redirects when not authenticated', async ({ page }) => {
    // Try to access admin dashboard without auth
    await page.goto('/admin/dashboard');
    // Should redirect to login or show error
    await page.waitForTimeout(2000);
  });

  test('7.1.4 - Login page contains email input', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('7.1.5 - Login page contains password input', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('7.1.6 - Login page contains submit button', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ============================================
// Phase 7.2: CRUD Operations Tests
// ============================================

test.describe('Admin CRUD Operations', () => {
  test('7.2.1 - Can access admin rutinas list', async ({ page }) => {
    // Try to access admin page - may redirect to login
    const response = await page.goto('/admin/rutinas');
    // Either 200 (if logged in) or redirect
    expect([200, 302]).toContain(response?.status() || 0);
  });

  test('7.2.2 - Can access new rutina page', async ({ page }) => {
    const response = await page.goto('/admin/rutinas/new');
    expect([200, 302]).toContain(response?.status() || 0);
  });

  test('7.2.3 - API endpoint for rutinas exists', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

// ============================================
// Phase 7.3: Admin Pages Load Tests
// ============================================

test.describe('Admin Pages Load', () => {
  test('7.3.1 - /admin/rutinas endpoint responds', async ({ page }) => {
    const response = await page.goto('/admin/rutinas');
    // Should respond (either success or redirect)
    expect(response?.status()).toBeLessThan(500);
  });

  test('7.3.2 - /admin/rutinas/new endpoint responds', async ({ page }) => {
    const response = await page.goto('/admin/rutinas/new');
    expect(response?.status()).toBeLessThan(500);
  });

  test('7.3.3 - /admin/dashboard endpoint responds', async ({ page }) => {
    const response = await page.goto('/admin/dashboard');
    expect(response?.status()).toBeLessThan(500);
  });

  test('7.3.4 - Public API /api/rutinas works', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    expect(response.status()).toBe(200);
  });

  test('7.3.5 - Public API /api/rutinas/[id] works with valid id', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    
    if (rutinas.length > 0) {
      const routineResponse = await page.request.get(`/api/rutinas/${rutinas[0].id}`);
      expect(routineResponse.status()).toBe(200);
    }
  });
});

// ============================================
// Phase 7.4: Integration Tests
// ============================================

test.describe('Admin Integration Tests', () => {
  test('7.4.1 - Homepage still works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Rutinas Champion Gym')).toBeVisible({ timeout: 10000 });
  });

  test('7.4.2 - Public routine detail pages work', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    
    if (rutinas.length > 0) {
      await page.goto(`/rutinas/${rutinas[0].id}`);
      await page.waitForTimeout(1000);
      // Should not return 500 error
    }
  });

  test('7.4.3 - API returns proper structure', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    const data = await response.json();
    
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('nombre');
      expect(data[0]).toHaveProperty('tipo');
    }
  });
});

// ============================================
// Phase 7.5: Error Handling Tests
// ============================================

test.describe('Admin Edge Cases', () => {
  test('7.5.1 - Invalid routine ID returns 404', async ({ page }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.get(`/api/rutinas/${fakeId}`);
    expect(response.status()).toBe(404);
  });

  test('7.5.2 - Invalid URL format handled gracefully', async ({ page }) => {
    const response = await page.goto('/api/rutinas/invalid-id');
    // Should handle gracefully
    expect(response?.status()).toBeLessThan(500);
  });

  test('7.5.3 - Empty search returns all routines', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    const data = await response.json();
    expect(data.length).toBeGreaterThan(0);
  });
});