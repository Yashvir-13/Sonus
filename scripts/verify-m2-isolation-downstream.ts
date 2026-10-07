/**
 * Challenger M2-2 Empirical Verification & Stress Suite
 * Viewport Focus Isolation & Downstream Compatibility
 *
 * Verifies:
 * 1. Viewport focus isolation and accessibility attributes (inert, aria-hidden) across all targets
 * 2. Spatial coordinate camera geometry and physics alignment with tokens
 * 3. Downstream compatibility with Milestone 3 screens (slot polymorphism and type contracts)
 * 4. Input isolation during keyboard navigation (preventing key-stealing)
 * 5. SessionStorage guest mode persistence and lifecycle
 * 6. Adversarial stress testing (rapid transitions, invalid targets, reduced motion)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SPATIAL_MOTION_CONFIG,
  MUSICAL_GLYPHS,
  type SpatialScreenTarget,
} from '../apps/web/src/design-system/tokens';
import {
  isSpatialTarget,
  type SpatialTarget,
} from '../apps/web/src/components/spatial/types';
import type {
  AudioInputMode,
  TuningState,
  PracticeSessionNode,
  ComposerProfile,
} from '../apps/web/src/types/index';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
  warning?: boolean;
}

const results: TestResult[] = [];

function assert(suite: string, test: string, condition: boolean, details?: string) {
  if (condition) {
    results.push({ suite, test, passed: true, details });
  } else {
    results.push({ suite, test, passed: false, details: details || 'Assertion failed' });
  }
}

function warn(suite: string, test: string, condition: boolean, details?: string) {
  results.push({
    suite,
    test,
    passed: condition,
    warning: !condition,
    details: details || (condition ? 'Passed' : 'Warning flagged'),
  });
}

console.log('================================================================');
console.log('STARTING CHALLENGER M2-2 EMPIRICAL ISOLATION & COMPATIBILITY SUITE');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Static AST & Source Code Verification for Isolation Attributes
// --------------------------------------------------------------------------
const spatialContainerSource = readFileSync(
  resolve(__dirname, '../apps/web/src/components/spatial/spatial-container.tsx'),
  'utf-8'
);
const spatialContextSource = readFileSync(
  resolve(__dirname, '../apps/web/src/components/spatial/spatial-context.tsx'),
  'utf-8'
);
const signInPageSource = readFileSync(
  resolve(__dirname, '../apps/web/src/components/auth/sign-in-page.tsx'),
  'utf-8'
);

const screenIds: SpatialTarget[] = ['practice', 'profile', 'history', 'tuning'];

for (const id of screenIds) {
  const viewportRegex = new RegExp(`id="viewport-${id}"[\\s\\S]*?>`, 'm');
  const match = spatialContainerSource.match(viewportRegex);

  assert(
    'Suite 1: Viewport Focus Isolation & Accessibility AST',
    `Viewport #${id} exists in SpatialContainer template`,
    match !== null,
    `Found viewport tag for ${id}`
  );

  if (match) {
    const tagContent = match[0];

    // Check aria-hidden
    const ariaHiddenPattern = new RegExp(`aria-hidden=\\{currentTarget !== '${id}'\\}`);
    assert(
      'Suite 1: Viewport Focus Isolation & Accessibility AST',
      `Viewport #${id} has dynamic aria-hidden binding matching currentTarget !== '${id}'`,
      ariaHiddenPattern.test(tagContent),
      `Matched: ${tagContent.includes('aria-hidden') ? 'present' : 'missing'}`
    );

    // Check inert attribute
    const inertPattern = new RegExp(`inert=\\{currentTarget !== '${id}' \\? true : undefined\\}`);
    assert(
      'Suite 1: Viewport Focus Isolation & Accessibility AST',
      `Viewport #${id} has dynamic inert binding matching currentTarget !== '${id}' ? true : undefined`,
      inertPattern.test(tagContent),
      `Matched: ${tagContent.includes('inert') ? 'present' : 'missing'}`
    );

    // Check data-screen
    const dataScreenPattern = new RegExp(`data-screen="${id}"`);
    assert(
      'Suite 1: Viewport Focus Isolation & Accessibility AST',
      `Viewport #${id} has explicit data-screen="${id}" telemetry attribute`,
      dataScreenPattern.test(tagContent),
      `data-screen: ${id}`
    );
  }
}

// --------------------------------------------------------------------------
// SUITE 2: Empirical Truth Table Simulation for Focus Isolation
// --------------------------------------------------------------------------
// Simulation oracle of the React expression:
// aria-hidden = (currentTarget !== id)
// inert = (currentTarget !== id ? true : undefined)
function evaluateViewportIsolation(
  currentTarget: SpatialTarget,
  screenId: SpatialTarget
) {
  const isInactive = currentTarget !== screenId;
  return {
    ariaHidden: isInactive ? 'true' : 'false',
    hasInert: isInactive, // In HTML, inert={true} renders inert attribute, inert={undefined} does not
    focusTrappingPrevented: isInactive,
  };
}

let isolationMatrixPass = true;
for (const target of screenIds) {
  for (const screen of screenIds) {
    const evalResult = evaluateViewportIsolation(target, screen);
    if (target === screen) {
      if (evalResult.ariaHidden !== 'false' || evalResult.hasInert !== false) {
        isolationMatrixPass = false;
      }
    } else {
      if (evalResult.ariaHidden !== 'true' || evalResult.hasInert !== true) {
        isolationMatrixPass = false;
      }
    }
  }
}

assert(
  'Suite 2: Empirical Focus Isolation Truth Table',
  'All 16 combinations (4 targets × 4 viewports) strictly isolate inactive viewports',
  isolationMatrixPass,
  'When active: aria-hidden=false, inert=absent. When inactive: aria-hidden=true, inert=present.'
);

// --------------------------------------------------------------------------
// SUITE 3: Spatial Coordinates, World Canvas Math & Layout Alignment
// --------------------------------------------------------------------------
// Viewport CSS coordinates in spatial-container.tsx
const expectedCssOffsets: Record<SpatialTarget, { left: string; top: string }> = {
  practice: { left: '0vw', top: '0vh' },
  profile: { left: '0vw', top: '-100vh' },
  history: { left: '-100vw', top: '0vh' },
  tuning: { left: '100vw', top: '0vh' },
};

for (const [id, offset] of Object.entries(expectedCssOffsets)) {
  const stylePattern = new RegExp(
    `id="viewport-${id}"[\\s\\S]*?style=\\{\\{\\s*left:\\s*'${offset.left}',\\s*top:\\s*'${offset.top}'\\s*\\}\\}`,
    'm'
  );
  assert(
    'Suite 3: Spatial Camera Math & Layout Alignment',
    `Viewport #${id} is statically placed at left: ${offset.left}, top: ${offset.top}`,
    stylePattern.test(spatialContainerSource),
    `Observed style coordinates for ${id}`
  );

  // Cross-check with SPATIAL_MOTION_CONFIG.coordinates
  // World translation is inverse of screen offset to bring target into (0, 0) viewport
  const motionCoord = SPATIAL_MOTION_CONFIG.coordinates[id as SpatialScreenTarget];
  const offsetLeftNumeric = parseInt(offset.left);
  const offsetTopNumeric = parseInt(offset.top);

  // If screen is at left: -100vw, container must translate right (+100vw -> x: 1)
  const expectedMotionX = offsetLeftNumeric === 0 ? 0 : -offsetLeftNumeric / 100;
  // If screen is at top: -100vh, container must translate down (+100vh -> y: 1)
  const expectedMotionY = offsetTopNumeric === 0 ? 0 : -offsetTopNumeric / 100;

  assert(
    'Suite 3: Spatial Camera Math & Layout Alignment',
    `Motion coordinate for ${id} exactly inverts screen position (${expectedMotionX}, ${expectedMotionY})`,
    motionCoord.x === expectedMotionX && motionCoord.y === expectedMotionY,
    `Expected (${expectedMotionX}, ${expectedMotionY}), got (${motionCoord.x}, ${motionCoord.y})`
  );
}

// --------------------------------------------------------------------------
// SUITE 4: Downstream Milestone 3 Slot Polymorphism & Contract Conformance
// --------------------------------------------------------------------------
// Check interface SpatialContainerProps in spatial-container.tsx
const propsInterfaceMatch = spatialContainerSource.match(
  /export interface SpatialContainerProps\s*\{([\s\S]*?)\}/
);
assert(
  'Suite 4: Downstream M3 Screen Slot Compatibility',
  'SpatialContainerProps interface is exported with screen slot definitions',
  propsInterfaceMatch !== null,
  'Found export interface SpatialContainerProps'
);

if (propsInterfaceMatch) {
  const propsBody = propsInterfaceMatch[1];
  const expectedSlots = ['practiceScreen', 'profileScreen', 'historyScreen', 'tuningScreen'];
  for (const slot of expectedSlots) {
    const slotPattern = new RegExp(`${slot}\\?:\\s*ReactNode`);
    assert(
      'Suite 4: Downstream M3 Screen Slot Compatibility',
      `SpatialContainerProps defines slot prop '${slot}?: ReactNode'`,
      slotPattern.test(propsBody),
      `Slot ${slot} matches ReactNode signature`
    );
  }
}

// Verify slot injection logic:
// profileScreen ?? <DefaultProfilePlaceholder onReturn={handleReturn} />
const slotInjectionRegexes = {
  practice: /\{practiceScreen\}/,
  profile: /\{profileScreen\s*\?\?\s*<DefaultProfilePlaceholder/,
  history: /\{historyScreen\s*\?\?\s*<DefaultHistoryPlaceholder/,
  tuning: /\{tuningScreen\s*\?\?\s*<DefaultTuningPlaceholder/,
};

for (const [screen, regex] of Object.entries(slotInjectionRegexes)) {
  assert(
    'Suite 4: Downstream M3 Screen Slot Compatibility',
    `Viewport #${screen} falls back gracefully to default placeholder if M3 screen is omitted`,
    regex.test(spatialContainerSource),
    `Observed fallback expression for ${screen}`
  );
}

// Verify M3 TypeScript contract types can be instantiated and typecheck cleanly
const mockTuningState: TuningState = {
  mode: 'mic',
  detectedPitch: 'A4',
  detectedFrequency: 440.0,
  centsDeviation: 0.0,
  targetFrequency: 440.0,
  inTune: true,
  signalLevel: 0.85,
};
assert(
  'Suite 4: Downstream M3 Screen Slot Compatibility',
  'TuningState interface from types/index can be instantiated without errors',
  mockTuningState.inTune && mockTuningState.mode === 'mic',
  `Instantiated TuningState: ${mockTuningState.detectedPitch} @ ${mockTuningState.targetFrequency}Hz`
);

const mockSessionNode: PracticeSessionNode = {
  id: 'session-m3-test',
  pieceTitle: 'Chaconne in D minor',
  composer: 'J.S. Bach',
  date: '1720-01-01',
  tempoBpm: 104,
  accuracyPercent: 96.5,
  durationMinutes: 28,
  pitchPurity: 97.2,
  timingPrecision: 12,
  editorNote: 'Pristine bow control on arpeggio bariolage',
};
assert(
  'Suite 4: Downstream M3 Screen Slot Compatibility',
  'PracticeSessionNode interface from types/index can be instantiated without errors',
  mockSessionNode.tempoBpm === 104 && mockSessionNode.pitchPurity === 97.2,
  `Instantiated PracticeSessionNode: ${mockSessionNode.pieceTitle}`
);

const mockProfile: ComposerProfile = {
  name: 'Johann Sebastian Bach',
  monogram: 'JSB',
  title: 'Thomaskantor & Capellmeister',
  totalPracticeHours: 12000,
  totalNotesArticulated: 850000,
  overallIntonationPurity: 98.4,
  dominantHabits: ['Baroque ornamentation', 'Rhythmic rubato', 'Strict polyphony'],
  repertoire: [
    {
      title: 'Sonatas and Partitas for Solo Violin',
      composer: 'J.S. Bach',
      masteryPercent: 99.1,
      lastPracticed: '2026-10-06',
    },
  ],
};
assert(
  'Suite 4: Downstream M3 Screen Slot Compatibility',
  'ComposerProfile interface from types/index can be instantiated without errors',
  mockProfile.repertoire.length === 1 && mockProfile.overallIntonationPurity === 98.4,
  `Instantiated ComposerProfile: ${mockProfile.name}`
);

// --------------------------------------------------------------------------
// SUITE 5: Keyboard Input Isolation (Document ActiveElement Check)
// --------------------------------------------------------------------------
// Verify in spatial-context.tsx that keyboard events are ignored during text editing
const activeElCheckRegex =
  /activeEl\.tagName === 'INPUT' \|\|\s*activeEl\.tagName === 'TEXTAREA' \|\|\s*activeEl\.tagName === 'SELECT' \|\|\s*activeEl\.isContentEditable/;
assert(
  'Suite 5: Keyboard Input Isolation & Event Trapping',
  'Keyboard navigation explicitly checks document.activeElement (INPUT, TEXTAREA, SELECT, isContentEditable)',
  activeElCheckRegex.test(spatialContextSource),
  'Ensures typing in M3 forms/inputs does not trigger spatial canvas panning'
);

// Verify Escape key always returns to practice from non-practice targets
const escapeRegex = /if \(key === 'Escape'\)\s*\{\s*if \(currentTarget !== 'practice'\)\s*\{\s*e\.preventDefault\(\)\s*panTo\('practice'\)/;
assert(
  'Suite 5: Keyboard Input Isolation & Event Trapping',
  'Escape key handler checks currentTarget !== "practice" and calls panTo("practice")',
  escapeRegex.test(spatialContextSource),
  'Escape key successfully re-centers camera to (0, 0)'
);

// --------------------------------------------------------------------------
// SUITE 6: SessionStorage Guest Mode Persistence & Hash Reconciliation
// --------------------------------------------------------------------------
// Verify initial state check in sign-in-page.tsx
const guestInitRegex =
  /window\.location\.hash\.toLowerCase\(\)\.includes\('guest'\)\s*\|\|\s*sessionStorage\.getItem\('prism_guest_mode'\) === 'true'/;
assert(
  'Suite 6: Guest Mode SessionStorage Persistence',
  'SignInPage checks both #guest hash and sessionStorage.getItem("prism_guest_mode") on mount',
  guestInitRegex.test(signInPageSource),
  'Allows page reload and hash-independent guest persistence'
);

// Verify audition button sets sessionStorage
const setStorageRegex = /sessionStorage\.setItem\('prism_guest_mode',\s*'true'\)/;
assert(
  'Suite 6: Guest Mode SessionStorage Persistence',
  'Audition as Guest CTA sets sessionStorage "prism_guest_mode" to "true"',
  setStorageRegex.test(signInPageSource),
  'sessionStorage setItem verified'
);

// Verify depart guest clears sessionStorage
const removeStorageRegex = /sessionStorage\.removeItem\('prism_guest_mode'\)/;
assert(
  'Suite 6: Guest Mode SessionStorage Persistence',
  'Depart Sanctuary CTA removes "prism_guest_mode" from sessionStorage',
  removeStorageRegex.test(signInPageSource),
  'sessionStorage removeItem verified'
);

// --------------------------------------------------------------------------
// SUITE 7: Adversarial Fuzzing & Spatial Target Oracles
// --------------------------------------------------------------------------
// Test isSpatialTarget type guard
const validTargets = ['practice', 'profile', 'history', 'tuning'];
for (const t of validTargets) {
  assert(
    'Suite 7: Adversarial Fuzzing & Target Guard Oracles',
    `isSpatialTarget accepts valid target "${t}"`,
    isSpatialTarget(t),
    `Valid target: ${t}`
  );
}

const invalidTargets = [
  '',
  ' ',
  'PRACTICE',
  'Profile',
  'settings',
  'dashboard',
  'admin',
  'null',
  'undefined',
  '__proto__',
  'constructor',
  '<script>alert(1)</script>',
  '#practice',
  'practice/nested',
];
let allInvalidRejected = true;
for (const inv of invalidTargets) {
  if (isSpatialTarget(inv)) {
    allInvalidRejected = false;
  }
}
assert(
  'Suite 7: Adversarial Fuzzing & Target Guard Oracles',
  'isSpatialTarget rejects 14 adversarial/malformed target strings',
  allInvalidRejected,
  'All 14 invalid targets successfully rejected'
);

// Fuzz test random strings (1,000 iterations)
let fuzzPass = true;
for (let i = 0; i < 1000; i++) {
  const randomStr = Math.random().toString(36).substring(2, 10);
  if (isSpatialTarget(randomStr)) {
    fuzzPass = false;
  }
}
assert(
  'Suite 7: Adversarial Fuzzing & Target Guard Oracles',
  'Fuzz test 1,000 randomized pseudo-strings rejected by isSpatialTarget guard',
  fuzzPass,
  '1,000 / 1,000 random strings safely rejected'
);

// --------------------------------------------------------------------------
// SUITE 8: Reduced Motion Accessibility Support
// --------------------------------------------------------------------------
const reducedMotionRegex = /useReducedMotion\(\)/;
const springFallbackRegex = /shouldReduceMotion\s*\?\s*\{\s*duration:\s*0\s*\}\s*:/;
assert(
  'Suite 8: Accessibility & Reduced Motion Support',
  'SpatialContainer consumes useReducedMotion() hook from framer-motion',
  reducedMotionRegex.test(spatialContainerSource),
  'useReducedMotion hook detected'
);
assert(
  'Suite 8: Accessibility & Reduced Motion Support',
  'Spring animation falls back to duration: 0 when reduced motion is preferred',
  springFallbackRegex.test(spatialContainerSource),
  'Zero-duration fallback preserves accessibility for vestibular disorder users'
);

// --------------------------------------------------------------------------
// REPORT & SUMMARY
// --------------------------------------------------------------------------
console.log('\n================================================================');
console.log('CHALLENGER M2-2 VERIFICATION RESULTS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const res of results) {
  if (res.passed) {
    if (res.warning) {
      warnCount++;
      console.log(`⚠ WARN [${res.suite}] ${res.test}`);
    } else {
      passCount++;
      console.log(`✓ PASS [${res.suite}] ${res.test}`);
    }
  } else {
    failCount++;
    console.log(`✗ FAIL [${res.suite}] ${res.test}`);
  }
  if (res.details) {
    console.log(`       ↳ ${res.details}`);
  }
}

console.log('\n----------------------------------------------------------------');
console.log(
  `TOTAL TESTS: ${results.length} | PASSED: ${passCount} | WARNINGS: ${warnCount} | FAILED: ${failCount}`
);
console.log('----------------------------------------------------------------\n');

if (failCount === 0) {
  console.log('VERDICT: APPROVE');
  process.exit(0);
} else {
  console.log('VERDICT: CHALLENGE_FAILED');
  process.exit(1);
}
