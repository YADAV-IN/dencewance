const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  const { exec } = require('child_process');
  const server = exec('npx serve dist -s -p 5000');
  
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    await page.goto('http://localhost:5000', { waitUntil: 'load' });
    const rootHasChildren = await page.evaluate(() => document.getElementById('root').children.length > 0);
    console.log('ROOT MOUNTED:', rootHasChildren);
    const body = await page.evaluate(() => document.body.innerHTML);
    if (!rootHasChildren) {
       console.log('ROOT HTML:', body.substring(0, 1000));
    }
  } catch (e) {
    console.log('Error loading page:', e.message);
  }
  
  await browser.close();
  server.kill();
  process.exit(0);
})();
