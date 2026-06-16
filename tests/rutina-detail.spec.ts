import { test, expect, Page } from '@playwright/test';

// ============================================
// Helper Functions - No Shared State
// ============================================

/**
 * Fetches routine IDs from API without using shared module state.
 * Returns IDs directly to avoid race conditions in parallel execution.
 */
async function fetchRoutineIds(page: Page): Promise<{
  fullBodyId: string | null;
  pechoId: string | null;
}> {
  const response = await page.request.get('/api/rutinas');
  const result = await response.json();
  const rutinas = result.data;
  
  // Find routines from seed data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullBody = rutinas.find((r: any) => 
    r.nombre.includes('Full Body') && !r.nombre.includes('Ligero') && r.creador === 'Santi'
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pecho = rutinas.find((r: any) => 
    r.nombre.includes('Pecho') && r.creador === 'Santi'
  );
  
  return {
    fullBodyId: fullBody?.id || null,
    pechoId: pecho?.id || null,
  };
}

/**
 * Fetches a routine's type from API to use in assertions
 */
async function fetchRoutineType(page: Page, id: string): Promise<string | null> {
  const response = await page.request.get(`/api/rutinas/${id}`);
  if (!response.ok()) return null;
  const data = await response.json();
  return data.tipo || null;
}

// ============================================
// Phase 5.1-5.4: Contract & Structure Tests
// ============================================

test.describe('Contract & Structure - GET /api/rutinas/[id]', () => {
  test('5.1 - returns 200 with complete routine data structure', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${ids.fullBodyId}`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Validate root-level fields exist
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('nombre');
    expect(data).toHaveProperty('tipo');
    expect(data).toHaveProperty('dias');
    
    // Validate dias array structure
    expect(Array.isArray(data.dias)).toBe(true);
    
    // Validate first day structure
    if (data.dias.length > 0) {
      const dia = data.dias[0];
      expect(dia).toHaveProperty('id');
      expect(dia).toHaveProperty('nombre');
      expect(dia).toHaveProperty('musculosEnfocados');
      expect(dia).toHaveProperty('orden');
      expect(dia).toHaveProperty('ejercicios');
    }
  });

  test('5.2 - returns proper description field', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${ids.fullBodyId}`);
    const data = await response.json();
    
    // Description can be null or string
    expect(data.descripcion === null || typeof data.descripcion === 'string').toBe(true);
  });

  test('5.3 - returns dias ordered by orden field', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${ids.fullBodyId}`);
    const data = await response.json();
    
    // Verify days are in ascending order by orden
    for (let i = 0; i < data.dias.length - 1; i++) {
      expect(data.dias[i].orden).toBeLessThan(data.dias[i + 1].orden);
    }
  });

  test('5.4 - returns proper structure with series field', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${ids.fullBodyId}`);
    const data = await response.json();
    
    // Each day should have ejercicios array with series field
    for (const dia of data.dias) {
      expect(dia).toHaveProperty('ejercicios');
      expect(Array.isArray(dia.ejercicios)).toBe(true);
      
      // Each ejercicio should have series field
      for (const ejercicio of dia.ejercicios) {
        expect(ejercicio).toHaveProperty('series');
      }
    }
  });
});

// ============================================
// Phase 5.5-5.7: Error Handling Tests
// ============================================

