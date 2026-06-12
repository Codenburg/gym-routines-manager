(async () => {
  const response = await fetch('http://localhost:3000/api/rutinas');
  const result = await response.json();
  const fb = result.data.find((r: any) => r.nombre.includes('Full Body') && !r.nombre.includes('Ligero'));
  console.log(`Full Body ID: ${fb.id}`);
  console.log(`Full Body: ${fb.nombre}, Tipo: ${fb.tipo}`);
  
  // Now check the rendered page
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(`http://localhost:3000/rutinas/${fb.id}`);
  await page.waitForLoadState('networkidle');
  
  // Check for type text
  const body = page.locator('body');
  const text = await body.textContent();
  console.log(`\nPage contains "Fuerza": ${text?.includes('Fuerza')}`);
  console.log(`Page contains "tipo": ${text?.includes('tipo')}`);
  
  // Look for specific elements
  const tipoElement = page.locator('[class*="tipo"]');
  const count = await tipoElement.count();
  console.log(`Elements with "tipo" in class: ${count}`);
  
  // Check for badges
  const badges = page.locator('[class*="badge"]');
  const badgeCount = await badges.count();
  console.log(`Badge elements: ${badgeCount}`);
  if (badgeCount > 0) {
    console.log(`Badge texts: ${await badges.allTextContents()}`);
  }
  
  await browser.close();
})();
