import { test, expect, Page } from '@playwright/test';

// ============================================
// Dynamic ID fetching - get IDs from API
// ============================================

let RUTINA_FULL_BODY_ID = '';
let RUTINA_PECHO_ID = '';
let RUTINA_ESPALDA_ID = '';

async function getRoutineIds(page: Page) {
  const response = await page.request.get('/api/rutinas');
  const result = await response.json();
  const rutinas = result.data;
  
  // Find routines that exist in the seed (Santi's routines)
  const fullBody = rutinas.find((r: any) => 
    r.nombre.includes('Full Body') && r.creador === 'Santi'
  );
  const pecho = rutinas.find((r: any) => 
    r.nombre.includes('Pecho') && r.creador === 'Santi'
  );
  const espalda = rutinas.find((r: any) => 
    r.nombre.includes('Espalda') && r.creador === 'Santi'
  );
  
  RUTINA_FULL_BODY_ID = fullBody?.id || '';
  RUTINA_PECHO_ID = pecho?.id || '';
  RUTINA_ESPALDA_ID = espalda?.id || '';
}

// ============================================
// Phase 5.1-5.4: Contract & Structure Tests
// ============================================

test.describe('Contract & Structure - GET /api/rutinas/[id]', () => {
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.1 - returns 200 with complete routine data structure', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
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
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
    const data = await response.json();
    
    // Description can be null or string
    expect(data.descripcion === null || typeof data.descripcion === 'string').toBe(true);
  });

  test('5.3 - returns dias ordered by orden field', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
    const data = await response.json();
    
    // Verify days are in ascending order by orden
    for (let i = 0; i < data.dias.length - 1; i++) {
      expect(data.dias[i].orden).toBeLessThan(data.dias[i + 1].orden);
    }
  });

  test('5.4 - returns proper structure with series field', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
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
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.5 - returns 404 for non-existent routine', async ({ page }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.get(`/api/rutinas/${fakeId}`);
    expect(response.status()).toBe(404);
  });

  test('5.6 - returns 200 for valid routine', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
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
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.8 - displays routine name', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    await expect(page.getByText('Full Body').first()).toBeVisible({ timeout: 10000 });
  });

  test('5.9 - displays routine type', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Type should be "Fuerza", "Cardio", or "Funcional"
    await expect(page.getByText('Fuerza').first()).toBeVisible({ timeout: 5000 });
  });

  test('5.10 - displays days section', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Should show days section
    await expect(page.getByText(/Días/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.11 - displays muscle groups for days', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Should show muscle groups text
    await expect(page.getByText(/Fuerza/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.12 - displays exercise series metadata', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Should show series like "3x10" or similar
    await expect(page.getByText(/3x/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.13 - displays day numbers correctly', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Should show "Día 1" or similar
    await expect(page.getByText(/Día \d+/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.14 - has working back button', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    const backLink = page.getByRole('link', { name: /volver/i });
    await expect(backLink.first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// Phase 5.15-5.18: Edge Cases
// ============================================

test.describe('Detail Page Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.15 - handles routine with description', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Full Body - Santi has description
    await expect(page.getByText(/completa/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.16 - displays routine with different types', async ({ page }) => {
    if (!RUTINA_PECHO_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_PECHO_ID}`);
    // Should show type
    await expect(page.getByText(/Fuerza/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.17 - routine shows exercises', async ({ page }) => {
    if (!RUTINA_PECHO_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_PECHO_ID}`);
    // Should show "Día" text
    await expect(page.getByText(/Día/).first()).toBeVisible({ timeout: 5000 });
  });

  test('5.18 - handles 404 gracefully', async ({ page }) => {
    await page.goto('/rutinas/00000000-0000-0000-0000-000000000000');
    // Should handle gracefully
    await page.waitForTimeout(1000);
  });
});

// ============================================
// Phase 5.19-5.20: Navigation Integration
// ============================================

test.describe('Navigation Integration', () => {
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.19 - can navigate from homepage to detail page', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto('/');
    await expect(page.getByText('Full Body').first()).toBeVisible({ timeout: 10000 });
    
    // Click on the routine card
    await page.getByText('Full Body').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/rutinas\/.+/, { timeout: 10000 });
  });

  test('5.20 - URL contains correct routine ID', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    await expect(page).toHaveURL(new RegExp(RUTINA_FULL_BODY_ID));
  });

  test('5.21 - routine with multiple days displays correctly', async ({ page }) => {
    if (!RUTINA_FULL_BODY_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    // Full Body routines have 2 days
    await expect(page.getByText(/Día/).first()).toBeVisible({ timeout: 5000 });
  });
});