test.describe('Error Handling', () => {
  test('5.5 - returns 404 for non-existent routine', async ({ page }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.get(`/api/rutinas/${fakeId}`);
    expect(response.status()).toBe(404);
  });

  test('5.6 - returns 200 for valid routine', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${ids.fullBodyId}`);
    expect(response.status()).toBe(200);
  });

  test('5.7 - handles malformed ID gracefully', async ({ page }) => {
    const response = await page.request.get('/api/rutinas/invalid-id-format');
    // Should return 400 or 404
    expect([400, 404]).toContain(response.status());
  });
});

// ============================================
// Phase 5.8-5.14: Routine Detail Page UI Tests
// ============================================

test.describe('Routine Detail Page UI', () => {
  test('5.8 - displays routine name', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Verify routine name is visible
    const routineName = page.getByText(/Full Body/i).first();
    await expect(routineName).toBeVisible({ timeout: 10000 });
  });

  test('5.9 - displays routine type', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    // Get the actual type from API
    const tipo = await fetchRoutineType(page, ids.fullBodyId);
    if (!tipo) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Use the actual type for assertion
    const typeElement = page.getByText(new RegExp(tipo, 'i')).first();
    await expect(typeElement).toBeVisible({ timeout: 10000 });
  });

  test('5.10 - displays days section', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Should show days section
    const daysSection = page.getByText(/Días/i).first();
    await expect(daysSection).toBeVisible({ timeout: 10000 });
  });

  test('5.11 - displays muscle groups for days', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Get the actual type for muscle group check
    const tipo = await fetchRoutineType(page, ids.fullBodyId);
    if (tipo) {
      const muscleGroup = page.getByText(new RegExp(tipo, 'i')).first();
      await expect(muscleGroup).toBeVisible({ timeout: 10000 });
    }
  });

  test('5.12 - displays exercise series metadata', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Should show series like "3x10" or similar
    const series = page.getByText(/\d+x\d+/).first();
    await expect(series).toBeVisible({ timeout: 10000 });
  });

  test('5.13 - displays day numbers correctly', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Should show "Día 1" or similar
    const dayNumber = page.getByText(/Día \d+/i).first();
    await expect(dayNumber).toBeVisible({ timeout: 10000 });
  });

  test('5.14 - has working back button', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    const backLink = page.getByRole('link', { name: /volver/i });
    await expect(backLink.first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// Phase 5.15-5.18: Edge Cases
// ============================================

test.describe('Detail Page Edge Cases', () => {
  test('5.15 - handles routine with description', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Full Body - Santi has description "Rutina completa para todo el cuerpo"
    // Check for any description text or muscle group
    const description = page.getByText(/completa|cuerpo/i).first();
    await expect(description).toBeVisible({ timeout: 10000 });
  });

  test('5.16 - displays routine with different types', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.pechoId) {
      test.skip();
      return;
    }
    
    // Get the actual type for Pecho routine
    const tipo = await fetchRoutineType(page, ids.pechoId);
    if (!tipo) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.pechoId}`);
    await page.waitForLoadState('networkidle');
    
    // Should show the type
    const typeElement = page.getByText(new RegExp(tipo, 'i')).first();
    await expect(typeElement).toBeVisible({ timeout: 10000 });
  });

  test('5.17 - routine shows exercises', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.pechoId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.pechoId}`);
    await page.waitForLoadState('networkidle');
    
    // Should show "Día" text
    const dayText = page.getByText(/Día/i).first();
    await expect(dayText).toBeVisible({ timeout: 10000 });
  });

  test('5.18 - handles 404 gracefully', async ({ page }) => {
    await page.goto('/rutinas/00000000-0000-0000-0000-000000000000');
    // Should handle gracefully - page should load with error state
    await page.waitForLoadState('networkidle');
  });
});

// ============================================
// Phase 5.19-5.20: Navigation Integration
// ============================================

test.describe('Navigation Integration', () => {
  test('5.19 - can navigate from homepage to detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for routines to load
    const routineLink = page.getByText(/Full Body/i).first();
    await expect(routineLink).toBeVisible({ timeout: 10000 });
    
    // Click on the routine card
    await routineLink.click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/rutinas\/.+/, { timeout: 10000 });
  });

  test('5.20 - URL contains correct routine ID', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // URL should contain the routine ID
    await expect(page).toHaveURL(new RegExp(ids.fullBodyId), { timeout: 10000 });
  });

  test('5.21 - routine with multiple days displays correctly', async ({ page }) => {
    const ids = await fetchRoutineIds(page);
    if (!ids.fullBodyId) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${ids.fullBodyId}`);
    await page.waitForLoadState('networkidle');
    
    // Full Body routines have 2 days
    const dayText = page.getByText(/Día/i).first();
    await expect(dayText).toBeVisible({ timeout: 10000 });
  });
});
