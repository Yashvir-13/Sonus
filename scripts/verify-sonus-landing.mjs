import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from '../apps/web/node_modules/vite/dist/node/index.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(rootDir, 'apps', 'web');
const screenshotsDir = path.join(rootDir, '.agents', 'teamwork', 'verification_screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

console.log('================================================================');
console.log('SONUS LANDING SCREEN PLAYWRIGHT E2E & VISUAL TEST SUITE');
console.log('================================================================\n');

const viteServer = await createServer({
  root: webDir,
  configFile: path.join(webDir, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
});

await viteServer.listen();
const browser = await chromium.launch({ headless: true });

const consoleErrors = [];
const pageErrors = [];

try {
  const baseUrl = viteServer.resolvedUrls?.local[0];
  assert.ok(baseUrl, 'Vite should expose a local development URL');

  // --- Suite 1: Full Interactive Landing Verification ---
  console.log('--- Suite 1: Full Interactive Landing Verification ---');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error(`[Console Error]: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error(`[Page Error]: ${err.message}`);
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Editorial Branding & Zero Radius Layout
  console.log('1. Checking Sonus masthead and editorial layout...');
  assert.equal(await page.getByRole('heading', { name: 'Practice with a clearer ear.' }).count(), 1);
  assert.ok(await page.getByText('Sonus', { exact: true }).count() >= 1);
  assert.ok(await page.getByText('Adaptive practice system').count() >= 1);
  assert.equal(await page.getByText('Save your practice history.').count(), 1);

  // 2. Animated Ink Clouds with Organic SVG Turbulence
  console.log('2. Checking animated ink clouds elements and SVG filters...');
  const inkClouds = page.getByTestId('ink-clouds-container');
  assert.equal(await inkClouds.count(), 1, 'Ink clouds container must exist');
  
  const crimsonFilter = await page.$('filter#sonus-ink-crimson-filter');
  assert.ok(crimsonFilter, 'filter#sonus-ink-crimson-filter must exist');
  const crimsonTurb = await page.$('filter#sonus-ink-crimson-filter feTurbulence');
  assert.ok(crimsonTurb, 'feTurbulence primitive must exist in crimson ink filter');
  const crimsonDisp = await page.$('filter#sonus-ink-crimson-filter feDisplacementMap');
  assert.ok(crimsonDisp, 'feDisplacementMap primitive must exist in crimson ink filter');

  const charcoalFilter = await page.$('filter#sonus-ink-charcoal-filter');
  assert.ok(charcoalFilter, 'filter#sonus-ink-charcoal-filter must exist');
  const charcoalTurb = await page.$('filter#sonus-ink-charcoal-filter feTurbulence');
  assert.ok(charcoalTurb, 'feTurbulence primitive must exist in charcoal ink filter');
  const charcoalDisp = await page.$('filter#sonus-ink-charcoal-filter feDisplacementMap');
  assert.ok(charcoalDisp, 'feDisplacementMap primitive must exist in charcoal ink filter');

  // 3. Listening Window: Visual Preview & Disclaimers
  console.log('3. Checking visual preview clarifications and sample diagnostic label...');
  const listeningWindow = page.getByTestId('listening-window');
  assert.equal(await listeningWindow.count(), 1);

  // Disclaimers verify that this is a preview without microphone access
  assert.ok(
    await listeningWindow.getByText(/visual preview · simulated pitch input/i).count() >= 1,
    'Top bar must specify visual preview and simulated input',
  );
  assert.ok(
    await listeningWindow.getByText(/visual demonstration · microphone inactive/i).count() >= 1,
    'Window must include clear demonstration disclaimer',
  );
  assert.ok(
    await page.getByText(/visual preview only · no microphone capture required/i).count() >= 1,
    'Footnote must specify no microphone capture required',
  );

  // Initial button name: "Preview a listening check"
  const previewBtn = page.getByRole('button', { name: 'Preview a listening check' });
  assert.equal(await previewBtn.count(), 1, 'CTA button must be named "Preview a listening check"');

  // Initial diagnostic label and state
  const sampleDiagLabel = listeningWindow.getByText('Sample diagnostic', { exact: true });
  assert.equal(await sampleDiagLabel.count(), 1, 'Diagnostic section must be labelled "Sample diagnostic"');
  assert.equal(await listeningWindow.getByText('Awaiting preview signal').count(), 1);

  // Capture Screenshot 1: Initial Landing Page
  const screenshot1 = path.join(screenshotsDir, '01_sonus_landing_initial.png');
  await page.screenshot({ path: screenshot1, fullPage: true });
  console.log(`[Screenshot Captured]: ${screenshot1}`);

  // 4. Interactive Pitch Trace Activation
  console.log('4. Testing interactive pitch trace activation...');
  await previewBtn.click();
  await listeningWindow.getByText(/listening for a sustained note/i).waitFor();

  // Explicit sample diagnostic reading
  assert.equal(await page.getByText('A4 +14¢').count(), 1);
  assert.ok(await listeningWindow.getByText(/settling sharp/i).count() >= 1);

  // Button transitions to replay/active state
  const replayBtn = page.getByRole('button', { name: 'Preview active · Replay check' });
  assert.equal(await replayBtn.count(), 1, 'Button text reflects active preview');

  // Capture Screenshot 2: Active Preview with Animated Pitch Trace
  const screenshot2 = path.join(screenshotsDir, '02_sonus_landing_preview_active.png');
  await page.waitForTimeout(400);
  await page.screenshot({ path: screenshot2, fullPage: true });
  console.log(`[Screenshot Captured]: ${screenshot2}`);

  // Also save to os.tmpdir() for quick inspection
  await page.screenshot({ path: path.join(os.tmpdir(), 'sonus-landing-preview.png'), fullPage: true });

  // Re-clicking replay check retains active diagnostic
  await replayBtn.click();
  assert.equal(await page.getByText('A4 +14¢').count(), 1);

  // 5. Guest Practice Stand Navigation & Return
  console.log('5. Testing guest practice entry and return...');
  const guestBtn = page.getByRole('button', { name: 'Open the practice stand as guest' });
  assert.equal(await guestBtn.count(), 1);
  await guestBtn.click();

  // Verify navigation to Practice Stand (0, 0)
  await page.getByText(/stand \(0, 0\)/i).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Exit Guest Mode' }).count(), 1);

  // Return to landing page
  await page.getByRole('button', { name: 'Exit Guest Mode' }).click();
  await page.getByRole('heading', { name: 'Practice with a clearer ear.' }).waitFor();
  assert.equal(await page.getByTestId('ink-clouds-container').count(), 1, 'Ink clouds restored on return');

  await page.close();

  // --- Suite 2: Reduced Motion Verification ---
  console.log('\n--- Suite 2: Reduced-Motion Verification ---');
  const reducedMotionContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const rmPage = await reducedMotionContext.newPage();
  await rmPage.goto(baseUrl, { waitUntil: 'networkidle' });

  assert.equal(await rmPage.getByRole('heading', { name: 'Practice with a clearer ear.' }).count(), 1);
  assert.equal(await rmPage.getByTestId('ink-clouds-container').count(), 1);
  await rmPage.getByRole('button', { name: 'Preview a listening check' }).click();
  assert.equal(await rmPage.getByText('A4 +14¢').count(), 1);
  assert.equal(await rmPage.getByRole('button', { name: 'Preview active · Replay check' }).count(), 1);

  await rmPage.close();
  await reducedMotionContext.close();

  // 6. Verify zero unhandled browser errors
  console.log('\n--- Suite 3: Console Health Verification ---');
  assert.equal(consoleErrors.length, 0, `Expected 0 console errors, got: ${JSON.stringify(consoleErrors)}`);
  assert.equal(pageErrors.length, 0, `Expected 0 page errors, got: ${JSON.stringify(pageErrors)}`);
  console.log('✅ Console health verified: 0 errors emitted.');

  console.log('\n================================================================');
  console.log('ALL SONUS LANDING SCREEN VERIFICATIONS PASSED (100% GREEN)');
  console.log('================================================================\n');
} finally {
  await browser.close();
  await viteServer.close();
}
