import { chromium } from '@playwright/test';

async function debugLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[Page Error]: ${err.message}`);
  });
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');
    console.log('Login page loaded');
    
    console.log('Filling credentials...');
    await page.fill('input[id="dni"]', '11111111');
    await page.fill('input[id="password"]', 'nando123');
    
    console.log('Clicking submit...');
    await page.click('button[type="submit"]');
    
    // Wait a bit for any response
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    // Check for toast/error messages
    const toast = page.locator('[class*="toast"]');
    if (await toast.isVisible()) {
      console.log('Toast visible:', await toast.textContent());
    }
    
    // Check page content
    const content = await page.content();
    if (content.includes('Incorrectos') || content.includes('error')) {
      console.log('Error message found in page');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

debugLogin();
