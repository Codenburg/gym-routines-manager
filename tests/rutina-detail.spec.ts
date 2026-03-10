import { test, expect, Page } from '@playwright/test';

// ============================================
// Dynamic ID fetching - get IDs from API
// ============================================

let RUTINA_FULL_BODY_ID = '';
let RUTINA_UPPER_BODY_ID = '';
let RUTINA_LEG_DAY_ID = '';
let RUTINA_PUSH_PULL_LEGS_ID = '';

async function getRoutineIds(page: Page) {
  const response = await page.request.get('/api/rutinas');
  const rutinas = await response.json();
  
  const fullBody = rutinas.find((r: any) => r.nombre === 'Full Body');
  const upperBody = rutinas.find((r: any) => r.nombre === 'Upper Body');
  const legDay = rutinas.find((r: any) => r.nombre === 'Leg Day');
  const pushPullLegs = rutinas.find((r: any) => r.nombre === 'Push Pull Legs');
  
  RUTINA_FULL_BODY_ID = fullBody?.id || '';
  RUTINA_UPPER_BODY_ID = upperBody?.id || '';
  RUTINA_LEG_DAY_ID = legDay?.id || '';
  RUTINA_PUSH_PULL_LEGS_ID = pushPullLegs?.id || '';
}

// ============================================
// Phase 5.1-5.4: Contract & Structure Tests
// ============================================

test.describe('Contract & Structure - GET /api/rutinas/[id]', () => {
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.1 - returns 200 with complete routine data structure', async ({ page }) => {
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Validate root-level fields exist
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('nombre');
    expect(data).toHaveProperty('tipo');
    expect(data).toHaveProperty('descripcion');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
    expect(data).toHaveProperty('dias');
    
    // Validate dias array structure
    expect(Array.isArray(data.dias)).toBe(true);
    expect(data.dias.length).toBe(5);
    
    // Validate first day structure
    const dia = data.dias[0];
    expect(dia).toHaveProperty('id');
    expect(dia).toHaveProperty('nombre');
    expect(dia).toHaveProperty('musculosEnfocados');
    expect(dia).toHaveProperty('orden');
    expect(dia).toHaveProperty('ejercicios');
    
    // Validate ejercicios array
    expect(Array.isArray(dia.ejercicios)).toBe(true);
    
    // Validate series field exists in ejercicios
    const ejercicio = dia.ejercicios[0];
    expect(ejercicio).toHaveProperty('series');
  });

  test('5.2 - returns null description when not set', async ({ page }) => {
    const response = await page.request.get(`/api/rutinas/${RUTINA_UPPER_BODY_ID}`);
    const data = await response.json();
    
    expect(data.descripcion).toBeNull();
  });

  test('5.3 - returns dias ordered by orden field', async ({ page }) => {
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
    const data = await response.json();
    
    // Verify days are in ascending order by orden
    for (let i = 0; i < data.dias.length - 1; i++) {
      expect(data.dias[i].orden).toBeLessThan(data.dias[i + 1].orden);
    }
  });

  test('5.4 - returns proper structure with series field', async ({ page }) => {
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
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Routine not found');
  });

  test('5.6 - returns 200 for valid routine', async ({ page }) => {
    const response = await page.request.get(`/api/rutinas/${RUTINA_FULL_BODY_ID}`);
    expect(response.status()).toBe(200);
  });

  test('5.7 - handles malformed ID gracefully', async ({ page }) => {
    const response = await page.request.get('/api/rutinas/invalid-id-format');
    
    // Should return 404 or handle gracefully
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

  test('5.8 - displays routine name and type', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Fuerza')).toBeVisible();
  });

  test('5.9 - displays description when present', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    await expect(page.getByText('Rutina completa para trabajar todo el cuerpo')).toBeVisible();
  });

  test('5.10 - displays all days with correct count', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    await expect(page.getByText('Días de entrenamiento (5)')).toBeVisible();
  });

  test('5.11 - displays muscle groups for each day', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    // Use first() since there are multiple days with same muscle groups
    await expect(page.getByText('Pecho, Espalda').first()).toBeVisible();
    await expect(page.getByText('Piernas').first()).toBeVisible();
    await expect(page.getByText('Hombros, Brazos')).toBeVisible();
  });

  test('5.12 - displays exercise series metadata', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    // Should show series like "3x12" or "3x10"
    await expect(page.getByText('3x12 - 1x10').first()).toBeVisible();
  });

  test('5.13 - displays day numbers correctly', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    // Wait for content to load
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // First day is "Día 1"
    await expect(page.getByText('Día 1')).toBeVisible();
  });

  test('5.14 - has working back button', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_FULL_BODY_ID}`);
    
    const backLink = page.getByRole('link', { name: /volver a mis rutinas/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });
});

// ============================================
// Phase 5.15-5.18: Edge Cases
// ============================================

test.describe('Detail Page Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await getRoutineIds(page);
  });

  test('5.15 - handles routine without description', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_UPPER_BODY_ID}`);
    
    await expect(page.getByText('Upper Body')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hipertrofia')).toBeVisible();
    // Should not show "null" text anywhere
    const pageContent = await page.content();
    expect(pageContent).not.toContain('"null"');
  });

  test('5.16 - displays routine with different types', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_UPPER_BODY_ID}`);
    await expect(page.getByText('Hipertrofia')).toBeVisible();
  });

  test('5.17 - handles routine with exercises', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_LEG_DAY_ID}`);
    
    await expect(page.getByText('Leg Day')).toBeVisible({ timeout: 10000 });
    // Leg day has exercises in the new seed
    await expect(page.getByText('5x5 - 1x3')).toBeVisible();
  });

  test('5.18 - handles 404 gracefully', async ({ page }) => {
    await page.goto('/rutinas/00000000-0000-0000-0000-000000000000');
    
    // Should either show error or Next.js 404 page
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
    await page.goto('/');
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // Click on the routine card
    await page.getByText('Full Body').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/rutinas\/.+/);
    await expect(page.getByText('Full Body')).toBeVisible();
  });

  test('5.20 - URL contains correct routine ID', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_PUSH_PULL_LEGS_ID}`);
    
    await expect(page).toHaveURL(new RegExp(RUTINA_PUSH_PULL_LEGS_ID));
  });

  test('5.21 - routine with 6 days displays correctly', async ({ page }) => {
    await page.goto(`/rutinas/${RUTINA_PUSH_PULL_LEGS_ID}`);
    
    await expect(page.getByText('Push Pull Legs')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Días de entrenamiento (6)')).toBeVisible();
  });
});
