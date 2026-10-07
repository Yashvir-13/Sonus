/**
 * Challenger M4-2 Empirical Test Suite
 * Objective: Rigorously stress-test and empirically challenge Worker M4 deliverables:
 * 1. Verify all 4 viewports render without crashing under direct URL hash navigations (#practice, #profile, #history, #tuning)
 * 2. Verify Astrolabe dial needle rotations and resonance halo DOM states
 * 3. Inspect browser console logs for errors or warnings during full navigation tour
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const baseUrl = 'http://localhost:5173';

const results = {
  suite1_hash_nav: [],
  suite2_astrolabe: [],
  suite3_console: [],
  consoleLogs: [],
  consoleErrors: [],
  consoleWarnings: [],
  pageErrors: [],
};

function record(suite, testName, passed, details = '') {
  const item = { suite, testName, passed, details };
  results[suite].push(item);
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] [${suite}] ${testName} ${details ? `(${details})` : ''}`);
}

async function runChallenge() {
  console.log('================================================================');
  console.log('CHALLENGER M4-2 EMPIRICAL VERIFICATION & STRESS TEST HARNESS');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    // ========================================================================
    // SUITE 1: DIRECT URL HASH NAVIGATIONS & VIEWPORT INTEGRITY
    // ========================================================================
    console.log('\n--- SUITE 1: Direct URL Hash Navigations & Viewports ---');

    // Test 1.A: Cold Start direct hash navigation WITH Guest Mode session pre-set
    const targets = [
      {
        target: 'practice',
        hash: '#practice',
        viewportId: 'viewport-practice',
        contentMarker: 'Opus Manuscriptum',
      },
      {
        target: 'profile',
        hash: '#profile',
        viewportId: 'viewport-profile',
        contentMarker: 'Folio II · Persona et Physiognomia',
      },
      {
        target: 'history',
        hash: '#history',
        viewportId: 'viewport-history',
        contentMarker: 'HORIZON CRITICUS (86 BPM)',
      },
      {
        target: 'tuning',
        hash: '#tuning',
        viewportId: 'viewport-tuning',
        contentMarker: 'FOLIO IV · ACCORDATURA',
      },
    ];

    for (const t of targets) {
      console.log(`\nTesting cold direct URL hash navigation to ${t.hash}...`);
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();

      page.on('console', (msg) => {
        const text = msg.text();
        const type = msg.type();
        results.consoleLogs.push({ type, text, location: `cold-${t.target}` });
        if (type === 'error') results.consoleErrors.push({ text, location: `cold-${t.target}` });
        if (type === 'warning') results.consoleWarnings.push({ text, location: `cold-${t.target}` });
      });

      page.on('pageerror', (err) => {
        results.pageErrors.push({ message: err.message, location: `cold-${t.target}` });
        console.error(`[PAGEERROR at cold-${t.target}]: ${err.message}`);
      });

      // Set guest mode in sessionStorage before load
      await page.addInitScript(() => {
        sessionStorage.setItem('prism_guest_mode', 'true');
      });

      await page.goto(`${baseUrl}/${t.hash}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      // Verify viewport container attributes
      const viewport = await page.locator('.spatial-viewport').first();
      const currentTargetAttr = await viewport.getAttribute('data-current-target');
      record(
        'suite1_hash_nav',
        `Cold direct navigation to ${t.hash} sets data-current-target="${t.target}"`,
        currentTargetAttr === t.target,
        `got: "${currentTargetAttr}"`,
      );

      // Verify screen viewport DOM state
      const targetScreen = await page.locator(`#${t.viewportId}`).first();
      const ariaHidden = await targetScreen.getAttribute('aria-hidden');
      const isInert = await targetScreen.getAttribute('inert');
      record(
        'suite1_hash_nav',
        `Screen #${t.viewportId} is active (aria-hidden !== "true")`,
        ariaHidden !== 'true',
        `aria-hidden=${ariaHidden}`,
      );

      // Verify content marker is rendered inside the target viewport
      const marker = await page.locator(`text=${t.contentMarker}`).first();
      const markerCount = await marker.count();
      record(
        'suite1_hash_nav',
        `Content marker "${t.contentMarker}" rendered for ${t.target}`,
        markerCount > 0,
        `found=${markerCount}`,
      );

      await context.close();
    }

    // Test 1.B: Runtime In-Session URL Hash Navigation Tour
    console.log('\n--- Testing Runtime In-Session URL Hash Updates ---');
    const tourContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const tourPage = await tourContext.newPage();

    tourPage.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      results.consoleLogs.push({ type, text, location: 'tour' });
      if (type === 'error') results.consoleErrors.push({ text, location: 'tour' });
      if (type === 'warning') results.consoleWarnings.push({ text, location: 'tour' });
    });

    tourPage.on('pageerror', (err) => {
      results.pageErrors.push({ message: err.message, location: 'tour' });
      console.error(`[PAGEERROR in tour]: ${err.message}`);
    });

    await tourPage.goto(baseUrl, { waitUntil: 'networkidle' });
    // Click Guest Audition button
    const guestBtn = await tourPage.locator('[data-testid="guest-audition-btn"]').first();
    await guestBtn.click();
    await tourPage.waitForTimeout(800);

    const runtimeSequence = [
      { target: 'history', hash: '#history', expectedX: 1, expectedY: 0 },
      { target: 'profile', hash: '#profile', expectedX: 0, expectedY: 1 },
      { target: 'tuning', hash: '#tuning', expectedX: -1, expectedY: 0 },
      { target: 'practice', hash: '#practice', expectedX: 0, expectedY: 0 },
    ];

    for (const step of runtimeSequence) {
      console.log(`Setting window.location.hash = '${step.hash}'...`);
      await tourPage.evaluate((h) => {
        window.location.hash = h;
      }, step.hash);

      // Wait for spring transition to settle
      await tourPage.waitForTimeout(1400);

      const viewport = await tourPage.locator('.spatial-viewport').first();
      const currentTargetAttr = await viewport.getAttribute('data-current-target');
      record(
        'suite1_hash_nav',
        `Runtime hash change to ${step.hash} updates data-current-target to "${step.target}"`,
        currentTargetAttr === step.target,
        `got: "${currentTargetAttr}"`,
      );

      // Check canvas translation numerically allowing spring resting tolerance (±1.5vw / vh)
      const worldCanvas = await tourPage.locator('.spatial-world-canvas').first();
      const canvasStyle = (await worldCanvas.getAttribute('style')) || '';
      
      const xMatch = canvasStyle.match(/translateX\(([-0-9.]+)vw\)/);
      const yMatch = canvasStyle.match(/translateY\(([-0-9.]+)vh\)/);
      const actualX = xMatch ? parseFloat(xMatch[1]) : 0;
      const actualY = yMatch ? parseFloat(yMatch[1]) : 0;

      const expectedXNum = step.expectedX * 100;
      const expectedYNum = step.expectedY * 100;
      const xDiff = Math.abs(actualX - expectedXNum);
      const yDiff = Math.abs(actualY - expectedYNum);
      const matchesTransform = xDiff < 2.0 && yDiff < 2.0;

      record(
        'suite1_hash_nav',
        `Canvas transform settles near (${expectedXNum}vw, ${expectedYNum}vh)`,
        matchesTransform,
        `got: (${actualX.toFixed(2)}vw, ${actualY.toFixed(2)}vh), raw: ${canvasStyle}`,
      );
    }

    // Test 1.C: Browser History Navigation (Back / Forward Button Stack)
    console.log('\n--- Testing Browser History (Back / Forward) Navigation ---');
    // Navigate from practice -> history -> profile -> tuning
    await tourPage.evaluate(() => (window.location.hash = '#history'));
    await tourPage.waitForTimeout(600);
    await tourPage.evaluate(() => (window.location.hash = '#profile'));
    await tourPage.waitForTimeout(600);
    await tourPage.evaluate(() => (window.location.hash = '#tuning'));
    await tourPage.waitForTimeout(600);

    // Go back once -> should be profile
    await tourPage.goBack();
    await tourPage.waitForTimeout(800);
    let backTarget1 = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record(
      'suite1_hash_nav',
      'Browser back button returns to "profile"',
      backTarget1 === 'profile',
      `target=${backTarget1}`,
    );

    // Go back twice -> should be history
    await tourPage.goBack();
    await tourPage.waitForTimeout(800);
    let backTarget2 = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record(
      'suite1_hash_nav',
      'Browser back button returns to "history"',
      backTarget2 === 'history',
      `target=${backTarget2}`,
    );

    // Go forward once -> should return to profile
    await tourPage.goForward();
    await tourPage.waitForTimeout(800);
    let fwdTarget1 = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record(
      'suite1_hash_nav',
      'Browser forward button advances to "profile"',
      fwdTarget1 === 'profile',
      `target=${fwdTarget1}`,
    );

    // Test 1.D: Cold direct hash navigation WITHOUT Guest Session (Signed-out fallback check)
    console.log('\n--- Testing Cold Direct Hash Navigations without Guest Session ---');
    for (const t of targets) {
      const freshContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const freshPage = await freshContext.newPage();
      let hadPageError = false;
      freshPage.on('pageerror', (err) => {
        hadPageError = true;
        results.pageErrors.push({ message: err.message, location: `unauth-${t.target}` });
      });

      await freshPage.goto(`${baseUrl}/${t.hash}`, { waitUntil: 'networkidle' });
      await freshPage.waitForTimeout(400);

      // Verify no uncaught crashes
      record(
        'suite1_hash_nav',
        `Unauthenticated direct navigation to ${t.hash} does not crash`,
        !hadPageError,
      );

      // Verify landing page gracefully rendered with Guest CTA
      const guestCta = await freshPage.locator('[data-testid="guest-audition-btn"]').first();
      const ctaCount = await guestCta.count();
      record(
        'suite1_hash_nav',
        `Unauthenticated ${t.hash} renders Landing Page with Guest Audition gate`,
        ctaCount > 0,
      );

      await freshContext.close();
    }

    // ========================================================================
    // SUITE 2: ASTROLABE DIAL NEEDLE ROTATIONS & RESONANCE HALO DOM STATES
    // ========================================================================
    console.log('\n--- SUITE 2: Astrolabe Needle Rotations & Resonance Halo DOM States ---');

    // Pan tourPage to tuning viewport
    await tourPage.evaluate(() => (window.location.hash = '#tuning'));
    await tourPage.waitForTimeout(1000);

    const dial = await tourPage.locator('[data-testid="astrolabe-dial"]').first();
    const needle = await tourPage.locator('[data-testid="astrolabe-needle"]').first();
    record('suite2_astrolabe', 'Astrolabe SVG dial rendered', (await dial.count()) > 0);
    record('suite2_astrolabe', 'Astrolabe needle element rendered', (await needle.count()) > 0);

    // Inspect Resonance Halo circle element
    // In SVG: circle with r=142
    const haloLocator = tourPage.locator('[data-testid="astrolabe-dial"] circle[r="142"]').first();
    record('suite2_astrolabe', 'Resonance halo circle (r=142) found in DOM', (await haloLocator.count()) > 0);

    // Test 2.1: In-Tune Equilibrium (0¢)
    console.log('\nTesting 0¢ In-Tune Equilibrium...');
    await tourPage.locator('[data-testid="test-in-tune"]').first().click();
    await tourPage.waitForTimeout(300);

    // 1. Needle Rotation
    const needleStyleInTune = await needle.getAttribute('style');
    const isRotate0 = needleStyleInTune?.includes('rotate(0deg)');
    record(
      'suite2_astrolabe',
      'Needle rotation style is exactly "rotate(0deg)" at 0¢',
      isRotate0,
      needleStyleInTune || '',
    );

    // 2. Needle blade fill color (crimson #9A2A2A when in-tune)
    const bladeInTune = tourPage.locator('[data-testid="astrolabe-needle"] polygon').first();
    const bladeFillInTune = await bladeInTune.getAttribute('fill');
    record(
      'suite2_astrolabe',
      'Needle blade fill is crimson (#9A2A2A) when in-tune',
      bladeFillInTune === '#9A2A2A',
      `fill=${bladeFillInTune}`,
    );

    // 3. Pivot center dot fill (crimson #9A2A2A when in-tune, gold #C8A858 when out-of-tune)
    const pivotCenterInTune = tourPage.locator('[data-testid="astrolabe-needle"] circle[cy="160"][r="4"]').first();
    const pivotFillInTune = await pivotCenterInTune.getAttribute('fill');
    record(
      'suite2_astrolabe',
      'Needle pivot center dot fill is crimson (#9A2A2A) when in-tune',
      pivotFillInTune === '#9A2A2A',
      `fill=${pivotFillInTune}`,
    );

    // 4. Resonance Halo Circle DOM State
    const haloStrokeInTune = await haloLocator.getAttribute('stroke');
    const haloWidthInTune = await haloLocator.getAttribute('stroke-width');
    const haloOpacityInTune = await haloLocator.getAttribute('stroke-opacity');
    const haloFilterInTune = await haloLocator.getAttribute('filter');

    record(
      'suite2_astrolabe',
      'Resonance halo stroke is crimson (#9A2A2A) when in-tune',
      haloStrokeInTune === '#9A2A2A',
      `stroke=${haloStrokeInTune}`,
    );
    record(
      'suite2_astrolabe',
      'Resonance halo stroke-width is bold (3) when in-tune',
      haloWidthInTune === '3',
      `strokeWidth=${haloWidthInTune}`,
    );
    record(
      'suite2_astrolabe',
      'Resonance halo stroke-opacity is high (0.95) when in-tune',
      haloOpacityInTune === '0.95',
      `strokeOpacity=${haloOpacityInTune}`,
    );
    record(
      'suite2_astrolabe',
      'Resonance halo has active SVG gaussian glow filter',
      haloFilterInTune?.includes('halo-glow') || false,
      `filter=${haloFilterInTune}`,
    );

    // 5. Rubric Status Seal
    const rubricTextInTune = await tourPage.locator('text=HARMONIA PERFECTA (IN EQUILIBRIO)').first();
    record(
      'suite2_astrolabe',
      'Status seal displays "HARMONIA PERFECTA (IN EQUILIBRIO)"',
      (await rubricTextInTune.count()) > 0,
    );

    // Test 2.2: Flat Indication (-18¢ -> -21.6°)
    console.log('\nTesting -18¢ Flat State...');
    await tourPage.locator('[data-testid="test-flat"]').first().click();
    await tourPage.waitForTimeout(300);

    // 1. Needle Rotation
    const needleStyleFlat = await needle.getAttribute('style');
    const isRotateFlat = needleStyleFlat?.includes('rotate(-21.6deg)');
    record(
      'suite2_astrolabe',
      'Needle rotation style is exactly "rotate(-21.6deg)" at -18¢',
      isRotateFlat,
      needleStyleFlat || '',
    );

    // 2. Needle blade fill color (charcoal #2C2A29 when out-of-tune)
    const bladeFillFlat = await bladeInTune.getAttribute('fill');
    record(
      'suite2_astrolabe',
      'Needle blade fill reverts to charcoal (#2C2A29) when flat',
      bladeFillFlat === '#2C2A29',
      `fill=${bladeFillFlat}`,
    );

    const pivotFillFlat = await pivotCenterInTune.getAttribute('fill');
    record(
      'suite2_astrolabe',
      'Needle pivot center dot fill reverts to gold (#C8A858) when flat',
      pivotFillFlat === '#C8A858',
      `fill=${pivotFillFlat}`,
    );

    // 3. Resonance Halo Circle DOM State (Inactive)
    const haloStrokeFlat = await haloLocator.getAttribute('stroke');
    const haloWidthFlat = await haloLocator.getAttribute('stroke-width');
    const haloOpacityFlat = await haloLocator.getAttribute('stroke-opacity');
    const haloFilterFlat = await haloLocator.getAttribute('filter');

    record(
      'suite2_astrolabe',
      'Resonance halo stroke is muted charcoal (#2C2A29) when flat',
      haloStrokeFlat === '#2C2A29',
      `stroke=${haloStrokeFlat}`,
    );
    record(
      'suite2_astrolabe',
      'Resonance halo stroke-width is hairline (0.75) when flat',
      haloWidthFlat === '0.75',
      `strokeWidth=${haloWidthFlat}`,
    );
    record(
      'suite2_astrolabe',
      'Resonance halo stroke-opacity is faint (0.2) when flat',
      haloOpacityFlat === '0.2',
      `strokeOpacity=${haloOpacityFlat}`,
    );
    record(
      'suite2_astrolabe',
      'Resonance halo glow filter is removed when flat',
      !haloFilterFlat || haloFilterFlat === 'none',
      `filter=${haloFilterFlat}`,
    );

    // 4. Status Seal
    const rubricTextFlat = await tourPage.locator('text=BEMOLLE ♭ (-18.0¢ FLAT)').first();
    record(
      'suite2_astrolabe',
      'Status seal displays "BEMOLLE ♭ (-18.0¢ FLAT)"',
      (await rubricTextFlat.count()) > 0,
    );

    // Test 2.3: Sharp Indication (+24¢ -> +28.8°)
    console.log('\nTesting +24¢ Sharp State...');
    await tourPage.locator('[data-testid="test-sharp"]').first().click();
    await tourPage.waitForTimeout(300);

    // 1. Needle Rotation
    const needleStyleSharp = await needle.getAttribute('style');
    const isRotateSharp = needleStyleSharp?.includes('rotate(28.8deg)');
    record(
      'suite2_astrolabe',
      'Needle rotation style is exactly "rotate(28.8deg)" at +24¢',
      isRotateSharp,
      needleStyleSharp || '',
    );

    // 2. Halo filter removed
    const haloFilterSharp = await haloLocator.getAttribute('filter');
    record(
      'suite2_astrolabe',
      'Resonance halo glow filter is removed when sharp',
      !haloFilterSharp || haloFilterSharp === 'none',
      `filter=${haloFilterSharp}`,
    );

    // 3. Status Seal
    const rubricTextSharp = await tourPage.locator('text=DIESIS ♯ (+24.0¢ SHARP)').first();
    record(
      'suite2_astrolabe',
      'Status seal displays "DIESIS ♯ (+24.0¢ SHARP)"',
      (await rubricTextSharp.count()) > 0,
    );

    // Test 2.4: Return to In-Tune Equilibrium
    console.log('\nTesting return to 0¢ In-Tune...');
    await tourPage.locator('[data-testid="test-in-tune"]').first().click();
    await tourPage.waitForTimeout(300);

    const haloFilterRestored = await haloLocator.getAttribute('filter');
    record(
      'suite2_astrolabe',
      'Resonance halo glow filter dynamically re-activates upon returning to equilibrium',
      haloFilterRestored?.includes('halo-glow') || false,
      `filter=${haloFilterRestored}`,
    );

    // ========================================================================
    // SUITE 3: CONSOLE HEALTH & LOG AUDIT ACROSS FULL TOUR
    // ========================================================================
    console.log('\n--- SUITE 3: Browser Console Health & Log Audit ---');

    // Perform keyboard navigation & compass clicks to ensure exhaustive tour
    console.log('Testing keyboard navigation (Arrow keys & Escape)...');
    await tourPage.keyboard.press('Escape'); // Re-center to practice
    await tourPage.waitForTimeout(800);
    const centerTarget = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record('suite3_console', 'Escape key returns camera to "practice"', centerTarget === 'practice');

    // Up arrow to profile
    await tourPage.keyboard.press('ArrowUp');
    await tourPage.waitForTimeout(800);
    const upTarget = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record('suite3_console', 'ArrowUp key navigates camera to "profile"', upTarget === 'profile');

    // Down arrow to return to practice
    await tourPage.keyboard.press('ArrowDown');
    await tourPage.waitForTimeout(800);

    // Left arrow to history
    await tourPage.keyboard.press('ArrowLeft');
    await tourPage.waitForTimeout(800);
    const leftTarget = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record('suite3_console', 'ArrowLeft key navigates camera to "history"', leftTarget === 'history');

    // Right arrow to return to practice
    await tourPage.keyboard.press('ArrowRight');
    await tourPage.waitForTimeout(800);

    // Test Celestial Compass Mini-map buttons
    console.log('Testing Celestial Compass Mini-map buttons...');
    const compassTuning = tourPage.locator('[data-testid="compass-tuning"]').first();
    await compassTuning.click();
    await tourPage.waitForTimeout(800);
    const compassTuningTarget = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record(
      'suite3_console',
      'Celestial compass button pans to "tuning"',
      compassTuningTarget === 'tuning',
    );

    const compassPractice = tourPage.locator('[data-testid="compass-practice"]').first();
    await compassPractice.click();
    await tourPage.waitForTimeout(800);
    const compassPracticeTarget = await tourPage
      .locator('.spatial-viewport')
      .first()
      .getAttribute('data-current-target');
    record(
      'suite3_console',
      'Celestial compass button pans to "practice"',
      compassPracticeTarget === 'practice',
    );

    // Audit console errors
    record(
      'suite3_console',
      'Zero console.error events logged during entire test tour',
      results.consoleErrors.length === 0,
      `count=${results.consoleErrors.length}`,
    );

    // Audit page errors
    record(
      'suite3_console',
      'Zero unhandled pageerror / runtime exceptions occurred',
      results.pageErrors.length === 0,
      `count=${results.pageErrors.length}`,
    );

    // Audit console warnings
    console.log(`\nObserved console warnings count: ${results.consoleWarnings.length}`);
    for (const w of results.consoleWarnings) {
      console.log(`[Observed Warning]: (${w.location}) ${w.text}`);
    }

    const nonDevClerkWarnings = results.consoleWarnings.filter(
      (w) => !w.text.includes('Clerk has been loaded with development keys'),
    );
    record(
      'suite3_console',
      'Zero non-Clerk console warnings (clean runtime logs)',
      nonDevClerkWarnings.length === 0,
      `non-Clerk count=${nonDevClerkWarnings.length}`,
    );

    await tourContext.close();
  } finally {
    await browser.close();
  }

  // Print Summary
  console.log('\n================================================================');
  console.log('CHALLENGE EXECUTION SUMMARY');
  console.log('================================================================');
  const allTests = [
    ...results.suite1_hash_nav,
    ...results.suite2_astrolabe,
    ...results.suite3_console,
  ];
  const passed = allTests.filter((t) => t.passed).length;
  const failed = allTests.filter((t) => !t.passed).length;

  console.log(`Total Assertions: ${allTests.length}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log(`Console Errors:   ${results.consoleErrors.length}`);
  console.log(`Page Errors:      ${results.pageErrors.length}`);
  console.log('================================================================\n');

  if (failed > 0 || results.consoleErrors.length > 0 || results.pageErrors.length > 0) {
    console.error('CHALLENGE RESULT: FAILURES DETECTED');
    process.exit(1);
  } else {
    console.log('CHALLENGE RESULT: ALL VERIFICATIONS PASSED');
    process.exit(0);
  }
}

runChallenge().catch((err) => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
