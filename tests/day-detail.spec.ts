import { test, expect, Page } from '@playwright/test';

// ============================================
// Helper to get IDs from API
// ============================================

async function getRoutineIds(page: Page) {
  // Use page.request which works without navigating to a page first
  const response = await page.request.get('/api/rutinas');
  const rutinas = await response.json();
  
  const fullBody = rutinas.find((r: any) => r.nombre === 'Full Body');
  const upperBody = rutinas.find((r: any) => r.nombre === 'Upper Body');
  
  if (!fullBody?.id) {
    throw new Error('Seed data missing: "Full Body" routine not found. Please run seed script.');
  }
  if (!upperBody?.id) {
    throw new Error('Seed data missing: "Upper Body" routine not found. Please run seed script.');
  }
  
  let dia1Id = '';
  let dia1Nombre = '';
  let musculosEnfocados = '';
  let ejercicioCount = 0;
  
  const rutinaResponse = await page.request.get(`/api/rutinas/${fullBody.id}`);
  const rutina = await rutinaResponse.json();
  if (rutina.dias && rutina.dias.length > 0) {
    const dia = rutina.dias[0];
    dia1Id = dia.id;
    dia1Nombre = dia.nombre;
    musculosEnfocados = dia.musculosEnfocados || '';
    ejercicioCount = dia.ejercicios?.length || 0;
  }
  
  if (!dia1Id) {
    throw new Error('Seed data missing: No days found for "Full Body" routine. Please run seed script.');
  }
  
  return {
    rutinaFullBodyId: fullBody.id,
    rutinaUpperBodyId: upperBody.id,
    dia1Id,
    dia1Nombre,
    musculosEnfocados,
    ejercicioCount,
  };
}

// ============================================
// Phase 6.1-6.4: API Day Detail Tests
// ============================================

test.describe('API - GET /api/rutinas/[id]/dias/[diaId]', () => {
  test('6.1 - returns day with exercises', async ({ page }) => {
    const ids = await getRoutineIds(page);
    
    const response = await page.request.get(`/api/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('nombre');
    expect(data).toHaveProperty('musculosEnfocados');
    expect(data).toHaveProperty('orden');
    expect(data).toHaveProperty('ejercicios');
    expect(Array.isArray(data.ejercicios)).toBe(true);
    expect(data.ejercicios.length).toBeGreaterThan(0);
    
    const ejercicio = data.ejercicios[0];
    expect(ejercicio).toHaveProperty('id');
    expect(ejercicio).toHaveProperty('nombre');
    expect(ejercicio).toHaveProperty('orden');
  });

  test('6.2 - returns 404 for non-existent day', async ({ page }) => {
    const ids = await getRoutineIds(page);
    const fakeDayId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.get(`/api/rutinas/${ids.rutinaFullBodyId}/dias/${fakeDayId}`);
    
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Day not found');
  });

  test('6.3 - returns 404 for day belonging to different routine', async ({ page }) => {
    const ids = await getRoutineIds(page);
    
    const upperBodyResponse = await page.request.get(`/api/rutinas/${ids.rutinaUpperBodyId}`);
    const upperBody = await upperBodyResponse.json();
    const upperBodyDayId = upperBody.dias[0]?.id;
    
    if (upperBodyDayId) {
      const response = await page.request.get(`/api/rutinas/${ids.rutinaFullBodyId}/dias/${upperBodyDayId}`);
      expect(response.status()).toBe(404);
    }
  });

  test('6.4 - exercises are ordered by orden field', async ({ page }) => {
    const ids = await getRoutineIds(page);
    const response = await page.request.get(`/api/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    const data = await response.json();
    
    for (let i = 0; i < data.ejercicios.length - 1; i++) {
      expect(data.ejercicios[i].orden).toBeLessThan(data.ejercicios[i + 1].orden);
    }
  });
});

// ============================================
// Phase 6.5-6.12: Day Detail Page UI Tests
// ============================================

test.describe('Day Detail Page UI', () => {
  test('6.5 - displays day name', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    await expect(page.getByText(ids.dia1Nombre)).toBeVisible({ timeout: 10000 });
  });

  test('6.6 - displays muscle groups', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    
    // Must have muscle groups from seed data
    expect(ids.musculosEnfocados).toBeTruthy();
    await expect(page.getByText(ids.musculosEnfocados)).toBeVisible();
  });

  test('6.7 - displays all exercises', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    
    // Verify exercise count is displayed
    await expect(page.getByText(new RegExp(`Ejercicios \\(${ids.ejercicioCount}\\)`))).toBeVisible();
    
    // Verify at least one exercise name is visible
    const exerciseCards = page.locator('[class*="bg-neutral-900"]');
    await expect(exerciseCards.first()).toBeVisible();
  });

  test('6.8 - has working back button', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    
    const backLink = page.getByRole('link', { name: /volver a la rutina/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    
    await expect(page).toHaveURL(/\/rutinas\/.+/);
  });

  test('6.10 - URL contains correct IDs', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}/dias/${ids.dia1Id}`);
    
    await expect(page).toHaveURL(new RegExp(ids.rutinaFullBodyId));
    await expect(page).toHaveURL(new RegExp(ids.dia1Id));
  });
});

// ============================================
// Phase 6.11-6.14: Navigation from Routine to Day
// ============================================

test.describe('Navigation - Routine to Day', () => {
  test('6.11 - can navigate from routine detail to day detail', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}`);
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    await page.getByText(ids.dia1Nombre).click();
    
    await expect(page).toHaveURL(/\/rutinas\/.+\/dias\/.+/);
    await expect(page.getByText(ids.dia1Nombre)).toBeVisible();
  });

  test('6.12 - day cards show exercise count', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}`);
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    await expect(page.locator('text=/\\d+ ejercicios/').first()).toBeVisible();
  });

  test('6.13 - day cards show hover effect', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}`);
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    const dayCard = page.locator('a[href*="/dias/"]').first();
    await dayCard.hover();
    
    await expect(dayCard).toHaveCSS('cursor', 'pointer');
  });

  test('6.14 - shows preview of exercises', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}`);
    await expect(page.getByText('Full Body')).toBeVisible({ timeout: 10000 });
    
    // Look for exercise preview in the day card - look for the exercise count or preview list
    // Either shows "X ejercicios" or shows exercise names
    const exercisePreview = page.locator('ul').first();
    await expect(exercisePreview).toBeVisible();
  });
});

// ============================================
// Phase 6.15-6.16: Edge Cases
// ============================================

test.describe('Day Detail Edge Cases', () => {
  test('6.15 - handles 404 for non-existent day gracefully', async ({ page }) => {
    const ids = await getRoutineIds(page);
    await page.goto(`/rutinas/${ids.rutinaFullBodyId}/dias/00000000-0000-0000-0000-000000000000`);
    await page.waitForTimeout(1000);
  });
});
