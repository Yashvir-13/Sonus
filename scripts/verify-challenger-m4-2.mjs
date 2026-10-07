/**
 * Challenger M4-2 Empirical Verification Suite
 * 
 * Objectives:
 * 1. Empirically verify that all 4 viewports render without crashing under direct URL hash navigations
 *    (#practice, #profile, #history, #tuning) both on cold direct page loads and in-page hash changes.
 * 2. Empirically verify Astrolabe dial needle rotations and resonance halo DOM states
 *    (in-tune 0¢, flat -18¢, sharp +24¢, and dynamic updates).
 * 3. Monitor and assert browser console health (zero errors, examine warnings) throughout full navigation tour.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from '../apps/web/node_modules/vite/dist/node/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.resolve(rootDir, 'apps/web');

const testResults = [];
const consoleErrors = [];
const consoleWarnings = [];
const pageErrors = [];

function recordTest(suite, testName, passed, details = '') {
  testResults.push({ suite, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] [${suite}] ${testName} ${details ? `(${details})` : ''}`);
}

async function runChallengerVerification() {
  console.log('================================================================');
  console.log('CHALLENGER M4-2: EMPIRICAL HARNESS & ADVERSARIAL STRESS TEST');
  console.log('================================================================\n');

  console.log('[Server] Launching fresh Vite dev server on dedicated port 5176...');
  const viteServer = await createServer({
    root: webDir,
    configFile: path.resolve(webDir, 'vite.config.ts'),
    server: { port: 5176, strictPort: false },
  });
  await viteServer.listen();
  const actualPort = viteServer.httpServer.address().port;
  console.log(`[Server] Vite dev server listening on port ${actualPort}.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`[Console Error]: ${text}`);
    } else if (type === 'warn' || type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error(`[Page Error]: ${err.message}`);
  });

  const baseUrl = `http://localhost:${actualPort}`;

  try {
    // Warm-up initial load to allow Vite optimizer to bundle modules
    console.log('[Warm-up] Initial navigation to compile Vite bundles...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 15000 });

    // ========================================================================
    // 1. UNCOMMITTED / UNAUTHENTICATED DIRECT HASH NAVIGATIONS
    // ========================================================================
    console.log('\n--- 1. Testing Unauthenticated Cold Direct Hash Navigation ---');
    const directHashes = ['#practice', '#profile', '#history', '#tuning'];
    for (const hash of directHashes) {
      const url = `${baseUrl}/${hash}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1', { timeout: 5000 });

      const landingTitle = await page.locator('h1').filter({ hasText: 'PRISM' }).count();
      const bodyVisible = await page.locator('body').isVisible();
      recordTest(
        '1.UnauthDirectHash',
        `Navigating cold to ${hash} renders without crash`,
        bodyVisible && landingTitle > 0,
        `URL: ${url}, PRISM title count: ${landingTitle}`
      );
    }

    // ========================================================================
    // 2. GUEST DIRECT HASH NAVIGATIONS (ALL 4 VIEWPORTS COLD LOAD)
    // ========================================================================
    console.log('\n--- 2. Testing Direct URL Hash Navigation with Guest Mode Active ---');
    // Set guest mode in sessionStorage so the 2D Spatial Stand mounts directly
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.setItem('prism_guest_mode', 'true');
    });

    // 2.1 Direct load to #practice
    await page.goto(`${baseUrl}/#practice`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const practiceTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    const practiceAriaHidden = await page.locator('#viewport-practice').getAttribute('aria-hidden');
    const practiceInert = await page.locator('#viewport-practice').getAttribute('inert');
    recordTest(
      '2.DirectHash.Practice',
      'Direct load #practice activates Stand (0, 0)',
      practiceTarget === 'practice' && practiceAriaHidden !== 'true' && practiceInert === null,
      `target=${practiceTarget}, aria-hidden=${practiceAriaHidden}, inert=${practiceInert}`
    );

    // 2.2 Direct load to #profile
    await page.goto(`${baseUrl}/#profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const profileTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    const profileAriaHidden = await page.locator('#viewport-profile').getAttribute('aria-hidden');
    const profileHeader = await page.locator('#viewport-profile').getByText('Folio II · Persona et Physiognomia').count();
    recordTest(
      '2.DirectHash.Profile',
      'Direct load #profile activates Composer Profile (0, -1)',
      profileTarget === 'profile' && profileAriaHidden !== 'true' && profileHeader > 0,
      `target=${profileTarget}, folioCount=${profileHeader}`
    );

    // 2.3 Direct load to #history
    await page.goto(`${baseUrl}/#history`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const historyTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    const historyAriaHidden = await page.locator('#viewport-history').getAttribute('aria-hidden');
    const historySvg = await page.locator('#viewport-history svg').count();
    recordTest(
      '2.DirectHash.History',
      'Direct load #history activates Constellation History (-1, 0)',
      historyTarget === 'history' && historyAriaHidden !== 'true' && historySvg > 0,
      `target=${historyTarget}, svgCount=${historySvg}`
    );

    // 2.4 Direct load to #tuning
    await page.goto(`${baseUrl}/#tuning`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const tuningTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    const tuningAriaHidden = await page.locator('#viewport-tuning').getAttribute('aria-hidden');
    const astrolabeDialCount = await page.locator('#viewport-tuning [data-testid="astrolabe-dial"]').count();
    recordTest(
      '2.DirectHash.Tuning',
      'Direct load #tuning activates Sacred Astrolabe Tuning (1, 0)',
      tuningTarget === 'tuning' && tuningAriaHidden !== 'true' && astrolabeDialCount > 0,
      `target=${tuningTarget}, dialCount=${astrolabeDialCount}`
    );

    // ========================================================================
    // 3. DYNAMIC IN-PAGE URL HASH MUTATIONS & BIDIRECTIONAL SYNC
    // ========================================================================
    console.log('\n--- 3. Testing Dynamic In-Page Hash Mutations ---');
    // Change hash to #history via window.location.hash
    await page.evaluate(() => {
      window.location.hash = '#history';
    });
    await page.waitForTimeout(1000);
    const dynamicHistoryTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    recordTest(
      '3.DynamicHash',
      'Setting window.location.hash = "#history" panned canvas to history',
      dynamicHistoryTarget === 'history',
      `target=${dynamicHistoryTarget}`
    );

    // Change hash to #profile
    await page.evaluate(() => {
      window.location.hash = '#profile';
    });
    await page.waitForTimeout(1000);
    const dynamicProfileTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    recordTest(
      '3.DynamicHash',
      'Setting window.location.hash = "#profile" panned canvas to profile',
      dynamicProfileTarget === 'profile',
      `target=${dynamicProfileTarget}`
    );

    // Change hash to #practice
    await page.evaluate(() => {
      window.location.hash = '#practice';
    });
    await page.waitForTimeout(1000);
    const dynamicPracticeTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    recordTest(
      '3.DynamicHash',
      'Setting window.location.hash = "#practice" panned canvas to practice',
      dynamicPracticeTarget === 'practice',
      `target=${dynamicPracticeTarget}`
    );

    // Test Browser Back button
    await page.goBack();
    await page.waitForTimeout(1000);
    const backTarget = await page.locator('.spatial-viewport').getAttribute('data-current-target');
    recordTest(
      '3.DynamicHash',
      'Browser back button restores previous target in canvas',
      backTarget === 'profile',
      `target=${backTarget}`
    );

    // ========================================================================
    // 4. ASTROLABE DIAL NEEDLE ROTATIONS & RESONANCE HALO DOM STATES
    // ========================================================================
    console.log('\n--- 4. Testing Astrolabe Dial Needle Rotations & Resonance Halo DOM States ---');
    // Pan to tuning
    await page.evaluate(() => {
      window.location.hash = '#tuning';
    });
    await page.waitForTimeout(1000);

    const needle = page.locator('[data-testid="astrolabe-needle"]').first();
    const dial = page.locator('[data-testid="astrolabe-dial"]').first();
    // Halo aureole ring is the circle with r="142" inside the dial SVG
    const haloRing = dial.locator('circle[r="142"]').first();
    const needleBlade = needle.locator('polygon').first();
    // Inner pivot hub circle is circle with r="4" centered at cx=160, cy=160
    const innerPivotHub = needle.locator('circle[r="4"]').last();

    // 4.1 In-Tune Equilibrium (0¢)
    console.log('\n  [4.1] Testing 0¢ In-Tune Equilibrium');
    await page.locator('[data-testid="test-in-tune"]').click();
    await page.waitForTimeout(400);

    const needleStyleInTune = await needle.getAttribute('style');
    const needleRotInTune = needleStyleInTune?.includes('rotate(0deg)');
    recordTest('4.Astrolabe.InTune', 'Needle rotation angle is rotate(0deg)', !!needleRotInTune, needleStyleInTune || '');

    const bladeFillInTune = await needleBlade.getAttribute('fill');
    recordTest('4.Astrolabe.InTune', 'Needle blade fill is crimson #9A2A2A', bladeFillInTune === '#9A2A2A', `fill=${bladeFillInTune}`);

    const hubFillInTune = await innerPivotHub.getAttribute('fill');
    recordTest('4.Astrolabe.InTune', 'Needle pivot hub fill is crimson #9A2A2A', hubFillInTune === '#9A2A2A', `fill=${hubFillInTune}`);

    const haloStrokeInTune = await haloRing.getAttribute('stroke');
    const haloStrokeWidthInTune = (await haloRing.getAttribute('stroke-width')) || (await haloRing.getAttribute('strokeWidth'));
    const haloStrokeOpacityInTune = (await haloRing.getAttribute('stroke-opacity')) || (await haloRing.getAttribute('strokeOpacity'));
    const haloFilterInTune = await haloRing.getAttribute('filter');
    const haloGlowActive = haloStrokeInTune === '#9A2A2A' &&
      (haloStrokeWidthInTune === '3' || haloStrokeWidthInTune === '3px') &&
      haloStrokeOpacityInTune === '0.95' &&
      (haloFilterInTune?.includes('halo-glow') || false);
    recordTest(
      '4.Astrolabe.InTune',
      'Resonance Halo DOM state is ACTIVE (crimson #9A2A2A, width 3, opacity 0.95, filter halo-glow)',
      haloGlowActive,
      `stroke=${haloStrokeInTune}, width=${haloStrokeWidthInTune}, opacity=${haloStrokeOpacityInTune}, filter=${haloFilterInTune}`
    );

    const equilibriumLabel = await page.getByText('● EQUILIBRIUM').count();
    const harmoniaLabel = await page.getByText('HARMONIA PERFECTA (IN EQUILIBRIO)').count();
    recordTest('4.Astrolabe.InTune', 'Rubric seal badge reads HARMONIA PERFECTA (IN EQUILIBRIO) & ● EQUILIBRIUM', equilibriumLabel > 0 && harmoniaLabel > 0);

    // 4.2 Flat Indication (-18¢ -> -21.6°)
    console.log('\n  [4.2] Testing -18¢ Flat');
    await page.locator('[data-testid="test-flat"]').click();
    await page.waitForTimeout(400);

    const needleStyleFlat = await needle.getAttribute('style');
    const needleRotFlat = needleStyleFlat?.includes('rotate(-21.6deg)');
    recordTest('4.Astrolabe.Flat', 'Needle rotation angle is rotate(-21.6deg)', !!needleRotFlat, needleStyleFlat || '');

    const bladeFillFlat = await needleBlade.getAttribute('fill');
    recordTest('4.Astrolabe.Flat', 'Needle blade fill is charcoal #2C2A29', bladeFillFlat === '#2C2A29', `fill=${bladeFillFlat}`);

    const hubFillFlat = await innerPivotHub.getAttribute('fill');
    recordTest('4.Astrolabe.Flat', 'Needle pivot hub fill is gold #C8A858', hubFillFlat === '#C8A858', `fill=${hubFillFlat}`);

    const haloStrokeFlat = await haloRing.getAttribute('stroke');
    const haloStrokeWidthFlat = (await haloRing.getAttribute('stroke-width')) || (await haloRing.getAttribute('strokeWidth'));
    const haloStrokeOpacityFlat = (await haloRing.getAttribute('stroke-opacity')) || (await haloRing.getAttribute('strokeOpacity'));
    const haloFilterFlat = await haloRing.getAttribute('filter');
    const haloGlowInactiveFlat = haloStrokeFlat === '#2C2A29' &&
      (haloStrokeWidthFlat === '0.75' || haloStrokeWidthFlat === '0.75px') &&
      haloStrokeOpacityFlat === '0.2' &&
      (!haloFilterFlat || haloFilterFlat === 'none');
    recordTest(
      '4.Astrolabe.Flat',
      'Resonance Halo DOM state is INACTIVE (charcoal #2C2A29, width 0.75, opacity 0.2, filter none)',
      haloGlowInactiveFlat,
      `stroke=${haloStrokeFlat}, width=${haloStrokeWidthFlat}, opacity=${haloStrokeOpacityFlat}, filter=${haloFilterFlat}`
    );

    const flatRubricLabel = await page.getByText('BEMOLLE ♭ (-18.0¢ FLAT)').count();
    const discordiaLabelFlat = await page.getByText('○ DISCORDIA').count();
    recordTest('4.Astrolabe.Flat', 'Rubric seal badge reads BEMOLLE ♭ (-18.0¢ FLAT) & ○ DISCORDIA', flatRubricLabel > 0 && discordiaLabelFlat > 0);

    // 4.3 Sharp Indication (+24¢ -> +28.8°)
    console.log('\n  [4.3] Testing +24¢ Sharp');
    await page.locator('[data-testid="test-sharp"]').click();
    await page.waitForTimeout(400);

    const needleStyleSharp = await needle.getAttribute('style');
    const needleRotSharp = needleStyleSharp?.includes('rotate(28.8deg)');
    recordTest('4.Astrolabe.Sharp', 'Needle rotation angle is rotate(28.8deg)', !!needleRotSharp, needleStyleSharp || '');

    const bladeFillSharp = await needleBlade.getAttribute('fill');
    recordTest('4.Astrolabe.Sharp', 'Needle blade fill is charcoal #2C2A29', bladeFillSharp === '#2C2A29', `fill=${bladeFillSharp}`);

    const hubFillSharp = await innerPivotHub.getAttribute('fill');
    recordTest('4.Astrolabe.Sharp', 'Needle pivot hub fill is gold #C8A858', hubFillSharp === '#C8A858', `fill=${hubFillSharp}`);

    const haloStrokeSharp = await haloRing.getAttribute('stroke');
    const haloStrokeWidthSharp = (await haloRing.getAttribute('stroke-width')) || (await haloRing.getAttribute('strokeWidth'));
    const haloStrokeOpacitySharp = (await haloRing.getAttribute('stroke-opacity')) || (await haloRing.getAttribute('strokeOpacity'));
    const haloFilterSharp = await haloRing.getAttribute('filter');
    const haloGlowInactiveSharp = haloStrokeSharp === '#2C2A29' &&
      (haloStrokeWidthSharp === '0.75' || haloStrokeWidthSharp === '0.75px') &&
      haloStrokeOpacitySharp === '0.2' &&
      (!haloFilterSharp || haloFilterSharp === 'none');
    recordTest(
      '4.Astrolabe.Sharp',
      'Resonance Halo DOM state is INACTIVE (charcoal #2C2A29, width 0.75, opacity 0.2, filter none)',
      haloGlowInactiveSharp,
      `stroke=${haloStrokeSharp}, width=${haloStrokeWidthSharp}, opacity=${haloStrokeOpacitySharp}, filter=${haloFilterSharp}`
    );

    const sharpRubricLabel = await page.getByText('DIESIS ♯ (+24.0¢ SHARP)').count();
    const discordiaLabelSharp = await page.getByText('○ DISCORDIA').count();
    recordTest('4.Astrolabe.Sharp', 'Rubric seal badge reads DIESIS ♯ (+24.0¢ SHARP) & ○ DISCORDIA', sharpRubricLabel > 0 && discordiaLabelSharp > 0);

    // ========================================================================
    // 5. CONSOLE HEALTH & WARNINGS AUDIT
    // ========================================================================
    console.log('\n--- 5. Console Health & Warning Audit ---');
    recordTest('5.ConsoleHealth', 'Zero console.error events logged during entire test run', consoleErrors.length === 0, `errors=${consoleErrors.length}`);
    recordTest('5.ConsoleHealth', 'Zero uncaught page errors logged', pageErrors.length === 0, `pageErrors=${pageErrors.length}`);

    console.log(`[Info] Console warnings collected (${consoleWarnings.length}):`);
    for (const w of consoleWarnings) {
      console.log(`  - ${w}`);
    }

  } finally {
    await browser.close();
    if (viteServer) {
      await viteServer.close();
    }
  }

  // Final Summary
  console.log('\n================================================================');
  console.log('CHALLENGER VERIFICATION SUMMARY');
  console.log('================================================================');
  const passedCount = testResults.filter((r) => r.passed).length;
  const failedCount = testResults.filter((r) => !r.passed).length;
  console.log(`Total Assertions: ${testResults.length}`);
  console.log(`Passed:           ${passedCount}`);
  console.log(`Failed:           ${failedCount}`);
  console.log(`Console Errors:   ${consoleErrors.length}`);
  console.log(`Page Errors:      ${pageErrors.length}`);
  console.log('================================================================\n');

  if (failedCount > 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runChallengerVerification().catch((err) => {
  console.error('[Fatal Error in Challenger Test Harness]:', err);
  process.exit(1);
});
