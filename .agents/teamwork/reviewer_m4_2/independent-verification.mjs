import { chromium } from 'playwright';

async function runIndependentVerification() {
  console.log('=== REVIEWER M4-2 INDEPENDENT ADVERSARIAL & DEEP VERIFICATION ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Browser Error]:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('[Page Error]:', err.message);
  });

  const baseUrl = 'http://localhost:5173';
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Initial Landing Page
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const guestBtn = await page.locator('[data-testid="guest-audition-btn"]').first();
    assert('1. Guest button exists on landing', (await guestBtn.count()) > 0);

    // 2. Enter Guest Mode
    await guestBtn.click();
    await page.waitForTimeout(600);

    const viewport = await page.locator('.spatial-viewport').first();
    let currentTarget = await viewport.getAttribute('data-current-target');
    assert('2. Navigated to Stand (0,0)', currentTarget === 'practice');

    // 3. Test Keyboard Navigation (W / S)
    await page.keyboard.press('w');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('3a. Keyboard "W" navigated to profile (0, -1)', currentTarget === 'profile');

    await page.keyboard.press('s');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('3b. Keyboard "S" returned to practice (0, 0)', currentTarget === 'practice');

    // 4. Test Keyboard Navigation (A / D)
    await page.keyboard.press('a');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('4a. Keyboard "A" navigated to history (-1, 0)', currentTarget === 'history');

    await page.keyboard.press('d');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('4b. Keyboard "D" returned to practice (0, 0)', currentTarget === 'practice');

    await page.keyboard.press('d');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('4c. Keyboard "D" navigated to tuning (1, 0)', currentTarget === 'tuning');

    await page.keyboard.press('a');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('4d. Keyboard "A" returned to practice (0, 0)', currentTarget === 'practice');

    // 5. Test Escape Key re-centering
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('5a. ArrowUp navigated to profile', currentTarget === 'profile');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('5b. Escape re-centered to practice (0, 0)', currentTarget === 'practice');

    // 6. Test Celestial Compass buttons
    const compassHistory = await page.locator('[data-testid="compass-history"]').first();
    await compassHistory.click();
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('6a. Compass button navigated to history', currentTarget === 'history');

    const compassProfile = await page.locator('[data-testid="compass-profile"]').first();
    await compassProfile.click();
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('6b. Compass button navigated to profile', currentTarget === 'profile');

    const compassTuning = await page.locator('[data-testid="compass-tuning"]').first();
    await compassTuning.click();
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('6c. Compass button navigated to tuning', currentTarget === 'tuning');

    const compassPractice = await page.locator('[data-testid="compass-practice"]').first();
    await compassPractice.click();
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('6d. Compass button returned to practice', currentTarget === 'practice');

    // 7. Test URL Hash Sync
    await page.goto(`${baseUrl}/#history`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('7a. Direct hash #history loaded history view', currentTarget === 'history');

    await page.goto(`${baseUrl}/#profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('7b. Direct hash #profile loaded profile view', currentTarget === 'profile');

    await page.goto(`${baseUrl}/#tuning`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    currentTarget = await viewport.getAttribute('data-current-target');
    assert('7c. Direct hash #tuning loaded tuning view', currentTarget === 'tuning');

    // 8. Test Tuning Controls & Needle Physics
    const pitch415Btn = await page.locator('[data-testid="pitch-std-415"]').first();
    await pitch415Btn.click();
    await page.waitForTimeout(300);
    const subtext415 = await page.locator('text=Baroque Kammerton (J.S. Bach)').first();
    assert('8a. A4=415 Baroque Kammerton selected', (await subtext415.count()) > 0);

    const stringD4 = await page.locator('[data-testid="string-D4"]').first();
    await stringD4.click();
    await page.waitForTimeout(300);
    const targetD4 = await page.locator('[data-testid="detected-note-text"]').first();
    const noteText = await targetD4.textContent();
    assert('8b. Target string switched to D4', noteText?.includes('D4') || false, `got: ${noteText}`);

    // Test MIDI mode switch
    const midiModeBtn = await page.locator('[data-testid="mode-midi"]').first();
    await midiModeBtn.click();
    await page.waitForTimeout(300);
    const midiLabel = await page.locator('text=MIDI:').first();
    assert('8c. Switched to MIDI hardware mode', (await midiLabel.count()) > 0);

    // Switch back to Mic mode
    const micModeBtn = await page.locator('[data-testid="mode-mic"]').first();
    await micModeBtn.click();
    await page.waitForTimeout(300);

    // 9. Test Constellation History Interactions
    await compassHistory.click();
    await page.waitForTimeout(800);

    // Filter by BWV 1004 Allemande
    const bachFilterBtn = await page.locator('button:has-text("BWV 1004 Allemande")').first();
    await bachFilterBtn.click();
    await page.waitForTimeout(300);
    const takeTitle = await page.locator('h2:has-text("BWV 1004 Allemande")').first();
    assert('9a. Filtered takes by Bach BWV 1004', (await takeTitle.count()) > 0);

    // 10. Test Composer Profile Repertoire Filtering & Depart
    await compassProfile.click();
    await page.waitForTimeout(800);

    const filterConqueredBtn = await page.locator('button:has-text("Conquered")').first();
    await filterConqueredBtn.click();
    await page.waitForTimeout(300);
    const telemannCard = await page.locator('h3:has-text("12 Fantasias for Solo Violin")').first();
    assert('10a. Conquered repertoire shows Telemann Fantasias', (await telemannCard.count()) > 0);

    // Test Depart Sanctuary (Guest) button
    const exitGuestBtn = await page.locator('button:has-text("Depart Sanctuary (Exit Guest)")').first();
    await exitGuestBtn.click();
    await page.waitForTimeout(800);

    // Check we returned to Landing Page
    const landingTitle = await page.locator('h1').filter({ hasText: 'PRISM' }).first();
    assert('10b. Exiting guest returned to Landing Page', (await landingTitle.count()) > 0);

    // 11. Console & Page Errors
    assert('11a. Zero console errors throughout test', consoleErrors.length === 0, `errors: ${consoleErrors.length}`);
    assert('11b. Zero page errors throughout test', pageErrors.length === 0, `errors: ${pageErrors.length}`);

  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`REVIEWER TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIndependentVerification().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
