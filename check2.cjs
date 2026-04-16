const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure().errorText));
  
  // Starting a local file server
  const { exec } = require('child_process');
  const server = exec('npx serve dist -s -p 5000');
  
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
    const body = await page.evaluate(() => document.body.innerHTML);
    if (!body.includes('root') && !body.includes('social-app')) {
      console.log("Body doesn't look right, length:", body.length);
    }
    console.log('Page body length:', body.length);
    console.log('Page content contains PYQ:', body.includes('PYQ'));
  } catch (e) {
    console.log('Error loading page:', e.message);
  }
  
  await browser.close();
  server.kill();
})();
