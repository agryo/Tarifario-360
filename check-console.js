const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Navigate to orcamento-oficial to check for errors
    await page.goto('http://localhost:4200/orcamento-oficial', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Navigate to orcamento-rapido
    await page.goto('http://localhost:4200/orcamento-rapido', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Navigate to painel-master
    await page.goto('http://localhost:4200/painel-master', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

  } catch (e) {
    errors.push('Navigation error: ' + e.message);
  }

  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(e));
  console.log('=== WARNINGS ===');
  warnings.forEach(w => console.log(w));

  await browser.close();
})();