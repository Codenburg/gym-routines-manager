import { chromium } from '@playwright/test';

async function checkPage() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input[id="dni"]', '11111111');
  await page.fill('input[id="password"]', 'nando123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 15000 });
  
  const body = page.locator('body');
  const text = await body.textContent();
  
  console.log('Has "Panel de administrador":', text?.includes('Panel de administrador'));
  console.log('Has "Panel de Administración":', text?.includes('Panel de Administración'));
  console.log('Has "Bienvenido":', text?.includes('Bienvenido'));
  
  // Get visible headings
  const headings = page.locator('h1, h2');
  const headingTexts = await headings.allTextContents();
  console.log('Headings:', headingTexts);
  
  await browser.close();
}

checkPage();
