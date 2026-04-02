import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:3004');
  await page.waitForTimeout(2000);
  console.log("Clicking the desktop sidebar Video Stories bar...");
  const elems = await page.$$('.desktop-sidebar .nav-links li');
  if(elems.length >= 2) {
      await elems[1].click();
  } else {
      console.log("No bottom nav");
  }
  await page.waitForTimeout(2000);
  
  const innerHTML = await page.evaluate(() => {
    const r = document.querySelector('.reels-container');
    return r ? r.innerHTML : "NO_REELS_CONTAINER";
  });
  console.log('Result:', innerHTML ? innerHTML.substring(0, 200) : "NULL");
  await page.screenshot({ path: 'screenshot3.png' });
  await browser.close();
})();
