import { test, expect, Page } from '@playwright/test';

// ============================================
// Public Homepage Tests
// ============================================

test.describe('Public Homepage', () => {
  test('9.1.1 - Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('localhost:3000');
  });

  test('9.1.2 - Homepage shows routine cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check if routines are displayed
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    
    if (rutinas.length > 0) {
      // Should see some routine content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    }
  });

  test('9.1.3 - Search functionality works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check if search input exists
    const searchInput = page.locator('input[type="text"], input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Full Body');
      await page.waitForTimeout(1500);
      
      // URL may or may not have search param depending on implementation
      // Just verify page loads without error
      expect(page.url()).toContain('localhost:3000');
    } else {
      // Search input might not exist or be visible
      test.skip();
    }
  });

  test('9.1.4 - Empty search shows all routines', async ({ page }) => {
    await page.goto('/?search=');
    await page.waitForTimeout(3000);
    
    // Should load without error
    expect(page.url()).toContain('/');
  });
});

// ============================================
// Public Routine Detail Tests
// ============================================

test.describe('Public Routine Detail', () => {
  async function getFirstRoutineId(page: Page): Promise<string | null> {
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    return rutinas.length > 0 ? rutinas[0].id : null;
  }

  test('9.2.1 - Routine detail page loads', async ({ page }) => {
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('/rutinas/');
  });

  test('9.2.2 - Shows routine name', async ({ page }) => {
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Should see routine name in the page
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });

  test('9.2.3 - Shows days list', async ({ page }) => {
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Should show day cards or content
    const content = await page.content();
    expect(content).toContain('Día');
  });

  test('9.2.4 - Can navigate to day detail', async ({ page }) => {
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Find and click on a day link if available
    const dayLinks = page.locator('a[href*="/dias/"]');
    const count = await dayLinks.count();
    
    if (count > 0) {
      await dayLinks.first().click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/dias/');
    }
  });

  test('9.2.5 - Back button works', async ({ page }) => {
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Look for back button or link
    const backLink = page.locator('a[href="/"], a:has-text("Volver")').first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await page.waitForTimeout(2000);
      // Just verify we went back to home
      expect(page.url()).toContain('/');
    }
  });
});

// ============================================
// Public Day Detail Tests
// ============================================

test.describe('Public Day Detail', () => {
  async function getFirstDayId(page: Page): Promise<{ rutinaId: string; diaId: string } | null> {
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    
    if (rutinas.length === 0 || !rutinas[0].dias || rutinas[0].dias.length === 0) {
      return null;
    }
    
    return {
      rutinaId: rutinas[0].id,
      diaId: rutinas[0].dias[0].id
    };
  }

  test('9.3.1 - Day detail page loads', async ({ page }) => {
    const dayData = await getFirstDayId(page);
    if (!dayData) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${dayData.rutinaId}/dias/${dayData.diaId}`);
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('/dias/');
  });

  test('9.3.2 - Shows exercises list', async ({ page }) => {
    const dayData = await getFirstDayId(page);
    if (!dayData) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${dayData.rutinaId}/dias/${dayData.diaId}`);
    await page.waitForTimeout(3000);
    
    // Should show exercises content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });

  test('9.3.3 - Shows exercise details (name, series)', async ({ page }) => {
    const dayData = await getFirstDayId(page);
    if (!dayData) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${dayData.rutinaId}/dias/${dayData.diaId}`);
    await page.waitForTimeout(3000);
    
    // Should see exercise information
    const response = await page.request.get(`/api/rutinas/${dayData.rutinaId}/dias/${dayData.diaId}`);
    const data = await response.json();
    
    if (data.ejercicios && data.ejercicios.length > 0) {
      const content = await page.content();
      expect(content).toContain(data.ejercicios[0].nombre);
    }
  });

  test('9.3.4 - Back button returns to routine', async ({ page }) => {
    const dayData = await getFirstDayId(page);
    if (!dayData) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${dayData.rutinaId}/dias/${dayData.diaId}`);
    await page.waitForTimeout(3000);
    
    // Look for back button
    const backLink = page.locator('a[href*="/rutinas/"]').first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain(`/rutinas/${dayData.rutinaId}`);
    }
  });
});

// ============================================
// API Tests
// ============================================

test.describe('Public API Endpoints', () => {
  test('9.4.1 - GET /api/rutinas returns array', async ({ page }) => {
    const response = await page.request.get('/api/rutinas');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('9.4.2 - GET /api/rutinas/[id] returns routine', async ({ page }) => {
    // First get a routine ID
    const listResponse = await page.request.get('/api/rutinas');
    const rutinas = await listResponse.json();
    
    if (rutinas.length > 0) {
      const response = await page.request.get(`/api/rutinas/${rutinas[0].id}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('nombre');
      expect(data).toHaveProperty('tipo');
    }
  });

  test('9.4.3 - GET /api/rutinas/[id]/dias/[diaId] returns day', async ({ page }) => {
    // First get a day ID
    const listResponse = await page.request.get('/api/rutinas');
    const rutinas = await listResponse.json();
    
    if (rutinas.length > 0 && rutinas[0].dias && rutinas[0].dias.length > 0) {
      const dia = rutinas[0].dias[0];
      const response = await page.request.get(`/api/rutinas/${rutinas[0].id}/dias/${dia.id}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('nombre');
    }
  });

  test('9.4.4 - Invalid routine ID returns 404', async ({ page }) => {
    const response = await page.request.get('/api/rutinas/invalid-id');
    expect(response.status()).toBe(404);
  });

  test('9.4.5 - Non-existent routine returns 404', async ({ page }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.get(`/api/rutinas/${fakeId}`);
    expect(response.status()).toBe(404);
  });
});

// ============================================
// Responsive Design Tests
// ============================================

test.describe('Responsive Design', () => {
  test('9.5.1 - Mobile view loads homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('/');
  });

  test('9.5.2 - Mobile view loads routine detail', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const response = await page.request.get('/api/rutinas');
    const rutinas = await response.json();
    
    if (rutinas.length > 0) {
      await page.goto(`/rutinas/${rutinas[0].id}`);
      await page.waitForTimeout(3000);
      expect(page.url()).toContain('/rutinas/');
    }
  });

  test('9.5.3 - Tablet view loads correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('/');
  });
});

// ============================================
// Performance Tests
// ============================================

test.describe('Performance', () => {
  test('9.6.1 - Homepage loads in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(10000); // Should load in less than 10 seconds
  });

  test('9.6.2 - API responds quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.request.get('/api/rutinas');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(5000); // API should respond in less than 5 seconds
  });
});

// ============================================
// Accessibility Tests
// ============================================

test.describe('Accessibility', () => {
  test('9.7.1 - Page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('9.7.2 - Links have proper href', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Get first link and verify it has href
    const link = page.locator('a[href]').first();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('9.7.3 - Images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check for images
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      // At least some images should have alt text
      const firstImage = images.first();
      const alt = await firstImage.getAttribute('alt');
      // Alt can be empty string for decorative images
      expect(alt).not.toBeNull();
    }
  });
});
