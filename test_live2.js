import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
      // ignore verbose logs 
      if(msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
      else console.log('PAGE LOG:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE EXCEPTION:', err.message));
  
  await page.goto('http://localhost:3004');
  await page.waitForTimeout(2000);
  await page.click('.stories-container .story'); // click first story
  await page.waitForTimeout(1000);
  await browser.close();
})();
