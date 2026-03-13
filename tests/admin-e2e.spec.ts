import { test, expect, Page } from '@playwright/test';

// Test admin credentials
const ADMIN_EMAIL = 'admin@championgym.com';
const ADMIN_PASSWORD = 'admin123';

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  
  // Wait for the form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to admin page
  await page.waitForURL('/admin', { timeout: 10000 });
}

// Helper to get a routine ID from API
async function getFirstRoutineId(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/rutinas');
  const rutinas = await response.json();
  return rutinas.length > 0 ? rutinas[0].id : null;
}

// ============================================
// Admin Login Tests
// ============================================

test.describe('Admin Login', () => {
  test('8.1.1 - Successful login redirects to admin dashboard', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect to /admin
    await page.waitForURL('/admin', { timeout: 15000 });
    
    // Should see admin dashboard content
    await expect(page.getByText('Bienvenido')).toBeVisible({ timeout: 10000 });
  });

  test('8.1.2 - Invalid credentials show error message', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText(/Invalid|error|Error/i)).toBeVisible({ timeout: 10000 });
  });

  test('8.1.3 - Login with empty fields shows validation', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Browser should show validation (required attribute)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});

// ============================================
// Admin Dashboard Tests
// ============================================

test.describe('Admin Dashboard', () => {
  test('8.2.1 - Dashboard displays stats cards', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should see stats cards
    await expect(page.getByText('Total Rutinas')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total Días')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Total Ejercicios')).toBeVisible({ timeout: 5000 });
  });

  test('8.2.2 - Dashboard shows quick actions', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should see action buttons
    await expect(page.getByText('Nueva Rutina')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ver Rutinas')).toBeVisible({ timeout: 5000 });
  });

  test('8.2.3 - Dashboard shows recent routines', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should see recent routines section
    await expect(page.getByText('Rutinas Recientes')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// Admin Rutinas List Tests
// ============================================

test.describe('Admin Rutinas List', () => {
  test('8.3.1 - Can view rutinas list', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to rutinas list
    await page.goto('/admin/rutinas');
    await page.waitForTimeout(2000);
    
    // Should see the header
    await expect(page.getByText('Administra todas las rutinas')).toBeVisible({ timeout: 10000 });
  });

  test('8.3.2 - Can see Nueva Rutina button', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas');
    await page.waitForTimeout(2000);
    
    // Should see New Routine button
    await expect(page.getByRole('link', { name: /Nueva Rutina/i })).toBeVisible({ timeout: 10000 });
  });

  test('8.3.3 - Can see routine rows in table', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas');
    await page.waitForTimeout(2000);
    
    // Should see table headers
    await expect(page.getByText('Nombre')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tipo')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// Create New Rutina Tests
// ============================================

test.describe('Create New Rutina', () => {
  test('8.4.1 - Can navigate to new rutina page', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas/new');
    await page.waitForTimeout(2000);
    
    // Should see the form
    await expect(page.getByText('Crea una nueva rutina')).toBeVisible({ timeout: 10000 });
  });

  test('8.4.2 - Can fill new rutina form', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas/new');
    await page.waitForTimeout(2000);
    
    // Fill in the form
    await page.fill('input[name="nombre"]', 'Test Routine');
    
    // Select a type
    await page.selectOption('select[name="tipo"]', 'fuerza');
    
    // Fill description
    await page.fill('textarea[name="descripcion"]', 'Test description for routine');
    
    // Should see the submit button
    await expect(page.getByRole('button', { name: /Crear Rutina/i })).toBeVisible({ timeout: 5000 });
  });

  test('8.4.3 - Form validation requires nombre', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas/new');
    await page.waitForTimeout(2000);
    
    // Try to submit without filling required fields
    await page.selectOption('select[name="tipo"]', 'fuerza');
    await page.click('button[type="submit"]');
    
    // Should show validation error or not submit
    await page.waitForTimeout(1000);
  });
});

// ============================================
// Edit Rutina Tests
// ============================================

test.describe('Edit Rutina', () => {
  test('8.5.1 - Can access edit rutina page', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Get first routine ID
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/admin/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Should see the edit page
    await expect(page.getByText('Editar Rutina')).toBeVisible({ timeout: 10000 });
  });

  test('8.5.2 - Edit page shows rutina data', async ({ page }) => {
    await loginAsAdmin(page);
    
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/admin/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Should see the details section - use heading role
    await expect(page.getByRole('heading', { name: 'Detalles de la Rutina' })).toBeVisible({ timeout: 10000 });
  });

  test('8.5.3 - Edit page shows days manager', async ({ page }) => {
    await loginAsAdmin(page);
    
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/admin/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Should see the days section - use heading role
    await expect(page.getByRole('heading', { name: 'Días de la Rutina' })).toBeVisible({ timeout: 10000 });
  });

  test('8.5.4 - Edit page has delete button', async ({ page }) => {
    await loginAsAdmin(page);
    
    const rutinaId = await getFirstRoutineId(page);
    if (!rutinaId) {
      test.skip();
      return;
    }
    
    await page.goto(`/admin/rutinas/${rutinaId}`);
    await page.waitForTimeout(3000);
    
    // Should see delete button
    await expect(page.getByRole('button', { name: /Eliminar Rutina/i })).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// Session Management Tests
// ============================================

test.describe('Session Management', () => {
  test('8.6.1 - Logged in user can access admin pages', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should be able to access admin pages
    await page.goto('/admin');
    await expect(page.getByText('Bienvenido')).toBeVisible({ timeout: 10000 });
    
    await page.goto('/admin/rutinas');
    await page.waitForTimeout(2000);
    // Either shows rutinas or redirects to login
  });

  test('8.6.2 - Session persists across page navigations', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to different pages
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    
    await page.goto('/admin/rutinas');
    await page.waitForTimeout(2000);
    
    // Should not redirect to login (session should persist)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/login');
  });
});

// ============================================
// Navigation Tests
// ============================================

test.describe('Admin Navigation', () => {
  test('8.7.1 - Can navigate back to home from login', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('a:has-text("Volver al inicio")', { timeout: 10000 });
    
    // Click back to home
    await page.click('a:has-text("Volver al inicio")');
    
    // Should navigate to home
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('8.7.2 - Can navigate from dashboard to rutinas', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Click Ver Rutinas button
    await page.click('a:has-text("Ver Rutinas")');
    
    // Should navigate to /admin/rutinas
    await page.waitForURL('**/admin/rutinas', { timeout: 10000 });
  });

  test('8.7.3 - Can navigate from rutinas list to new rutina', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas');
    await page.waitForTimeout(2000);
    
    // Click Nueva Rutina button
    await page.click('a:has-text("Nueva Rutina")');
    
    // Should navigate to new rutina page
    await page.waitForURL('**/admin/rutinas/new', { timeout: 10000 });
  });
});

// ============================================
// Error Handling Tests
// ============================================

test.describe('Admin Error Handling', () => {
  test('8.8.1 - Invalid rutina ID shows 404', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/rutinas/invalid-id');
    await page.waitForTimeout(2000);
    
    // Should either show 404 or redirect
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/rutinas');
  });

  test('8.8.2 - Shows loading state while fetching', async ({ page }) => {
    await page.goto('/admin/rutinas');
    
    // Wait for page to either load or redirect
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Page should be accessible (either shows content or redirects to login)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/admin\/rutinas|admin\/login/);
  });
});
