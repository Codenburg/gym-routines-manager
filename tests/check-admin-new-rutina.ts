import { chromium } from '@playwright/test';

async function checkPage() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login first
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input[id="dni"]', '11111111');
  await page.fill('input[id="password"]', 'nando123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 15000 });
  
  // Navigate to new rutina
  console.log('Logged in, URL:', page.url());
  await page.goto('http://localhost:3000/admin/rutinas/new');
  await page.waitForLoadState('networkidle');
  
  const body = page.locator('body');
  const text = await body.textContent();
  
  console.log('\n=== Page text contains ===');
  console.log('Has "Crea":', text?.includes('Crea'));
  console.log('Has "Nueva":', text?.includes('Nueva'));
  console.log('Has "rutina":', text?.includes('rutina'));
  console.log('Has "Nueva rutina":', text?.includes('Nueva rutina'));
  console.log('Has "Crear":', text?.includes('Crear'));
  
  // Get h1
  const h1 = page.locator('h1').first();
  if (await h1.isVisible()) {
    console.log('\nH1:', await h1.textContent());
  }
  
  // Get all headings
  const headings = page.locator('h1, h2, h3');
  const headingTexts = await headings.allTextContents();
  console.log('All headings:', headingTexts);
  
  await browser.close();
}

checkPage();
