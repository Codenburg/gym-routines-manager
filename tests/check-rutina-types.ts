/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium } from '@playwright/test';

async function checkPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Get a Fuerza type rutina
  const response = await page.request.get('http://localhost:3000/api/rutinas');
  const result = await response.json();
  const rutinas = result.data;
  const fuerzaRutina = rutinas.find((r: any) => r.tipo === 'Fuerza');
  
  if (!fuerzaRutina) {
    console.log('No Fuerza routine found');
    await browser.close();
    return;
  }
  
  console.log('Checking rutina:', fuerzaRutina.nombre, 'type:', fuerzaRutina.tipo);
  
  await page.goto(`http://localhost:3000/rutinas/${fuerzaRutina.id}`);
  await page.waitForLoadState('networkidle');
  
  const body = page.locator('body');
  const text = await body.textContent();
  
  console.log('\n=== Does page contain type text? ===');
  console.log('Has "Fuerza":', text?.includes('Fuerza'));
  
  // Take snapshot of the page structure
  const main = page.locator('main');
  const mainHtml = await main.innerHTML();
  
  // Look for class containing 'tipo'
  const tipoMatch = mainHtml.match(/class="[^"]*tipo[^"]*"/i) || mainHtml.match(/class="[^"]*badge[^"]*"/i);
  console.log('\nTipo element found:', tipoMatch ? tipoMatch[0] : 'none');
  
  // Check if there's a span with the type
  const spans = page.locator('span');
  const spanTexts = await spans.allTextContents();
  const tipoSpan = spanTexts.find(t => ['fuerza', 'cardio', 'flexibilidad', 'hipertrofia'].includes(t));
  console.log('Span with type found:', tipoSpan || 'none');
  
  await browser.close();
}

checkPage();
