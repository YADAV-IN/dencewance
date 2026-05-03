import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3004');
  await page.waitForTimeout(2000);
  
  // Click on the second button in mobile-bottom-nav which is 'stories'
  await page.click('.mobile-bottom-nav button:nth-child(2)');
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
