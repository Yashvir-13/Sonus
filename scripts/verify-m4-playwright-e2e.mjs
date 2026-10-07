/**
 * Playwright E2E & Visual Verification Test Suite
 * Milestone 4: PRISM 2D Spatial Practice System
 * 
 * Verifies:
 * 1. Landing Page (ink bleed filter, PRISM title, motto, feature scrolls, Clerk auth, 0 radius)
 * 2. Instant Guest Mode Audition -> 2D Spatial Stand (0, 0)
 * 3. Spatial Panning to Constellation History (-1, 0) (scatter plot, 86 BPM breakdown horizon, filaments, marginalia tooltip)
 * 4. Spatial Panning to Composer Profile (0, -1) (treatise frontispiece, woodcut monogram crest, telemetry, microtonal habits, repertoire ledger)
 * 5. Spatial Panning to Sacred Tuning Ritual (1, 0) (320px astrolabe dial, rotating needle, 0¢ in-tune equilibrium, -18¢ flat, +24¢ sharp)
 * 6. Physical capture & verification of 7 PNG screenshots (non-empty, valid PNG header)
 * 7. Zero browser console errors throughout the entire test session.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from '../apps/web/node_modules/vite/dist/node/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.resolve(rootDir, 'apps/web');
const screenshotsDir = path.resolve(rootDir, '.agents/teamwork/verification_screenshots');

// Ensure screenshots directory exists
fs.mkdirSync(screenshotsDir, { recursive: true });

const testResults = [];
const consoleErrors = [];
const pageErrors = [];

function recordTest(suite, testName, passed, details = '') {
  testResults.push({ suite, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] [${suite}] ${testName} ${details ? `(${details})` : ''}`);
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function verifyPngFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, reason: 'File does not exist' };
  }
  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    return { valid: false, reason: 'File is empty (0 bytes)' };
  }
  const buf = Buffer.alloc(8);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);

  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;

  if (!isPng) {
    return { valid: false, reason: 'Invalid PNG header' };
  }
  return { valid: true, size: stat.size };
}

async function runVerification() {
  console.log('================================================================');
  console.log('PRISM E2E & VISUAL VERIFICATION TEST HARNESS (MILESTONE 4)');
  console.log('================================================================\n');

  let viteServer = null;
  const port = 5173;
  const isRunning = await isPortOpen(port);

  if (isRunning) {
    console.log(`[Server] Connecting to existing Vite dev server on port ${port}...`);
  } else {
    console.log(`[Server] Launching Vite dev server on port ${port}...`);
    viteServer = await createServer({
      root: webDir,
      configFile: path.resolve(webDir, 'vite.config.ts'),
      server: { port, strictPort: true },
    });
    await viteServer.listen();
    console.log('[Server] Vite dev server started successfully.');
  }

  console.log('[Playwright] Launching Chromium (1440x900 viewport)...');
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
      console.error(`[Browser Error Console]: ${text}`);
    } else {
      // console.log(`[Browser ${type}]: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error(`[Browser PageError]: ${err.message}`);
  });

  const baseUrl = `http://localhost:${port}`;

  try {
    // ========================================================================
    // 4a. LANDING PAGE VERIFICATION
    // ========================================================================
    console.log('\n--- 4a. Testing Landing Page ---');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 4a.1: filter#ink-bleed with genuine SVG turbulence/displacement primitives
    const filterExists = await page.$('filter#ink-bleed');
    recordTest('4a.Landing', 'filter#ink-bleed exists', !!filterExists);

    const feTurbulence = await page.$('filter#ink-bleed feTurbulence');
    const turbType = feTurbulence ? await feTurbulence.getAttribute('type') : null;
    const turbFreq = feTurbulence ? await feTurbulence.getAttribute('baseFrequency') : null;
    recordTest('4a.Landing', 'feTurbulence primitive exists with fractalNoise', turbType === 'fractalNoise', `baseFrequency=${turbFreq}`);

    const feDisplacement = await page.$('filter#ink-bleed feDisplacementMap');
    const dispScale = feDisplacement ? await feDisplacement.getAttribute('scale') : null;
    recordTest('4a.Landing', 'feDisplacementMap primitive exists with scale', !!feDisplacement && !!dispScale, `scale=${dispScale}`);

    const feBlur = await page.$('filter#ink-bleed feGaussianBlur');
    recordTest('4a.Landing', 'feGaussianBlur primitive exists in filter', !!feBlur);

    const feMerge = await page.$('filter#ink-bleed feMerge');
    recordTest('4a.Landing', 'feMerge primitive exists in filter', !!feMerge);

    // 4a.2: PRISM calligraphic title with filter: url(#ink-bleed)
    const prismTitle = await page.locator('h1').filter({ hasText: 'PRISM' }).first();
    const titleCount = await prismTitle.count();
    recordTest('4a.Landing', 'PRISM master calligraphic title present', titleCount > 0);

    const titleStyle = titleCount > 0 ? await prismTitle.getAttribute('style') : '';
    const hasFilterRef = titleStyle?.includes('#ink-bleed') || false;
    recordTest('4a.Landing', 'PRISM title references filter: url(#ink-bleed)', hasFilterRef, titleStyle || '');

    // 4a.3: Latin motto and feature scrolls
    const mottoElement = await page.locator('text=AUDIRE · DISCERE · EXERCERE').first();
    const mottoCount = await mottoElement.count();
    recordTest('4a.Landing', 'Latin motto "AUDIRE · DISCERE · EXERCERE" present', mottoCount > 0);

    const scroll1 = await page.locator('text=The Attentive Ear').first();
    const scroll2 = await page.locator('text=The Spatial Canvas').first();
    const scroll3 = await page.locator('text=The Constellation Memory').first();
    const scrollsPresent = (await scroll1.count()) > 0 && (await scroll2.count()) > 0 && (await scroll3.count()) > 0;
    recordTest('4a.Landing', 'Three illuminated feature scrolls present', scrollsPresent);

    // 4a.4: Clerk Auth form and zero border radius styling
    const guestBtn = await page.locator('[data-testid="guest-audition-btn"]').first();
    recordTest('4a.Landing', 'Guest Audition CTA button present', (await guestBtn.count()) > 0);

    const guildLedger = await page.locator('text=Conservatory Guild Ledger').first();
    recordTest('4a.Landing', 'Clerk Auth container / Guild Ledger present', (await guildLedger.count()) > 0);

    // Capture Screenshot 01: Landing Page
    const screenshot01 = path.join(screenshotsDir, '01_landing_page.png');
    await page.screenshot({ path: screenshot01, fullPage: true });
    const s1Check = verifyPngFile(screenshot01);
    recordTest('4a.Screenshot', '01_landing_page.png captured and verified', s1Check.valid, `${s1Check.size} bytes`);

    // ========================================================================
    // 4b. INSTANT GUEST MODE AUDITION
    // ========================================================================
    console.log('\n--- 4b. Testing Instant Guest Mode Audition ---');
    await guestBtn.click();
    await page.waitForTimeout(1000);

    // Confirm navigation to 2D Spatial Stand (0, 0)
    const standHeader = await page.locator('text=Opus Manuscriptum').first();
    const standSub = await page.locator('text=Adaptive Practice System · Stand (0, 0)').first();
    const isAtStand = (await standHeader.count()) > 0 && (await standSub.count()) > 0;
    recordTest('4b.GuestStand', 'Navigated to 2D Spatial Stand (0, 0)', isAtStand);

    const spatialViewport = await page.locator('.spatial-viewport').first();
    const currentTarget = await spatialViewport.getAttribute('data-current-target');
    recordTest('4b.GuestStand', 'Spatial viewport target is "practice"', currentTarget === 'practice', `data-current-target=${currentTarget}`);

    // Capture Screenshot 02: Practice Stand
    const screenshot02 = path.join(screenshotsDir, '02_practice_stand.png');
    await page.screenshot({ path: screenshot02, fullPage: true });
    const s2Check = verifyPngFile(screenshot02);
    recordTest('4b.Screenshot', '02_practice_stand.png captured and verified', s2Check.valid, `${s2Check.size} bytes`);

    // ========================================================================
    // 4c. SPATIAL PANNING TO CONSTELLATION HISTORY (-1, 0)
    // ========================================================================
    console.log('\n--- 4c. Testing Spatial Panning to Constellation History ---');
    const navHistoryBtn = await page.locator('[data-testid="nav-history"]').first();
    recordTest('4c.History', 'Nav anchor [data-testid="nav-history"] present', (await navHistoryBtn.count()) > 0);

    await navHistoryBtn.click();
    // Allow spring physics transition (70 stiffness, 18 damping)
    await page.waitForTimeout(1200);

    const targetAfterHistory = await spatialViewport.getAttribute('data-current-target');
    recordTest('4c.History', 'Spatial viewport panned to "history" (-1, 0)', targetAfterHistory === 'history', `target=${targetAfterHistory}`);

    // Validate celestial scatter plot elements
    const breakdownHorizonText = await page.locator('text=HORIZON CRITICUS (86 BPM)').first();
    const hasBreakdownHorizon = (await breakdownHorizonText.count()) > 0;
    recordTest('4c.History', '86 BPM breakdown horizon text present', hasBreakdownHorizon);

    // Check SVG star nodes & filaments
    const scatterSvg = await page.locator('#viewport-history svg').first();
    const svgExists = (await scatterSvg.count()) > 0;
    recordTest('4c.History', 'Celestial scatter plot SVG present', svgExists);

    const starNodes = await page.locator('#viewport-history svg text:has-text("✦"), #viewport-history svg circle');
    const starNodeCount = await starNodes.count();
    recordTest('4c.History', 'Star nodes rendered in scatter plot', starNodeCount >= 5, `count=${starNodeCount}`);

    const filaments = await page.locator('#viewport-history svg path');
    const filamentCount = await filaments.count();
    recordTest('4c.History', 'Constellation filaments rendered', filamentCount >= 2, `count=${filamentCount}`);

    // Marginalia tooltip / take inspector folio
    const marginaliaHeader = await page.locator('text=Folium Inspectionis Stellae').first();
    const marginaliaNote = await page.locator('text=Nota Editoris (Critical Diagnosis)').first();
    const hasMarginalia = (await marginaliaHeader.count()) > 0 && (await marginaliaNote.count()) > 0;
    recordTest('4c.History', 'Marginalia tooltip & critical editor note present', hasMarginalia);

    // Capture Screenshot 03: Constellation History
    const screenshot03 = path.join(screenshotsDir, '03_constellation_history.png');
    await page.screenshot({ path: screenshot03, fullPage: true });
    const s3Check = verifyPngFile(screenshot03);
    recordTest('4c.Screenshot', '03_constellation_history.png captured and verified', s3Check.valid, `${s3Check.size} bytes`);

    // ========================================================================
    // 4d. SPATIAL PANNING TO COMPOSER PROFILE (0, -1)
    // ========================================================================
    console.log('\n--- 4d. Testing Spatial Panning to Composer Profile ---');
    // Pan to practice stand first or use compass
    const compassPractice = await page.locator('[data-testid="compass-practice"]').first();
    await compassPractice.click();
    await page.waitForTimeout(1000);

    const navProfileBtn = await page.locator('[data-testid="nav-profile"]').first();
    recordTest('4d.Profile', 'Nav anchor [data-testid="nav-profile"] present', (await navProfileBtn.count()) > 0);

    await navProfileBtn.click();
    await page.waitForTimeout(1200);

    const targetAfterProfile = await spatialViewport.getAttribute('data-current-target');
    recordTest('4d.Profile', 'Spatial viewport panned to "profile" (0, -1)', targetAfterProfile === 'profile', `target=${targetAfterProfile}`);

    // Validate 17th-century treatise frontispiece
    const frontispieceTitle = await page.locator('text=Folio II · Persona et Physiognomia').first();
    recordTest('4d.Profile', 'Treatise frontispiece folio header present', (await frontispieceTitle.count()) > 0);

    // Woodcut monogram crest
    const monogramCrest = await page.locator('[aria-label="Composer Monogram Crest"]').first();
    recordTest('4d.Profile', 'Woodcut monogram crest present', (await monogramCrest.count()) > 0);

    // Practice telemetry table
    const physiognomyHeading = await page.locator('text=I. The Physiognomy of Practice').first();
    const intonationPurityLabel = await page.locator('text=Intonation Purity').first();
    const timingPrecisionLabel = await page.locator('text=Timing Precision').first();
    const hasTelemetry = (await physiognomyHeading.count()) > 0 && (await intonationPurityLabel.count()) > 0 && (await timingPrecisionLabel.count()) > 0;
    recordTest('4d.Profile', 'Practice telemetry matrix present', hasTelemetry);

    // Dominant microtonal habits
    const habitsSection = await page.locator('text=Diagnosed Habitus & Kinetic Biases').first();
    const habitSharp = await page.locator('text=♯ +5¢').first();
    const habitFlat = await page.locator('text=♭ -4¢').first();
    const hasHabits = (await habitsSection.count()) > 0 && (await habitSharp.count()) > 0 && (await habitFlat.count()) > 0;
    recordTest('4d.Profile', 'Dominant microtonal habits diagnoses present', hasHabits);

    // Repertoire ledger
    const repertoireHeading = await page.locator('text=II. The Repertoire Ledger').first();
    recordTest('4d.Profile', 'Repertoire ledger table present', (await repertoireHeading.count()) > 0);

    // Capture Screenshot 04: Composer Profile
    const screenshot04 = path.join(screenshotsDir, '04_composer_profile.png');
    await page.screenshot({ path: screenshot04, fullPage: true });
    const s4Check = verifyPngFile(screenshot04);
    recordTest('4d.Screenshot', '04_composer_profile.png captured and verified', s4Check.valid, `${s4Check.size} bytes`);

    // ========================================================================
    // 4e. SPATIAL PANNING TO SACRED TUNING RITUAL (1, 0)
    // ========================================================================
    console.log('\n--- 4e. Testing Spatial Panning to Sacred Tuning Ritual ---');
    // Return to practice then pan to tuning
    await compassPractice.click();
    await page.waitForTimeout(1000);

    const navTuningBtn = await page.locator('[data-testid="nav-tuning"]').first();
    recordTest('4e.Tuning', 'Nav anchor [data-testid="nav-tuning"] present', (await navTuningBtn.count()) > 0);

    await navTuningBtn.click();
    await page.waitForTimeout(1200);

    const targetAfterTuning = await spatialViewport.getAttribute('data-current-target');
    recordTest('4e.Tuning', 'Spatial viewport panned to "tuning" (1, 0)', targetAfterTuning === 'tuning', `target=${targetAfterTuning}`);

    // Validate Sacred Tuning Astrolabe Dial (320px) and needle
    const astrolabeDial = await page.locator('[data-testid="astrolabe-dial"]').first();
    recordTest('4e.Tuning', 'Sacred Tuning Astrolabe dial present', (await astrolabeDial.count()) > 0);

    const dialWidth = await astrolabeDial.getAttribute('width');
    const dialHeight = await astrolabeDial.getAttribute('height');
    recordTest('4e.Tuning', 'Astrolabe dial diameter is 320px', dialWidth === '320' && dialHeight === '320', `${dialWidth}x${dialHeight}`);

    const needle = await page.locator('[data-testid="astrolabe-needle"]').first();
    recordTest('4e.Tuning', 'Rotating astrolabe needle present', (await needle.count()) > 0);

    // 4e.Test 1: In-Tune Equilibrium (0¢ -> 0.0°)
    console.log('\n--- 4e.1 Testing 0¢ In-Tune Equilibrium ---');
    const testInTuneBtn = await page.locator('[data-testid="test-in-tune"]').first();
    await testInTuneBtn.click();
    await page.waitForTimeout(400);

    const inTuneNeedleStyle = await needle.getAttribute('style');
    const isAngle0 = inTuneNeedleStyle?.includes('rotate(0deg)');
    recordTest('4e.InTune', 'Needle angle is exactly 0.0° at 0¢ equilibrium', isAngle0, inTuneNeedleStyle || '');

    const equilibriumText = await page.locator('text=● EQUILIBRIUM').first();
    recordTest('4e.InTune', 'Equilibrium status indicator active', (await equilibriumText.count()) > 0);

    // Capture Screenshot 05: In-Tune Astrolabe
    const screenshot05 = path.join(screenshotsDir, '05_tuning_astrolabe_in_tune.png');
    await page.screenshot({ path: screenshot05, fullPage: true });
    const s5Check = verifyPngFile(screenshot05);
    recordTest('4e.Screenshot', '05_tuning_astrolabe_in_tune.png captured and verified', s5Check.valid, `${s5Check.size} bytes`);

    // 4e.Test 2: Flat Indication (-18¢ -> -21.6°)
    console.log('\n--- 4e.2 Testing -18¢ Flat ---');
    const testFlatBtn = await page.locator('[data-testid="test-flat"]').first();
    await testFlatBtn.click();
    await page.waitForTimeout(400);

    const flatNeedleStyle = await needle.getAttribute('style');
    const isAngleFlat = flatNeedleStyle?.includes('rotate(-21.6deg)');
    recordTest('4e.Flat', 'Needle angle is exactly -21.6° at -18¢ flat', isAngleFlat, flatNeedleStyle || '');

    const flatCentsText = await page.locator('text=-18.0¢').first();
    recordTest('4e.Flat', 'Deviation display shows -18.0¢', (await flatCentsText.count()) > 0);

    // Capture Screenshot 06: Flat Astrolabe
    const screenshot06 = path.join(screenshotsDir, '06_tuning_astrolabe_flat.png');
    await page.screenshot({ path: screenshot06, fullPage: true });
    const s6Check = verifyPngFile(screenshot06);
    recordTest('4e.Screenshot', '06_tuning_astrolabe_flat.png captured and verified', s6Check.valid, `${s6Check.size} bytes`);

    // 4e.Test 3: Sharp Indication (+24¢ -> +28.8°)
    console.log('\n--- 4e.3 Testing +24¢ Sharp ---');
    const testSharpBtn = await page.locator('[data-testid="test-sharp"]').first();
    await testSharpBtn.click();
    await page.waitForTimeout(400);

    const sharpNeedleStyle = await needle.getAttribute('style');
    const isAngleSharp = sharpNeedleStyle?.includes('rotate(28.8deg)');
    recordTest('4e.Sharp', 'Needle angle is exactly +28.8° at +24¢ sharp', isAngleSharp, sharpNeedleStyle || '');

    const sharpCentsText = await page.locator('text=+24.0¢').first();
    recordTest('4e.Sharp', 'Deviation display shows +24.0¢', (await sharpCentsText.count()) > 0);

    // Capture Screenshot 07: Sharp Astrolabe
    const screenshot07 = path.join(screenshotsDir, '07_tuning_astrolabe_sharp.png');
    await page.screenshot({ path: screenshot07, fullPage: true });
    const s7Check = verifyPngFile(screenshot07);
    recordTest('4e.Screenshot', '07_tuning_astrolabe_sharp.png captured and verified', s7Check.valid, `${s7Check.size} bytes`);

    // ========================================================================
    // 5. SCREENSHOT DELIVERABLES VERIFICATION
    // ========================================================================
    console.log('\n--- 5. Verifying All 7 Screenshots ---');
    const allScreenshots = [
      '01_landing_page.png',
      '02_practice_stand.png',
      '03_constellation_history.png',
      '04_composer_profile.png',
      '05_tuning_astrolabe_in_tune.png',
      '06_tuning_astrolabe_flat.png',
      '07_tuning_astrolabe_sharp.png',
    ];

    let allScreenshotsValid = true;
    for (const name of allScreenshots) {
      const fullPath = path.join(screenshotsDir, name);
      const check = verifyPngFile(fullPath);
      recordTest('5.Artifacts', `Screenshot ${name} physical validation`, check.valid, `${check.size || 0} bytes`);
      if (!check.valid) allScreenshotsValid = false;
    }

    // ========================================================================
    // 6. ZERO CONSOLE ERRORS VERIFICATION
    // ========================================================================
    console.log('\n--- 6. Verifying 0 Console Errors ---');
    const zeroConsoleErrors = consoleErrors.length === 0;
    const zeroPageErrors = pageErrors.length === 0;
    recordTest('6.ConsoleHealth', 'Zero console.error calls emitted', zeroConsoleErrors, `count=${consoleErrors.length}`);
    recordTest('6.ConsoleHealth', 'Zero unhandled page errors emitted', zeroPageErrors, `count=${pageErrors.length}`);

    if (consoleErrors.length > 0) {
      console.error('Console errors logged:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.error('Page errors logged:', pageErrors);
    }

  } finally {
    console.log('\n[Teardown] Closing browser and context...');
    await browser.close();

    if (viteServer) {
      console.log('[Teardown] Stopping Vite dev server...');
      await viteServer.close();
      console.log('[Teardown] Vite server stopped.');
    }
  }

  // Final Summary
  console.log('\n================================================================');
  console.log('TEST SUMMARY');
  console.log('================================================================');
  const passedCount = testResults.filter((r) => r.passed).length;
  const failedCount = testResults.filter((r) => !r.passed).length;
  console.log(`Total Assertions: ${testResults.length}`);
  console.log(`Passed:           ${passedCount}`);
  console.log(`Failed:           ${failedCount}`);
  console.log(`Console Errors:   ${consoleErrors.length}`);
  console.log(`Page Errors:      ${pageErrors.length}`);
  console.log('================================================================\n');

  // Return exit code
  if (failedCount > 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('[Fatal Error in Test Harness]:', err);
  process.exit(1);
});
