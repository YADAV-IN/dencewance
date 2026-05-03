const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  try {
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
    console.log('SUCCESS');
  } catch (e) {
    console.log('NAY:', e.message);
  }
  await browser.close();
  process.exit(0);
})();
