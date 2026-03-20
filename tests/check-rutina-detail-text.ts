import { chromium } from '@playwright/test';

async function checkPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Get first rutina ID
  const response = await page.request.get('http://localhost:3000/api/rutinas');
  const result = await response.json();
  const rutinas = result.data;
  const rutinaId = rutinas[0].id;
  
  console.log('Checking rutina detail page for:', rutinaId);
  
  await page.goto(`http://localhost:3000/rutinas/${rutinaId}`);
  await page.waitForLoadState('networkidle');
  
  // Get all visible text
  const body = await page.locator('body');
  const text = await body.textContent();
  
  console.log('\n=== Page contains these texts ===');
  console.log('Has "Fuerza":', text?.includes('Fuerza'));
  console.log('Has "Cardio":', text?.includes('Cardio'));
  console.log('Has "Funcional":', text?.includes('Funcional'));
  console.log('Has "completa":', text?.includes('completa'));
  console.log('Has "Full Body":', text?.includes('Full Body'));
  console.log('Has "Día":', text?.includes('Día'));
  
  // Look for type badge
  const tipoBadge = page.locator('[class*="tipo"], [class*="badge"], [class*="tag"]');
  const count = await tipoBadge.count();
  console.log('\nTipo badge count:', count);
  if (count > 0) {
    console.log('Badge texts:', await tipoBadge.allTextContents());
  }
  
  await browser.close();
}

checkPage();
