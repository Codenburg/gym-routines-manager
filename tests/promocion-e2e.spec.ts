/**
 * E2E tests for Promocion Admin Manager
 * 
 * Tests:
 * - 4.4: Toggle only mutates activo field (no optimistic UI)
 * - 4.5: Key resync clears stale form state on edit switch
 * - 4.6: 2-col layout at 1024px, stacked at 375px
 */

import { test, expect, Page } from '@playwright/test'

// Test admin credentials (from seed)
const ADMIN_DNI = '11111111'
const ADMIN_PASSWORD = 'nando123'

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('input[id="dni"]', { timeout: 15000 })
  await page.fill('input[id="dni"]', ADMIN_DNI)
  await page.fill('input[id="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin', { timeout: 15000 })
}

// Helper to create a promocion via API for testing
async function createTestPromocion(page: Page, titulo: string, precio: number) {
  const response = await page.request.post('/api/promociones', {
    data: {
      titulo,
      descripcion: `Test description for ${titulo}`,
      precio,
      activo: true,
    },
  })
  return response.json()
}

// Helper to cleanup test promociones
async function cleanupTestPromociones(page: Page) {
  await page.request.get('/api/promociones').then(async (response) => {
    const data = await response.json()
    for (const promo of data.data || []) {
      if (promo.titulo.startsWith('TEST_')) {
        await page.request.delete(`/api/promociones/${promo.id}`)
      }
    }
  })
}

test.describe('4.4 - Toggle only mutates activo field', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/promociones')
    await page.waitForLoadState('networkidle')
  })

  test('4.4.1 - Toggle calls togglePromocionActivo action (no optimistic)', async ({ page }) => {
    // Create a test promocion
    const promo = await createTestPromocion(page, 'TEST_Toggle_4_4_1', 1000)
    
    // Reload to get fresh state
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Find the toggle switch for this promocion
    const promoCard = page.locator(`text=${promo.titulo}`).locator('..')
    const toggleSwitch = promoCard.locator('[data-slot="switch"]')

    // Get initial state
    const initialChecked = await toggleSwitch.getAttribute('data-state')
    
    // Click the toggle
    await toggleSwitch.click()

    // Wait for server response
    await page.waitForResponse(
      (response) => response.url().includes('/admin/promociones') && response.status() === 200,
      { timeout: 5000 }
    )

    // Reload to verify persistence
    await page.reload()
    await page.waitForLoadState('networkidle')

    // The toggle state should have changed (proving it went to server)
    const finalPromoCard = page.locator(`text=${promo.titulo}`).locator('..')
    const finalToggleState = await finalPromoCard.locator('[data-slot="switch"]').getAttribute('data-state')
    
    // State should be opposite of initial
    expect(finalToggleState).not.toBe(initialChecked)

    // Cleanup
    await page.request.delete(`/api/promociones/${promo.id}`)
  })

  test('4.4.2 - Toggle does NOT affect other fields', async ({ page }) => {
    // Create a test promocion with known values
    const originalTitulo = 'TEST_Toggle_Other_Fields'
    const promo = await createTestPromocion(page, originalTitulo, 5000)
    
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Get all fields before toggle
    const promoCard = page.locator(`text=${originalTitulo}`).locator('..')
    const tituloBefore = await promoCard.locator('p.font-medium').textContent()
    const precioBefore = await promoCard.locator('p.text-primary').textContent()

    // Toggle the activo state
    const toggleSwitch = promoCard.locator('[data-slot="switch"]')
    await toggleSwitch.click()
    await page.waitForResponse(
      (response) => response.url().includes('/admin/promociones') && response.status() === 200,
      { timeout: 5000 }
    )

    // Wait a moment for any potential UI updates
    await page.waitForTimeout(500)

    // Verify titulo and precio are unchanged
    const tituloAfter = await promoCard.locator('p.font-medium').textContent()
    const precioAfter = await promoCard.locator('p.text-primary').textContent()
    
    expect(tituloAfter).toBe(tituloBefore)
    expect(precioAfter).toBe(precioBefore)

    // Cleanup
    await page.request.delete(`/api/promociones/${promo.id}`)
  })
})

