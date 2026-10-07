/**
 * Challenger M1-2 Empirical Verification & Adversarial Stress Suite
 * 
 * Verifies:
 * 1. Stitch Project Record and Manifest Schema Integrity
 * 2. M2 Spatial Canvas Interface Contract & Coordinate Alignment
 * 3. M3 Core Screen Blueprints (Landing, Tuning, Profile, History)
 * 4. Mathematical Mapping Oracles and Formulas
 * 5. PracticeSessionNode and ComposerProfile Type Conformance
 * 6. Adversarial Fuzzing & Stress Testing (10,000 randomized inputs)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LIVING_MANUSCRIPT_COLORS,
  LIVING_MANUSCRIPT_FONTS,
  LIVING_MANUSCRIPT_GEOMETRY,
  MUSICAL_GLYPHS,
  SPATIAL_MOTION_CONFIG,
  LANDING_SCREEN_SPEC,
  TUNING_RITUAL_SPEC,
  COMPOSER_PROFILE_SPEC,
  CONSTELLATION_HISTORY_SPEC,
} from '../apps/web/src/design-system/index';

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
    details: details || (condition ? 'Passed' : 'Warning/Minor deviation flagged'),
  });
}

console.log('================================================================');
console.log('STARTING CHALLENGER M1-2 EMPIRICAL CONTRACT VERIFICATION SUITE');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Stitch Project Record & Manifest Schema Integrity
// --------------------------------------------------------------------------
const suite1 = 'Suite 1: Stitch Project Record & Manifest';
const manifestPath = resolve(process.cwd(), 'apps/web/src/design-system/stitch-manifest.json');
let manifest: any;

try {
  const content = readFileSync(manifestPath, 'utf-8');
  manifest = JSON.parse(content);
  assert(suite1, 'Manifest JSON parses successfully', true, `Size: ${content.length} bytes`);
} catch (err: any) {
  assert(suite1, 'Manifest JSON parses successfully', false, err.message);
}

if (manifest) {
  assert(
    suite1,
    'Stitch Project ID matches projects/9549558010017871216',
    manifest.projectId === 'projects/9549558010017871216',
    `Observed: ${manifest.projectId}`
  );

  assert(
    suite1,
    'Execution mode is CONTINGENCY_FALLBACK',
    manifest.executionMode === 'CONTINGENCY_FALLBACK',
    `Observed: ${manifest.executionMode}`
  );

  assert(
    suite1,
    'Cloud tool history records create_project as SUCCESS',
    Array.isArray(manifest.cloudToolHistory) &&
      manifest.cloudToolHistory.some(
        (h: any) => h.tool === 'StitchMCP/create_project' && h.status === 'SUCCESS' && h.result?.name === 'projects/9549558010017871216'
      ),
    'Verified create_project tool record'
  );

  assert(
    suite1,
    'Cloud tool history records create_design_system timeout and circuit breaker',
    Array.isArray(manifest.cloudToolHistory) &&
      manifest.cloudToolHistory.some(
        (h: any) => h.tool === 'StitchMCP/create_design_system' && h.status === 'TIMEOUT_PERMISSION' && h.circuitBreaker?.includes('TRIPPED')
      ),
    'Verified circuit breaker tripped record'
  );

  assert(
    suite1,
    'Manifest contains exactly 4 screens with ready status',
    Array.isArray(manifest.screens) &&
      manifest.screens.length === 4 &&
      manifest.screens.every((s: any) => s.status === 'READY_FOR_IMPLEMENTATION'),
    `Screens found: ${manifest.screens?.map((s: any) => s.id).join(', ')}`
  );

  assert(
    suite1,
    'Downstream handshakes defined for M2, M3, and M4',
    Boolean(manifest.downstreamHandshake?.milestone2 && manifest.downstreamHandshake?.milestone3 && manifest.downstreamHandshake?.milestone4),
    'Handshake nodes present'
  );
}

// --------------------------------------------------------------------------
// SUITE 2: M2 Spatial Canvas Interface Contract & Coordinates
// --------------------------------------------------------------------------
const suite2 = 'Suite 2: M2 Spatial Canvas Interface Contract';

assert(
  suite2,
  'Spring physics values conform to PROJECT.md (stiffness: 70, damping: 18)',
  SPATIAL_MOTION_CONFIG.spring.stiffness === 70 && SPATIAL_MOTION_CONFIG.spring.damping === 18 && SPATIAL_MOTION_CONFIG.spring.mass === 1,
  `Stiffness: ${SPATIAL_MOTION_CONFIG.spring.stiffness}, Damping: ${SPATIAL_MOTION_CONFIG.spring.damping}`
);

assert(
  suite2,
  'Practice Stand coordinate is center (0, 0)',
  SPATIAL_MOTION_CONFIG.coordinates.practice.x === 0 && SPATIAL_MOTION_CONFIG.coordinates.practice.y === 0,
  `Observed: (${SPATIAL_MOTION_CONFIG.coordinates.practice.x}, ${SPATIAL_MOTION_CONFIG.coordinates.practice.y})`
);

assert(
  suite2,
  'Profile camera translation coordinate is (0, 1) [container translateY down reveals Up screen]',
  SPATIAL_MOTION_CONFIG.coordinates.profile.x === 0 && SPATIAL_MOTION_CONFIG.coordinates.profile.y === 1,
  `Observed: (${SPATIAL_MOTION_CONFIG.coordinates.profile.x}, ${SPATIAL_MOTION_CONFIG.coordinates.profile.y})`
);

assert(
  suite2,
  'History camera translation coordinate is (1, 0) [container translateX right reveals Left screen]',
  SPATIAL_MOTION_CONFIG.coordinates.history.x === 1 && SPATIAL_MOTION_CONFIG.coordinates.history.y === 0,
  `Observed: (${SPATIAL_MOTION_CONFIG.coordinates.history.x}, ${SPATIAL_MOTION_CONFIG.coordinates.history.y})`
);

assert(
  suite2,
  'Tuning camera translation coordinate is (-1, 0) [container translateX left reveals Right screen]',
  SPATIAL_MOTION_CONFIG.coordinates.tuning.x === -1 && SPATIAL_MOTION_CONFIG.coordinates.tuning.y === 0,
  `Observed: (${SPATIAL_MOTION_CONFIG.coordinates.tuning.x}, ${SPATIAL_MOTION_CONFIG.coordinates.tuning.y})`
);

assert(
  suite2,
  'Composer Profile screen blueprint defines grid coordinate (0, -1)',
  COMPOSER_PROFILE_SPEC.spatialCoordinates.x === 0 && COMPOSER_PROFILE_SPEC.spatialCoordinates.y === -1,
  `Observed: (${COMPOSER_PROFILE_SPEC.spatialCoordinates.x}, ${COMPOSER_PROFILE_SPEC.spatialCoordinates.y})`
);

assert(
  suite2,
  'Constellation History screen blueprint defines grid coordinate (-1, 0)',
  CONSTELLATION_HISTORY_SPEC.spatialCoordinates.x === -1 && CONSTELLATION_HISTORY_SPEC.spatialCoordinates.y === 0,
  `Observed: (${CONSTELLATION_HISTORY_SPEC.spatialCoordinates.x}, ${CONSTELLATION_HISTORY_SPEC.spatialCoordinates.y})`
);

assert(
  suite2,
  'All 4 spatial targets mapped in SPATIAL_MOTION_CONFIG (practice, profile, history, tuning)',
  Boolean(
    SPATIAL_MOTION_CONFIG.coordinates.practice &&
      SPATIAL_MOTION_CONFIG.coordinates.profile &&
      SPATIAL_MOTION_CONFIG.coordinates.history &&
      SPATIAL_MOTION_CONFIG.coordinates.tuning
  ),
  'Full 4-quadrant coordinate map verified'
);

warn(
  suite2,
  'Tuning Ritual blueprint has explicit spatialCoordinates property',
  'spatialCoordinates' in TUNING_RITUAL_SPEC,
  'spatialCoordinates' in TUNING_RITUAL_SPEC
    ? `Observed: (${(TUNING_RITUAL_SPEC as any).spatialCoordinates?.x}, ${(TUNING_RITUAL_SPEC as any).spatialCoordinates?.y})`
    : 'Minor asymmetry: TUNING_RITUAL_SPEC lacks spatialCoordinates property on its spec object (coordinate defined globally in SPATIAL_MOTION_CONFIG.coordinates.tuning)'
);

assert(
  suite2,
  'Edge folio anchors musical glyphs available (coda, gClef, fermata)',
  Boolean(MUSICAL_GLYPHS.coda && MUSICAL_GLYPHS.gClef && MUSICAL_GLYPHS.fermata),
  `coda: ${MUSICAL_GLYPHS.coda}, gClef: ${MUSICAL_GLYPHS.gClef}, fermata: ${MUSICAL_GLYPHS.fermata}`
);

// --------------------------------------------------------------------------
// SUITE 3: M3 Core Screen 1 — Landing Page Blueprint
// --------------------------------------------------------------------------
const suite3 = 'Suite 3: Landing Screen Blueprint Conformance';

assert(
  suite3,
  'Latin motto conforms to PROJECT.md (AUDIRE · DISCERE · EXERCERE)',
  LANDING_SCREEN_SPEC.latinMotto === 'AUDIRE · DISCERE · EXERCERE',
  `Observed: ${LANDING_SCREEN_SPEC.latinMotto}`
);

assert(
  suite3,
  'Ink bleed filter specification parameters are valid numbers',
  LANDING_SCREEN_SPEC.inkBleedFilter.id === 'ink-bleed' &&
    LANDING_SCREEN_SPEC.inkBleedFilter.baseFrequency === 0.04 &&
    LANDING_SCREEN_SPEC.inkBleedFilter.numOctaves === 4 &&
    LANDING_SCREEN_SPEC.inkBleedFilter.scale === 5 &&
    LANDING_SCREEN_SPEC.inkBleedFilter.stdDeviation === 0.6,
  'baseFrequency: 0.04, numOctaves: 4, scale: 5, stdDeviation: 0.6'
);

assert(
  suite3,
  'Clerk theme configuration enforces zero border radius and manuscript palette',
  LANDING_SCREEN_SPEC.clerkThemeConfig.borderRadius === '0px' &&
    LANDING_SCREEN_SPEC.clerkThemeConfig.cardBackground === LIVING_MANUSCRIPT_COLORS.parchment &&
    LANDING_SCREEN_SPEC.clerkThemeConfig.buttonPrimary === LIVING_MANUSCRIPT_COLORS.charcoal,
  `Radius: ${LANDING_SCREEN_SPEC.clerkThemeConfig.borderRadius}, Background: ${LANDING_SCREEN_SPEC.clerkThemeConfig.cardBackground}`
);

assert(
  suite3,
  'Guest action specifies instant audition bypass for Playwright testability',
  LANDING_SCREEN_SPEC.guestAction.label.includes('Audition as Guest') && LANDING_SCREEN_SPEC.guestAction.glyph === '𝄐',
  `Label: ${LANDING_SCREEN_SPEC.guestAction.label}`
);

// --------------------------------------------------------------------------
// SUITE 4: M3 Core Screen 2 — Setup & Tuning Ritual (Harmonic Astrolabe)
// --------------------------------------------------------------------------
const suite4 = 'Suite 4: Tuning Ritual Blueprint & Math Oracles';

assert(
  suite4,
  'Astrolabe dial geometry has 320px diameter and 110px needle length',
  TUNING_RITUAL_SPEC.dialGeometry.diameter === 320 &&
    TUNING_RITUAL_SPEC.dialGeometry.radius === 160 &&
    TUNING_RITUAL_SPEC.dialGeometry.needleLength === 110,
  `Diameter: ${TUNING_RITUAL_SPEC.dialGeometry.diameter}, Needle: ${TUNING_RITUAL_SPEC.dialGeometry.needleLength}`
);

// Math oracle for needle angle
const angle0 = TUNING_RITUAL_SPEC.calculateNeedleAngle(0);
const angleMinus50 = TUNING_RITUAL_SPEC.calculateNeedleAngle(-50);
const anglePlus50 = TUNING_RITUAL_SPEC.calculateNeedleAngle(50);
const angleMinus25 = TUNING_RITUAL_SPEC.calculateNeedleAngle(-25);
const anglePlus25 = TUNING_RITUAL_SPEC.calculateNeedleAngle(25);
const angleClampedUnder = TUNING_RITUAL_SPEC.calculateNeedleAngle(-120);
const angleClampedOver = TUNING_RITUAL_SPEC.calculateNeedleAngle(120);

assert(
  suite4,
  'Needle angle at 0 cents is exactly 0 degrees',
  angle0 === 0,
  `Observed: ${angle0}°`
);

assert(
  suite4,
  'Needle angle at -50 cents is exactly -60 degrees',
  angleMinus50 === -60,
  `Observed: ${angleMinus50}°`
);

assert(
  suite4,
  'Needle angle at +50 cents is exactly +60 degrees',
  anglePlus50 === 60,
  `Observed: ${anglePlus50}°`
);

assert(
  suite4,
  'Needle angle at -25 cents is exactly -30 degrees',
  angleMinus25 === -30,
  `Observed: ${angleMinus25}°`
);

assert(
  suite4,
  'Needle angle at +25 cents is exactly +30 degrees',
  anglePlus25 === 30,
  `Observed: ${anglePlus25}°`
);

assert(
  suite4,
  'Needle angle clamps extreme negative deviation (-120 cents -> -60 degrees)',
  angleClampedUnder === -60,
  `Observed: ${angleClampedUnder}°`
);

assert(
  suite4,
  'Needle angle clamps extreme positive deviation (+120 cents -> +60 degrees)',
  angleClampedOver === 60,
  `Observed: ${angleClampedOver}°`
);

// In-tune threshold oracle: abs(centsDeviation) <= 3
assert(
  suite4,
  'isInTune conforms to PROJECT.md line 71 threshold (abs(deviation) <= 3)',
  TUNING_RITUAL_SPEC.isInTune(0) === true &&
    TUNING_RITUAL_SPEC.isInTune(3) === true &&
    TUNING_RITUAL_SPEC.isInTune(-3) === true &&
    TUNING_RITUAL_SPEC.isInTune(3.001) === false &&
    TUNING_RITUAL_SPEC.isInTune(-3.001) === false &&
    TUNING_RITUAL_SPEC.isInTune(15) === false,
  'Verified bounds at -3.001, -3, 0, 3, 3.001'
);

assert(
  suite4,
  'Pitch standards include 415 Hz Baroque, 440 Hz Modern (default), 442 Hz Symphonic',
  TUNING_RITUAL_SPEC.pitchStandards.length === 3 &&
    TUNING_RITUAL_SPEC.pitchStandards.some((s) => s.hz === 440.0 && s.default === true) &&
    TUNING_RITUAL_SPEC.pitchStandards.some((s) => s.hz === 415.0) &&
    TUNING_RITUAL_SPEC.pitchStandards.some((s) => s.hz === 442.0),
  `Standards: ${TUNING_RITUAL_SPEC.pitchStandards.map((s) => s.label).join(', ')}`
);

// --------------------------------------------------------------------------
// SUITE 5: M3 Core Screen 3 — Composer Profile Folio Blueprint
// --------------------------------------------------------------------------
const suite5 = 'Suite 5: Composer Profile Blueprint Conformance';

assert(
  suite5,
  'Woodcut crest diameter is 88px and glyph is G-clef',
  COMPOSER_PROFILE_SPEC.folioHeader.woodcutCrestDiameter === 88 &&
    COMPOSER_PROFILE_SPEC.folioHeader.crestGlyph === MUSICAL_GLYPHS.gClef,
  `Diameter: ${COMPOSER_PROFILE_SPEC.folioHeader.woodcutCrestDiameter}, Glyph: ${COMPOSER_PROFILE_SPEC.folioHeader.crestGlyph}`
);

assert(
  suite5,
  'Default physiognomy provides practice hours, notes, streak, intonation purity, and habits',
  typeof COMPOSER_PROFILE_SPEC.defaultPhysiognomy.totalPracticeHours === 'number' &&
    typeof COMPOSER_PROFILE_SPEC.defaultPhysiognomy.totalNotesArticulated === 'number' &&
    typeof COMPOSER_PROFILE_SPEC.defaultPhysiognomy.intonationPurityPercent === 'number' &&
    Array.isArray(COMPOSER_PROFILE_SPEC.defaultPhysiognomy.dominantHabits) &&
    COMPOSER_PROFILE_SPEC.defaultPhysiognomy.dominantHabits.length >= 3,
  `Hours: ${COMPOSER_PROFILE_SPEC.defaultPhysiognomy.totalPracticeHours}, Notes: ${COMPOSER_PROFILE_SPEC.defaultPhysiognomy.totalNotesArticulated}, Habits: ${COMPOSER_PROFILE_SPEC.defaultPhysiognomy.dominantHabits.length}`
);

assert(
  suite5,
  'Default repertoire contains studied pieces with Roman difficulty badges',
  Array.isArray(COMPOSER_PROFILE_SPEC.defaultRepertoire) &&
    COMPOSER_PROFILE_SPEC.defaultRepertoire.length === 3 &&
    COMPOSER_PROFILE_SPEC.defaultRepertoire.every(
      (p) => typeof p.title === 'string' && typeof p.composer === 'string' && typeof p.masteryPercent === 'number' && typeof p.difficulty === 'string'
    ),
  `Repertoire pieces: ${COMPOSER_PROFILE_SPEC.defaultRepertoire.map((p) => p.title).join(' | ')}`
);

assert(
  suite5,
  'Return anchor to Practice Stand is defined with fermata glyph',
  COMPOSER_PROFILE_SPEC.returnAnchor.label.includes('Return to Practice Stand') &&
    COMPOSER_PROFILE_SPEC.returnAnchor.glyph === '𝄐',
  `Label: ${COMPOSER_PROFILE_SPEC.returnAnchor.label}, Glyph: ${COMPOSER_PROFILE_SPEC.returnAnchor.glyph}`
);

// --------------------------------------------------------------------------
// SUITE 6: M3 Core Screen 4 — Constellation History Celestial Scatter Plot
// --------------------------------------------------------------------------
const suite6 = 'Suite 6: Constellation History Blueprint & Math Oracles';

assert(
  suite6,
  'Canvas dimensions conform to 1000x600 viewBox with 840x480 usable area',
  CONSTELLATION_HISTORY_SPEC.canvasDimensions.viewBox === '0 0 1000 600' &&
    CONSTELLATION_HISTORY_SPEC.canvasDimensions.width === 1000 &&
    CONSTELLATION_HISTORY_SPEC.canvasDimensions.height === 600 &&
    CONSTELLATION_HISTORY_SPEC.canvasDimensions.paddingX === 80 &&
    CONSTELLATION_HISTORY_SPEC.canvasDimensions.paddingY === 60 &&
    CONSTELLATION_HISTORY_SPEC.canvasDimensions.usableWidth === 840 &&
    CONSTELLATION_HISTORY_SPEC.canvasDimensions.usableHeight === 480,
  `viewBox: ${CONSTELLATION_HISTORY_SPEC.canvasDimensions.viewBox}, Usable: ${CONSTELLATION_HISTORY_SPEC.canvasDimensions.usableWidth}x${CONSTELLATION_HISTORY_SPEC.canvasDimensions.usableHeight}`
);

// Math oracle for mapTempoToX
const x60 = CONSTELLATION_HISTORY_SPEC.mapTempoToX(60);
const x110 = CONSTELLATION_HISTORY_SPEC.mapTempoToX(110);
const x160 = CONSTELLATION_HISTORY_SPEC.mapTempoToX(160);
const xClampedMin = CONSTELLATION_HISTORY_SPEC.mapTempoToX(30);
const xClampedMax = CONSTELLATION_HISTORY_SPEC.mapTempoToX(220);

assert(
  suite6,
  'mapTempoToX maps 60 BPM to exactly left margin (X: 80)',
  x60 === 80,
  `Observed: ${x60}`
);

assert(
  suite6,
  'mapTempoToX maps 110 BPM to exactly midpoint (X: 500)',
  x110 === 500,
  `Observed: ${x110}`
);

assert(
  suite6,
  'mapTempoToX maps 160 BPM to exactly right margin (X: 920)',
  x160 === 920,
  `Observed: ${x160}`
);

assert(
  suite6,
  'mapTempoToX clamps out-of-range low tempo (30 BPM -> X: 80)',
  xClampedMin === 80,
  `Observed: ${xClampedMin}`
);

assert(
  suite6,
  'mapTempoToX clamps out-of-range high tempo (220 BPM -> X: 920)',
  xClampedMax === 920,
  `Observed: ${xClampedMax}`
);

// Math oracle for mapAccuracyToY (Inverted SVG Y: 100% at top Y=60, 60% at bottom Y=540)
const y100 = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(100);
const y80 = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(80);
const y60 = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(60);
const yClampedMin = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(40);
const yClampedMax = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(110);

assert(
  suite6,
  'mapAccuracyToY maps 100% accuracy to top margin (Y: 60)',
  y100 === 60,
  `Observed: ${y100}`
);

assert(
  suite6,
  'mapAccuracyToY maps 80% accuracy to midpoint (Y: 300)',
  y80 === 300,
  `Observed: ${y80}`
);

assert(
  suite6,
  'mapAccuracyToY maps 60% accuracy to bottom margin (Y: 540)',
  y60 === 540,
  `Observed: ${y60}`
);

assert(
  suite6,
  'mapAccuracyToY clamps low accuracy (40% -> Y: 540)',
  yClampedMin === 540,
  `Observed: ${yClampedMin}`
);

assert(
  suite6,
  'mapAccuracyToY clamps high accuracy (110% -> Y: 60)',
  yClampedMax === 60,
  `Observed: ${yClampedMax}`
);

// Math oracle for mapDurationToRadius (5 min -> 4px, 45 min -> 14px)
const r5 = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(5);
const r25 = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(25);
const r45 = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(45);
const rClampedMin = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(1);
const rClampedMax = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(90);

assert(
  suite6,
  'mapDurationToRadius maps 5 min to exactly 4px',
  r5 === 4,
  `Observed: ${r5}px`
);

assert(
  suite6,
  'mapDurationToRadius maps 25 min to exactly 9px',
  r25 === 9,
  `Observed: ${r25}px`
);

assert(
  suite6,
  'mapDurationToRadius maps 45 min to exactly 14px',
  r45 === 14,
  `Observed: ${r45}px`
);

assert(
  suite6,
  'mapDurationToRadius clamps short sessions (1 min -> 4px)',
  rClampedMin === 4,
  `Observed: ${rClampedMin}px`
);

assert(
  suite6,
  'mapDurationToRadius clamps long sessions (90 min -> 14px)',
  rClampedMax === 14,
  `Observed: ${rClampedMax}px`
);

// Sample sessions data integrity and geometry bounds
const sessions = CONSTELLATION_HISTORY_SPEC.sampleSessions;
assert(
  suite6,
  'sampleSessions contains 5 takes conforming to PracticeSessionNode schema',
  Array.isArray(sessions) &&
    sessions.length === 5 &&
    sessions.every(
      (s) =>
        typeof s.id === 'string' &&
        typeof s.pieceTitle === 'string' &&
        typeof s.composer === 'string' &&
        typeof s.date === 'string' &&
        typeof s.tempoBpm === 'number' &&
        typeof s.accuracyPercent === 'number' &&
        typeof s.durationMinutes === 'number' &&
        typeof s.pitchPurity === 'number' &&
        typeof s.timingPrecision === 'number' &&
        typeof s.editorNote === 'string'
    ),
  `Session count: ${sessions.length}`
);

// Test SVG coordinates of all sample sessions
let allSessionsInBounds = true;
for (const s of sessions) {
  const x = CONSTELLATION_HISTORY_SPEC.mapTempoToX(s.tempoBpm);
  const y = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(s.accuracyPercent);
  const r = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(s.durationMinutes);
  if (x < 80 || x > 920 || y < 60 || y > 540 || r < 4 || r > 14) {
    allSessionsInBounds = false;
    break;
  }
}

assert(
  suite6,
  'All 5 sample session nodes map strictly within canvas boundaries [X: 80-920, Y: 60-540, R: 4-14]',
  allSessionsInBounds,
  'Verified 5/5 takes within plotting bounding box'
);

// --------------------------------------------------------------------------
// SUITE 7: Adversarial Stress & Fuzz Testing (10,000 Randomized Iterations)
// --------------------------------------------------------------------------
const suite7 = 'Suite 7: Adversarial Fuzzing & Boundary Stress Testing';

let fuzzPassed = true;
let fuzzError = '';

try {
  for (let i = 0; i < 10000; i++) {
    // Generate adversarial numbers across vast spectrum
    const rTempo = (Math.random() - 0.5) * 1000;
    const rAcc = (Math.random() - 0.5) * 1000;
    const rDur = (Math.random() - 0.5) * 1000;
    const rCents = (Math.random() - 0.5) * 1000;

    const x = CONSTELLATION_HISTORY_SPEC.mapTempoToX(rTempo);
    const y = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(rAcc);
    const r = CONSTELLATION_HISTORY_SPEC.mapDurationToRadius(rDur);
    const theta = TUNING_RITUAL_SPEC.calculateNeedleAngle(rCents);
    const inTune = TUNING_RITUAL_SPEC.isInTune(rCents);

    if (x < 80 || x > 920) {
      throw new Error(`X coordinate out of bounds on input ${rTempo}: ${x}`);
    }
    if (y < 60 || y > 540) {
      throw new Error(`Y coordinate out of bounds on input ${rAcc}: ${y}`);
    }
    if (r < 4 || r > 14) {
      throw new Error(`Radius out of bounds on input ${rDur}: ${r}`);
    }
    if (theta < -60 || theta > 60) {
      throw new Error(`Needle theta out of bounds on input ${rCents}: ${theta}`);
    }
    if (typeof inTune !== 'boolean') {
      throw new Error(`isInTune returned non-boolean on input ${rCents}`);
    }
  }
} catch (err: any) {
  fuzzPassed = false;
  fuzzError = err.message;
}

assert(
  suite7,
  '10,000 randomized inputs successfully clamped and bounded without exceptions',
  fuzzPassed,
  fuzzPassed ? '10,000 / 10,000 iterations passed' : fuzzError
);

// Boundary value tests: NaN, Infinity, -Infinity
const testNaN = () => {
  const thetaNaN = TUNING_RITUAL_SPEC.calculateNeedleAngle(NaN);
  const xNaN = CONSTELLATION_HISTORY_SPEC.mapTempoToX(NaN);
  const yNaN = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(NaN);
  return Number.isNaN(thetaNaN) && Number.isNaN(xNaN) && Number.isNaN(yNaN);
};

assert(
  suite7,
  'Functions safely propagate NaN without unhandled exceptions',
  testNaN(),
  'Safe propagation of IEEE 754 NaN values'
);

const testInfinities = () => {
  const thetaInf = TUNING_RITUAL_SPEC.calculateNeedleAngle(Infinity);
  const thetaNegInf = TUNING_RITUAL_SPEC.calculateNeedleAngle(-Infinity);
  const xInf = CONSTELLATION_HISTORY_SPEC.mapTempoToX(Infinity);
  const xNegInf = CONSTELLATION_HISTORY_SPEC.mapTempoToX(-Infinity);
  const yInf = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(Infinity);
  const yNegInf = CONSTELLATION_HISTORY_SPEC.mapAccuracyToY(-Infinity);

  return (
    thetaInf === 60 &&
    thetaNegInf === -60 &&
    xInf === 920 &&
    xNegInf === 80 &&
    yInf === 60 &&
    yNegInf === 540
  );
};

assert(
  suite7,
  'Functions correctly clamp positive and negative Infinity to geometry limits',
  testInfinities(),
  'Infinity clamped to 60°/920px/60px; -Infinity clamped to -60°/80px/540px'
);

// --------------------------------------------------------------------------
// SUMMARY & VERDICT
// --------------------------------------------------------------------------
console.log('\n================================================================');
console.log('CHALLENGER M1-2 TEST EXECUTION RESULTS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const r of results) {
  let mark = '✓ PASS';
  if (r.warning) {
    mark = '⚠ WARN';
    warnCount++;
  } else if (!r.passed) {
    mark = '✗ FAIL';
    failCount++;
  } else {
    passCount++;
  }
  console.log(`${mark} [${r.suite}] ${r.test}`);
  if (r.details) {
    console.log(`       ↳ ${r.details}`);
  }
}

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | WARNINGS: ${warnCount} | FAILED: ${failCount}`);
console.log('----------------------------------------------------------------');

if (failCount === 0) {
  console.log('\nVERDICT: APPROVE');
} else {
  console.log('\nVERDICT: CHALLENGE_FAILED');
  process.exit(1);
}
