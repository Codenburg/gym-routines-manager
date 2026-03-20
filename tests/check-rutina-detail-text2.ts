import { chromium } from '@playwright/test';

async function checkPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Get Full Body rutina specifically
  const response = await page.request.get('http://localhost:3000/api/rutinas');
  const result = await response.json();
  const rutinas = result.data;
  const fullBodyRutina = rutinas.find((r: any) => r.nombre.includes('Full Body'));
  
  if (!fullBodyRutina) {
    console.log('No Full Body routine found');
    console.log('Available routines:', rutinas.map((r: any) => r.nombre));
    await browser.close();
    return;
  }
  
  console.log('Checking rutina:', fullBodyRutina.nombre, 'type:', fullBodyRutina.tipo);
  
  await page.goto(`http://localhost:3000/rutinas/${fullBodyRutina.id}`);
  await page.waitForLoadState('networkidle');
  
  // Get body text
  const body = page.locator('body');
  const text = await body.textContent();
  
  console.log('\n=== Checking for expected texts ===');
  console.log('Has "Fuerza":', text?.includes('Fuerza'));
  console.log('Has "Cardio":', text?.includes('Cardio'));
  console.log('Has "Funcional":', text?.includes('Funcional'));
  console.log('Has routine nombre:', text?.includes(fullBodyRutina.nombre.split(' - ')[0]));
  console.log('Has routine tipo:', text?.includes(fullBodyRutina.tipo));
  
  // Check what h1 or main heading contains
  const h1 = page.locator('h1').first();
  if (await h1.isVisible()) {
    console.log('\nH1 text:', await h1.textContent());
  }
  
  // Look for any type indicator
  const cards = page.locator('[class*="card"]');
  const cardCount = await cards.count();
  console.log('\nCard count:', cardCount);
  
  await browser.close();
}

checkPage();