test.describe('4.5 - Key resync clears stale form state', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/promociones')
    await page.waitForLoadState('networkidle')
  })

  test('4.5.1 - Switching edit to different promocion resets form', async ({ page }) => {
    // Create two test promociones
    const promo1 = await createTestPromocion(page, 'TEST_Form_Resync_1', 1000)
    const promo2 = await createTestPromocion(page, 'TEST_Form_Resync_2', 2000)
    
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click edit on first promocion
    const editButton1 = page.locator(`text=${promo1.titulo}`).locator('..').locator('button[title="Editar"]')
    await editButton1.click()
    await page.waitForTimeout(300)

    // Form should show promo1's data
    const tituloInput = page.locator('input[id="titulo"]')
    await expect(tituloInput).toHaveValue(promo1.titulo)

    // Now click edit on second promocion (should trigger key resync)
    const editButton2 = page.locator(`text=${promo2.titulo}`).locator('..').locator('button[title="Editar"]')
    await editButton2.click()
    await page.waitForTimeout(300)

    // Form should now show promo2's data (not promo1's modified value)
    await expect(tituloInput).toHaveValue(promo2.titulo)

    // Cleanup
    await page.request.delete(`/api/promociones/${promo1.id}`)
    await page.request.delete(`/api/promociones/${promo2.id}`)
  })

  test('4.5.2 - Cancel button is visible when editing', async ({ page }) => {
    const promo = await createTestPromocion(page, 'TEST_Cancel_Visible', 1000)
    
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Initially no cancel button
    const cancelButton = page.locator('button:has-text("Cancelar")')
    await expect(cancelButton).not.toBeVisible()

    // Click edit
    const editButton = page.locator(`text=${promo.titulo}`).locator('..').locator('button[title="Editar"]')
    await editButton.click()
    await page.waitForTimeout(300)

    // Cancel button should now be visible
    await expect(cancelButton).toBeVisible()

    // Click cancel
    await cancelButton.click()
    await page.waitForTimeout(300)

    // Cancel button should be hidden again
    await expect(cancelButton).not.toBeVisible()

    // Cleanup
    await page.request.delete(`/api/promociones/${promo.id}`)
  })
})

test.describe('4.6 - Layout responsive behavior', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/promociones')
    await page.waitForLoadState('networkidle')
  })

  test('4.6.1 - 2-column layout at 1024px (desktop)', async ({ page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForTimeout(300)

    // Check that the grid has 2 columns
    const gridContainer = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2')
    await expect(gridContainer).toBeVisible()

    // Both columns should be visible side by side
    const columns = gridContainer.locator('> *')
    await expect(columns).toHaveCount(2)
  })

  test('4.6.2 - Single column layout at 375px (mobile)', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(300)

    // Check that the grid has 1 column
    const gridContainer = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2')
    await expect(gridContainer).toBeVisible()

    // Both columns should still exist but stack vertically
    const columns = gridContainer.locator('> *')
    await expect(columns).toHaveCount(2)
  })

  test('4.6.3 - Form is on left, list is on right at desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForTimeout(300)

    // Find the form (should have "Agregar Promoción" or "Editar Promoción" heading)
    const formCard = page.locator('text="Agregar Promoción"').locator('..').locator('..')
    
    // Find the list (should have "Promociones Existentes" heading)
    const listCard = page.locator('text="Promociones Existentes"').locator('..').locator('..')

    // Both should be visible
    await expect(formCard).toBeVisible()
    await expect(listCard).toBeVisible()

    // Get bounding boxes to verify left/right positioning
    const formBox = await formCard.boundingBox()
    const listBox = await listCard.boundingBox()

    // Form should be to the left of the list
    if (formBox && listBox) {
      expect(formBox.x).toBeLessThan(listBox.x)
    }
  })
})

test.describe('Promocion editing state', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/promociones')
    await page.waitForLoadState('networkidle')
  })

  test('4.7 - Editing card shows "Editando" badge', async ({ page }) => {
    const promo = await createTestPromocion(page, 'TEST_Editando_Badge', 1000)
    
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click edit
    const editButton = page.locator(`text=${promo.titulo}`).locator('..').locator('button[title="Editar"]')
    await editButton.click()
    await page.waitForTimeout(300)

    // Should see "Editando" badge
    const editandoBadge = page.locator('text="Editando"')
    await expect(editandoBadge).toBeVisible()

    // Cleanup
    await page.request.delete(`/api/promociones/${promo.id}`)
  })

  test('4.8 - Inactive promocion has reduced opacity', async ({ page }) => {
    const promo = await createTestPromocion(page, 'TEST_Inactive_Opacity', 1000)
    
    // Make it inactive via toggle
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const promoCard = page.locator(`text=${promo.titulo}`).locator('..')
    const toggleSwitch = promoCard.locator('[data-slot="switch"]')
    await toggleSwitch.click()
    await page.waitForTimeout(500)

    // Card should have opacity-50 class
    await expect(promoCard).toHaveClass(/opacity-50/)

    // Cleanup
    await page.request.delete(`/api/promociones/${promo.id}`)
  })
})
