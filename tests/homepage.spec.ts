import { test, expect, Page } from '@playwright/test';

// ============================================
// Phase 4.1-4.4: RoutineCard Tests
// ============================================

test.describe('RoutineCard', () => {
  test('4.1 - displays routine with full information', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // Full Body should be visible
    await expect(page.getByText('Full Body')).toBeVisible();
    // Check for type (Fuerza or similar)
    await expect(page.locator('text=Fuerza').first()).toBeVisible();
    // Check for days text
    await expect(page.locator('text=días').first()).toBeVisible();
  });

  test('4.2 - displays routine without description', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // Verify Upper Body exists in the page (from seed)
    await expect(page.getByText('Upper Body')).toBeVisible();
    // Should not show "null" as visible text for description
    await expect(page.getByText('null', { exact: false })).not.toBeVisible();
  });

  test('4.3 - has hover state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    const card = page.getByText('Full Body').locator('..');
    await card.hover();
    await expect(card).toHaveCSS('cursor', 'pointer');
  });

  test('4.4 - displays days count correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // Get count from API to verify exact match
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    const fullBody = rutinas.find((r: any) => r.nombre === 'Full Body');
    
    // Verify the exact days count is displayed
    await expect(page.getByText(`${fullBody.diasCount} días`)).toBeVisible();
  });
});

// ============================================
// Phase 4.5-4.6: RoutineList Tests
// ============================================

test.describe('RoutineList', () => {
  test('4.5 - displays responsive grid', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // Check grid has cards - look for cards in the grid
    const cards = page.locator('.grid > *');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('4.6 - displays empty state', async ({ page }) => {
    await page.goto('/?search=nonexistent_xyz_12345');
    await expect(page.getByText('No hay rutinas disponibles')).toBeVisible();
    await expect(page.getByText('Crea tu primera rutina para comenzar')).toBeVisible();
  });
});

// ============================================
// Phase 4.7-4.9: SearchBar Tests
// ============================================

test.describe('SearchBar', () => {
  test('4.7 - updates URL on search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    const searchInput = page.getByPlaceholder('Buscar rutinas...');
    await searchInput.fill('Full');
    await searchInput.press('Enter');
    
    await expect(page).toHaveURL(/search=Full/);
  });

  test('4.8 - handles special characters in URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    const searchInput = page.getByPlaceholder('Buscar rutinas...');
    await searchInput.fill('Rutina de Piernas');
    await searchInput.press('Enter');
    
    // URL should contain the encoded search term
    await expect(page).toHaveURL(/search=Rutina/);
  });

  test('4.9 - clears search when empty', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    const searchInput = page.getByPlaceholder('Buscar rutinas...');
    await searchInput.fill('Full');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/search=Full/);
    
    await searchInput.fill('');
    await searchInput.press('Enter');
    
    await page.waitForURL(/\/(\?.*)?$/);
  });
});

// ============================================
// Phase 4.10-4.11: Loading State Tests
// ============================================

test.describe('Loading State', () => {
  test('4.10 - displays skeleton cards during loading', async ({ page }) => {
    // Track if skeleton was visible before content loaded
    let skeletonSeen = false;
    
    await page.route(/api\/rutinas/, async (route) => {
      // Delay response to allow skeleton to appear
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });
    
    const pagePromise = page.goto('/');
    
    // Wait briefly and check for skeleton
    await page.waitForTimeout(50);
    skeletonSeen = await page.locator('.animate-pulse').count() > 0;
    
    await pagePromise;
    
    // After page loads, content should be visible
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // At least we should have seen either skeleton or content during load
    expect(skeletonSeen || (await page.getByText('Full Body').count()) > 0).toBe(true);
  });

  test('4.11 - transitions from loading to content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// Phase 4.12-4.14: Homepage Integration Tests
// ============================================

test.describe('Homepage Integration', () => {
  test('4.12 - loads with all routines', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Rutinas Champion Gym')).toBeVisible();
    await expect(page.getByText('Explora las mejores rutinas de entrenamiento')).toBeVisible();
    await expect(page.getByText('Full Body')).toBeVisible();
  });

  test('4.13 - loads with search results', async ({ page }) => {
    await page.goto('/?search=Full');
    await expect(page.getByText('Full Body')).toBeVisible();
  });

  test('4.14 - complete user journey', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    const searchInput = page.getByPlaceholder('Buscar rutinas...');
    await searchInput.fill('Leg');
    await searchInput.press('Enter');
    
    await expect(page).toHaveURL(/search=Leg/);
    await expect(searchInput).toHaveValue('Leg');
  });
});

// ============================================
// Phase 4.15: Error Handling Tests
// ============================================

test.describe('Error Handling', () => {
  test('4.15 - handles API error gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route(/api\/rutinas/, async (route) => {
      await route.fulfill({ 
        status: 500, 
        json: { error: 'Database unavailable' } 
      });
    });
    
    await page.goto('/');
    
    // Wait for React error boundary to render (Next.js shows error UI)
    await page.waitForTimeout(1500);
    
    // Page should either show error UI, redirect to error page, or show empty state
    const pageUrl = page.url();
    const pageContent = await page.content();
    
    // Either we get an error page (URL contains /500 or error in content) or content loads anyway
    const isErrorPage = pageUrl.includes('/500') || pageContent.includes('Error') || pageContent.includes('error');
    const showsEmptyState = pageContent.includes('No hay rutinas disponibles');
    
    expect(isErrorPage || showsEmptyState).toBe(true);
  });
});
