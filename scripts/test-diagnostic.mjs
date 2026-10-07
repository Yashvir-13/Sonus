// Diagnostic exploratory script for Challenger M4-2
import { chromium } from 'playwright';

async function diagnose() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[PAGEERROR] ${err.message}`);
  });

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Current URL:', page.url());
  const title = await page.title();
  console.log('Title:', title);

  await browser.close();
}

diagnose().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
