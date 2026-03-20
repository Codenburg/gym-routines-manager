import { chromium } from '@playwright/test';

async function debugBrowserLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
  });

  try {
    console.log('=== Navigating to login ===');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    console.log('Current URL:', page.url());
    
    console.log('\n=== Filling credentials ===');
    await page.fill('input[id="dni"]', '11111111');
    await page.fill('input[id="password"]', 'nando123');
    
    console.log('\n=== Clicking submit ===');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    console.log('\n=== Waiting for navigation ===');
    try {
      await page.waitForURL('**/admin', { timeout: 10000 });
      console.log('SUCCESS: Redirected to', page.url());
    } catch (e: any) {
      console.log('Navigation timeout. Current URL:', page.url());
      
      // Check page content for clues
      const content = await page.content();
      if (content.includes('Incorrectos')) {
        console.log('Error: Invalid credentials message shown');
      }
      if (content.includes('error')) {
        console.log('Page contains error text');
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

debugBrowserLogin();
