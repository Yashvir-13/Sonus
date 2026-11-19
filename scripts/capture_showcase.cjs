const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../apps/web/dist');
const SCREENS_DIR = path.resolve(__dirname, '../docs/assets/screens');
const PORT = 4173;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function startServer() {
  const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, cleanUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback
    const indexHtml = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexHtml).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function capture() {
  const server = await startServer();
  fs.mkdirSync(SCREENS_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\yashv\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('1. Capturing Landing Page Hero...');
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '01-landing-page-hero.png'), fullPage: false });

  console.log('2. Capturing Practice Studio (Piano - Alabaster)...');
  await page.goto(`http://127.0.0.1:${PORT}/practice/waltz-no-2`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SCREENS_DIR, '02-practice-studio-piano-alabaster.png') });

  console.log('3. Capturing Studio Setup Menu Popover...');
  const setupBtn = page.locator('[data-testid="studio-setup-toggle-btn"]');
  if (await setupBtn.count() > 0) {
    await setupBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENS_DIR, '04-studio-setup-popover.png') });
  }

  console.log('4. Capturing Piano Waterfall Mode...');
  const fallingKeysBtn = page.getByRole('button', { name: /Falling Keys/i });
  if (await fallingKeysBtn.count() > 0) {
    await fallingKeysBtn.click();
    await page.waitForTimeout(800);
  }
  // Click outside to close setup menu if open
  await page.mouse.click(200, 200);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENS_DIR, '05-waterfall-falling-keys.png') });

  console.log('5. Capturing Practice Studio (Guitar - Obsidian Dark)...');
  await page.goto(`http://127.0.0.1:${PORT}/practice/house-of-the-rising-sun`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SCREENS_DIR, '03-practice-studio-guitar-obsidian.png') });

  console.log('6. Capturing Acoustic Guitar Tuner...');
  await page.goto(`http://127.0.0.1:${PORT}/tuner`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '06-acoustic-guitar-tuner.png') });

  console.log('7. Capturing Chords & Scales Compendium...');
  await page.goto(`http://127.0.0.1:${PORT}/chords-and-scales`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '07-chords-scales-compendium.png') });

  console.log('8. Capturing Progress & Cognitive Dashboard...');
  await page.goto(`http://127.0.0.1:${PORT}/progress`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '08-progress-cognitive-dashboard.png') });

  console.log('9. Capturing Peer Comparison & Benchmarks...');
  await page.goto(`http://127.0.0.1:${PORT}/community`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '09-peer-benchmarks.png') });

  await browser.close();
  server.close();
  console.log('All 9 screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
