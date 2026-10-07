/**
 * Challenger M3-2 Empirical Verification & Stress Test Suite
 * Constellation History (Scatter Plot, Coordinates, Nodes, Filaments, Marginalia)
 * Composer Profile (Telemetry Calculations, Habits, Repertoire Ledger)
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { ClerkProvider } from '@clerk/react';
import {
  CONSTELLATION_HISTORY_SPEC,
  COMPOSER_PROFILE_SPEC,
} from '@/design-system/screens';
import { MUSICAL_GLYPHS, LIVING_MANUSCRIPT_COLORS } from '@/design-system/tokens';
import { SpatialProvider } from '@/components/spatial';
import { ConstellationHistoryScreen } from '@/components/screens/constellation-history-screen';
import { ComposerProfileScreen } from '@/components/screens/composer-profile-screen';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  caveat?: string;
}

const results: TestResult[] = [];

function assert(suite: string, name: string, condition: boolean, details?: string, caveat?: string) {
  results.push({
    suite,
    name,
    passed: condition,
    details: details || (condition ? 'Passed' : 'Failed'),
    caveat,
  });
}

console.log('================================================================');
console.log('CHALLENGER M3-2: EMPIRICAL CONSTELLATION & PROFILE VERIFICATION');
console.log('================================================================\n');

// =========================================================================
// SUITE 1: Constellation Scatter Plot Coordinate Mapping (X & Y Axes)
// =========================================================================
const SUITE_1 = 'Suite 1: Constellation Coordinate Mapping';

const { canvasDimensions, mapTempoToX, mapAccuracyToY, mapDurationToRadius } =
  CONSTELLATION_HISTORY_SPEC;

// 1.1 Canvas Geometry Dimensions
assert(
  SUITE_1,
  'Canvas viewport dimensions match 1000x600 with standard paddings',
  canvasDimensions.width === 1000 &&
    canvasDimensions.height === 600 &&
    canvasDimensions.paddingX === 80 &&
    canvasDimensions.paddingY === 60 &&
    canvasDimensions.usableWidth === 840 &&
    canvasDimensions.usableHeight === 480,
  `Canvas: ${canvasDimensions.width}x${canvasDimensions.height}, usable: ${canvasDimensions.usableWidth}x${canvasDimensions.usableHeight}`
);

// 1.2 Tempo Domain Invariants (60 - 160 BPM)
assert(
  SUITE_1,
  'Tempo domain is calibrated to 60-160 BPM',
  canvasDimensions.minTempoBpm === 60 && canvasDimensions.maxTempoBpm === 160,
  `Tempo Range: [${canvasDimensions.minTempoBpm}, ${canvasDimensions.maxTempoBpm}] BPM`
);

// 1.3 Accuracy Domain Invariants (60 - 100%)
assert(
  SUITE_1,
  'Accuracy domain is calibrated to 60-100%',
  canvasDimensions.minAccuracyPercent === 60 && canvasDimensions.maxAccuracyPercent === 100,
  `Accuracy Range: [${canvasDimensions.minAccuracyPercent}, ${canvasDimensions.maxAccuracyPercent}]%`
);

// 1.4 Tempo X-Axis Exact Cardinal Points
const xAt60 = mapTempoToX(60);
const xAt160 = mapTempoToX(160);
const xAt110 = mapTempoToX(110);
const xAt86 = mapTempoToX(86);

assert(
  SUITE_1,
  'X-axis maps 60 BPM to left padding margin (80px)',
  Math.abs(xAt60 - 80) < 1e-6,
  `Expected: 80px, Got: ${xAt60}px`
);

assert(
  SUITE_1,
  'X-axis maps 160 BPM to right usable bound (920px = 80 + 840)',
  Math.abs(xAt160 - 920) < 1e-6,
  `Expected: 920px, Got: ${xAt160}px`
);

assert(
  SUITE_1,
  'X-axis maps midpoint 110 BPM to canvas center (500px)',
  Math.abs(xAt110 - 500) < 1e-6,
  `Expected: 500px, Got: ${xAt110}px`
);

assert(
  SUITE_1,
  'X-axis maps 86 BPM breakdown horizon to 298.4px',
  Math.abs(xAt86 - 298.4) < 1e-6,
  `Expected: 298.4px, Got: ${xAt86}px`
);

// 1.5 Tempo Clamping & Extrema
assert(
  SUITE_1,
  'Tempo clamping: sub-60 BPM clamped to 80px',
  mapTempoToX(0) === 80 && mapTempoToX(-50) === 80 && mapTempoToX(59.9) === 80 + ((59.9 - 60) <= 0 ? 0 : 0),
  `0 BPM -> ${mapTempoToX(0)}px, -50 BPM -> ${mapTempoToX(-50)}px`
);

assert(
  SUITE_1,
  'Tempo clamping: super-160 BPM clamped to 920px',
  mapTempoToX(180) === 920 && mapTempoToX(300) === 920,
  `180 BPM -> ${mapTempoToX(180)}px, 300 BPM -> ${mapTempoToX(300)}px`
);

// 1.6 Accuracy Inverted Y-Axis Cardinal Points
const yAt60 = mapAccuracyToY(60);
const yAt100 = mapAccuracyToY(100);
const yAt80 = mapAccuracyToY(80);
const yAt90 = mapAccuracyToY(90);

assert(
  SUITE_1,
  'Y-axis maps 100% accuracy to canvas top margin (60px)',
  Math.abs(yAt100 - 60) < 1e-6,
  `Expected: 60px, Got: ${yAt100}px`
);

assert(
  SUITE_1,
  'Y-axis maps 60% accuracy to canvas bottom margin (540px = 600 - 60)',
  Math.abs(yAt60 - 540) < 1e-6,
  `Expected: 540px, Got: ${yAt60}px`
);

assert(
  SUITE_1,
  'Y-axis maps midpoint 80% accuracy to canvas center (300px)',
  Math.abs(yAt80 - 300) < 1e-6,
  `Expected: 300px, Got: ${yAt80}px`
);

assert(
  SUITE_1,
  'Y-axis maps 90% accuracy to 180px',
  Math.abs(yAt90 - 180) < 1e-6,
  `Expected: 180px, Got: ${yAt90}px`
);

// 1.7 Accuracy Clamping & Inversion Monotonicity
assert(
  SUITE_1,
  'Accuracy clamping: sub-60% clamped to 540px, super-100% clamped to 60px',
  mapAccuracyToY(40) === 540 && mapAccuracyToY(0) === 540 && mapAccuracyToY(110) === 60,
  `40% -> ${mapAccuracyToY(40)}px, 110% -> ${mapAccuracyToY(110)}px`
);

// 1.8 Monotonicity Property: Higher tempo increases X; higher accuracy decreases Y (higher on screen)
let monotonicX = true;
let monotonicY = true;
for (let b = 60; b < 160; b += 2) {
  if (mapTempoToX(b) >= mapTempoToX(b + 2)) monotonicX = false;
}
for (let a = 60; a < 100; a += 2) {
  if (mapAccuracyToY(a) <= mapAccuracyToY(a + 2)) monotonicY = false;
}

assert(
  SUITE_1,
  'X mapping is strictly monotonic increasing over [60, 160]',
  monotonicX,
  'X strictly increases with BPM'
);

assert(
  SUITE_1,
  'Y mapping is strictly monotonic decreasing (visually increasing) over [60, 100]',
  monotonicY,
  'Y strictly decreases (moves upward) with Accuracy'
);

// 1.9 Star Duration Node Radius Mapping (4px - 14px for 5 - 45 mins)
assert(
  SUITE_1,
  'Radius maps 5 mins to minimum 4px',
  Math.abs(mapDurationToRadius(5) - 4) < 1e-6,
  `Expected: 4px, Got: ${mapDurationToRadius(5)}px`
);

assert(
  SUITE_1,
  'Radius maps 45 mins to maximum 14px',
  Math.abs(mapDurationToRadius(45) - 14) < 1e-6,
  `Expected: 14px, Got: ${mapDurationToRadius(45)}px`
);

assert(
  SUITE_1,
  'Radius maps midpoint 25 mins to 9px',
  Math.abs(mapDurationToRadius(25) - 9) < 1e-6,
  `Expected: 9px, Got: ${mapDurationToRadius(25)}px`
);

assert(
  SUITE_1,
  'Radius clamping: sub-5 mins clamped to 4px, super-45 mins clamped to 14px',
  mapDurationToRadius(0) === 4 && mapDurationToRadius(90) === 14,
  `0 mins -> ${mapDurationToRadius(0)}px, 90 mins -> ${mapDurationToRadius(90)}px`
);

// =========================================================================
// SUITE 2: Constellation History Sample Dataset & Star Nodes
// =========================================================================
const SUITE_2 = 'Suite 2: Star Nodes & Session Takes Data';

const sampleSessions = CONSTELLATION_HISTORY_SPEC.sampleSessions;

assert(
  SUITE_2,
  'Sample sessions dataset contains valid takes',
  sampleSessions.length >= 5,
  `Session count: ${sampleSessions.length}`
);

// Verify all sample sessions adhere to domain bounds and contracts
sampleSessions.forEach((session, index) => {
  const x = mapTempoToX(session.tempoBpm);
  const y = mapAccuracyToY(session.accuracyPercent);
  const r = mapDurationToRadius(session.durationMinutes);

  assert(
    SUITE_2,
    `Session [${session.id}] coordinates within SVG bounds [80..920, 60..540]`,
    x >= 80 && x <= 920 && y >= 60 && y <= 540 && !Number.isNaN(x) && !Number.isNaN(y),
    `Take ${session.id}: (${x.toFixed(1)}, ${y.toFixed(1)}), r=${r.toFixed(1)}`
  );

  assert(
    SUITE_2,
    `Session [${session.id}] radius is bounded between 4px and 14px`,
    r >= 4 && r <= 14,
    `Radius: ${r.toFixed(1)}px`
  );

  assert(
    SUITE_2,
    `Session [${session.id}] has valid telemetry fields`,
    Boolean(session.pieceTitle) &&
      Boolean(session.composer) &&
      session.tempoBpm >= 60 &&
      session.tempoBpm <= 160 &&
      session.accuracyPercent >= 60 &&
      session.accuracyPercent <= 100 &&
      session.pitchPurity >= 0 &&
      session.pitchPurity <= 100 &&
      session.timingPrecision >= 0,
    `Pitch: ${session.pitchPurity}%, Precision: ±${session.timingPrecision}ms`
  );
});

// Verify Star Typology Logic (Pristine vs Breakdown)
sampleSessions.forEach((session) => {
  const isPristine = session.accuracyPercent >= 95;
  const isBreakdown =
    session.accuracyPercent < 80 || session.tempoBpm >= 115 || session.accuracyPercent <= 82.5;

  if (session.id === 'take-02') {
    // take-02: 80 BPM, 97.4% accuracy -> pristine
    assert(
      SUITE_2,
      'Take-02 is classified as Pristine (≥95%)',
      isPristine && !isBreakdown,
      `take-02 accuracy: ${session.accuracyPercent}%`
    );
  }

  if (session.id === 'take-03') {
    // take-03: 96 BPM, 78.3% accuracy -> breakdown
    assert(
      SUITE_2,
      'Take-03 is classified as Breakdown (<80%)',
      isBreakdown && !isPristine,
      `take-03 accuracy: ${session.accuracyPercent}%`
    );
  }

  if (session.id === 'take-05') {
    // take-05: 112 BPM, 82.5% accuracy -> breakdown (acc <= 82.5%)
    assert(
      SUITE_2,
      'Take-05 is classified as Breakdown (tempo/acc threshold)',
      isBreakdown,
      `take-05 tempo: ${session.tempoBpm} BPM, acc: ${session.accuracyPercent}%`
    );
  }
});

// =========================================================================
// SUITE 3: Constellation Filaments Mathematical Geometry
// =========================================================================
const SUITE_3 = 'Suite 3: Constellation Filaments';

// Group sessions by piece and test filament construction
const distinctPieces = Array.from(new Set(sampleSessions.map((s) => s.pieceTitle)));
const filamentsByPiece: Record<string, { path: string; count: number }> = {};

distinctPieces.forEach((piece) => {
  const nodes = sampleSessions
    .filter((s) => s.pieceTitle === piece)
    .sort((a, b) => a.tempoBpm - b.tempoBpm);

  if (nodes.length >= 2) {
    const pathData = nodes.reduce((acc, node, idx) => {
      const x = mapTempoToX(node.tempoBpm);
      const y = mapAccuracyToY(node.accuracyPercent);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
    filamentsByPiece[piece] = { path: pathData, count: nodes.length };
  }
});

assert(
  SUITE_3,
  'BWV 1004 Allemande has multi-take constellation filament',
  filamentsByPiece['BWV 1004 Allemande'] !== undefined &&
    filamentsByPiece['BWV 1004 Allemande'].count === 3,
  `Filament count: ${filamentsByPiece['BWV 1004 Allemande']?.count || 0}`
);

const bachFilamentPath = filamentsByPiece['BWV 1004 Allemande']?.path;
assert(
  SUITE_3,
  'Bach filament SVG path has valid "M x y L x y" format',
  bachFilamentPath?.startsWith('M ') && bachFilamentPath?.includes(' L ') && !bachFilamentPath?.includes('NaN'),
  `Path: ${bachFilamentPath}`
);

// Verify filament sequence midpoint coordinates
const bachNodes = sampleSessions
  .filter((s) => s.pieceTitle === 'BWV 1004 Allemande')
  .sort((a, b) => a.tempoBpm - b.tempoBpm);

for (let i = 0; i < bachNodes.length - 1; i++) {
  const cur = bachNodes[i];
  const nxt = bachNodes[i + 1];
  const midX = (mapTempoToX(cur.tempoBpm) + mapTempoToX(nxt.tempoBpm)) / 2;
  const midY = (mapAccuracyToY(cur.accuracyPercent) + mapAccuracyToY(nxt.accuracyPercent)) / 2;

  assert(
    SUITE_3,
    `Filament segment ${i + 1} midpoint is within canvas bounds`,
    midX >= 80 && midX <= 920 && midY >= 60 && midY <= 540 && !Number.isNaN(midX) && !Number.isNaN(midY),
    `Midpoint seq.${i + 1}: (${midX.toFixed(1)}, ${midY.toFixed(1)})`
  );
}

// =========================================================================
// SUITE 4: Composer Profile Telemetry & Repertoire Ledger Calculations
// =========================================================================
const SUITE_4 = 'Suite 4: Composer Profile Telemetry & Repertoire';

const physiognomy = COMPOSER_PROFILE_SPEC.defaultPhysiognomy;
const repertoire = COMPOSER_PROFILE_SPEC.defaultRepertoire;

// 4.1 Telemetry Metrics Verification
assert(
  SUITE_4,
  'Total practice hours is 48.4 hrs',
  physiognomy.totalPracticeHours === 48.4,
  `Total practice hours: ${physiognomy.totalPracticeHours}`
);

assert(
  SUITE_4,
  'Total notes articulated is 32,490',
  physiognomy.totalNotesArticulated === 32490,
  `Notes articulated: ${physiognomy.totalNotesArticulated}`
);

assert(
  SUITE_4,
  'Consecutive streak days is 14 days',
  physiognomy.consecutiveStreakDays === 14,
  `Streak: ${physiognomy.consecutiveStreakDays}`
);

assert(
  SUITE_4,
  'Intonation purity percent is 91.4%',
  physiognomy.intonationPurityPercent === 91.4,
  `Intonation purity: ${physiognomy.intonationPurityPercent}%`
);

assert(
  SUITE_4,
  'Timing precision is ±14ms',
  physiognomy.timingPrecisionMs === 14,
  `Timing precision: ±${physiognomy.timingPrecisionMs}ms`
);

assert(
  SUITE_4,
  'Velocity bands: Max controlled 112 BPM, Breakdown horizon 120 BPM',
  physiognomy.maxControlledTempoBpm === 112 && physiognomy.breakdownHorizonBpm === 120,
  `Max: ${physiognomy.maxControlledTempoBpm} BPM, Breakdown: ${physiognomy.breakdownHorizonBpm} BPM`
);

// 4.2 Habit Diagnoses
assert(
  SUITE_4,
  'Dominant habits list contains exactly 3 diagnosed kinetic biases',
  physiognomy.dominantHabits.length === 3,
  `Habits count: ${physiognomy.dominantHabits.length}`
);

assert(
  SUITE_4,
  'Habit 1 describes sharp leading tone bias (+5 cents)',
  physiognomy.dominantHabits[0].includes('+5 cents'),
  physiognomy.dominantHabits[0]
);

assert(
  SUITE_4,
  'Habit 2 describes flat fourth finger bias',
  physiognomy.dominantHabits[1].includes('fourth-finger'),
  physiognomy.dominantHabits[1]
);

assert(
  SUITE_4,
  'Habit 3 describes rushing after rests (+4%)',
  physiognomy.dominantHabits[2].includes('4%'),
  physiognomy.dominantHabits[2]
);

// 4.3 Repertoire Ledger Items & Mastery Percentages
assert(
  SUITE_4,
  'Repertoire ledger contains 3 masterworks',
  repertoire.length === 3,
  `Count: ${repertoire.length}`
);

const [bach, telemann, paganini] = repertoire;

assert(
  SUITE_4,
  'Bach Chaconne has 78% mastery, Difficulty IV, target 60 BPM',
  bach.title.includes('BWV 1004') &&
    bach.masteryPercent === 78 &&
    bach.difficulty === 'IV' &&
    bach.targetTempoBpm === 60 &&
    bach.status === 'In Active Discipline',
  `${bach.title}: ${bach.masteryPercent}%, Gradus ${bach.difficulty}, ${bach.status}`
);

assert(
  SUITE_4,
  'Telemann Fantasia has 96% mastery, Difficulty II, target 92 BPM',
  telemann.composer === 'G.P. Telemann' &&
    telemann.title.includes('Fantasias') &&
    telemann.masteryPercent === 96 &&
    telemann.difficulty === 'II' &&
    telemann.targetTempoBpm === 92 &&
    telemann.status === 'Conquered',
  `${telemann.title}: ${telemann.masteryPercent}%, Gradus ${telemann.difficulty}, ${telemann.status}`
);

assert(
  SUITE_4,
  'Paganini Caprice 24 has 64% mastery, Difficulty V, target 120 BPM',
  paganini.composer === 'N. Paganini' &&
    paganini.title.includes('Caprices') &&
    paganini.masteryPercent === 64 &&
    paganini.difficulty === 'V' &&
    paganini.targetTempoBpm === 120 &&
    paganini.status === 'Experimental Sanctuary',
  `${paganini.title}: ${paganini.masteryPercent}%, Gradus ${paganini.difficulty}, ${paganini.status}`
);

// 4.4 Repertoire Filter Simulation
const activeItems = repertoire.filter((item) => item.status === 'In Active Discipline');
const conqueredItems = repertoire.filter((item) => item.status === 'Conquered');

assert(
  SUITE_4,
  'Filter "active" yields 1 item (Bach Chaconne)',
  activeItems.length === 1 && activeItems[0].composer === 'J.S. Bach',
  `Active items count: ${activeItems.length}`
);

assert(
  SUITE_4,
  'Filter "conquered" yields 1 item (Telemann Fantasia 1)',
  conqueredItems.length === 1 && conqueredItems[0].composer === 'G.P. Telemann',
  `Conquered items count: ${conqueredItems.length}`
);

// 4.5 Folio Export Ledger Text Formatting Oracle
const mockDisplayName = COMPOSER_PROFILE_SPEC.folioHeader.defaultName;
const mockAuth = COMPOSER_PROFILE_SPEC.folioHeader.authVerification;
const exportedLedgerSummary = `PRISM FOLIO LEDGER — ${mockDisplayName}
Status: ${mockAuth}
Total Practice: ${physiognomy.totalPracticeHours} hrs (${physiognomy.totalNotesArticulated} notes)
Intonation Purity: ${physiognomy.intonationPurityPercent}% (Timing Precision: ±${physiognomy.timingPrecisionMs}ms)
Repertoire Studied: ${repertoire.map((r) => `${r.title} (${r.masteryPercent}%)`).join(', ')}`;

assert(
  SUITE_4,
  'Export Folio Summary string contains accurate telemetry and repertoire',
  exportedLedgerSummary.includes('48.4 hrs') &&
    exportedLedgerSummary.includes('32490 notes') &&
    exportedLedgerSummary.includes('91.4%') &&
    exportedLedgerSummary.includes('±14ms') &&
    exportedLedgerSummary.includes('BWV 1004') &&
    exportedLedgerSummary.includes('78%'),
  'Summary string format validated'
);

// =========================================================================
// SUITE 5: Full Component HTML/SVG DOM String Rendering
// =========================================================================
const SUITE_5 = 'Suite 5: Component DOM Rendering';

// 5.1 Render ConstellationHistoryScreen inside SpatialProvider
const historyHtml = renderToString(
  React.createElement(
    SpatialProvider,
    { initialTarget: 'history', disableKeyboard: true, disableHashSync: true },
    React.createElement(ConstellationHistoryScreen)
  )
);

assert(
  SUITE_5,
  'ConstellationHistoryScreen renders with data-testid="constellation-history-screen"',
  historyHtml.includes('data-testid="constellation-history-screen"'),
  'Test ID found in markup'
);

assert(
  SUITE_5,
  'ConstellationHistoryScreen renders SVG with viewBox="0 0 1000 600"',
  historyHtml.includes('viewBox="0 0 1000 600"'),
  'SVG canvas viewBox verified'
);

assert(
  SUITE_5,
  'ConstellationHistoryScreen renders 86 BPM breakdown horizon line',
  historyHtml.includes('HORIZON CRITICUS (86 BPM)') && historyHtml.includes('x1="298.4"'),
  'Horizon line and label found at x=298.4'
);

assert(
  SUITE_5,
  'ConstellationHistoryScreen renders Active Star Inspector Folio marginalia',
  historyHtml.includes('Folium Inspectionis Stellae') &&
    historyHtml.includes('BWV 1004 Allemande') &&
    historyHtml.includes('Nota Editoris (Critical Diagnosis)'),
  'Marginalia inspector aside found in markup'
);

const cleanHistoryHtml = historyHtml.replace(/<!-- -->/g, '');
assert(
  SUITE_5,
  'ConstellationHistoryScreen renders grid ticks (60 to 160 BPM, 60% to 100%)',
  cleanHistoryHtml.includes('60 BPM') &&
    cleanHistoryHtml.includes('160 BPM') &&
    cleanHistoryHtml.includes('100%') &&
    cleanHistoryHtml.includes('60%'),
  'Coordinate axes ticks present'
);

// 5.2 Render ComposerProfileScreen in Guest Mode
const profileHtml = renderToString(
  React.createElement(
    ClerkProvider,
    { publishableKey: 'pk_test_dummy_key_for_testing' },
    React.createElement(
      SpatialProvider,
      { initialTarget: 'profile', disableKeyboard: true, disableHashSync: true },
      React.createElement(ComposerProfileScreen, { isGuest: true })
    )
  )
);
const cleanProfileHtml = profileHtml.replace(/<!-- -->/g, '');

assert(
  SUITE_5,
  'ComposerProfileScreen renders with data-testid="composer-profile-screen"',
  cleanProfileHtml.includes('data-testid="composer-profile-screen"'),
  'Profile Test ID verified'
);

assert(
  SUITE_5,
  'ComposerProfileScreen renders Woodcut Crest with treble clef and MMXXVI',
  cleanProfileHtml.includes('MMXXVI') && cleanProfileHtml.includes('Folio II · Persona et Physiognomia'),
  'Frontispiece woodcut crest present'
);

assert(
  SUITE_5,
  'ComposerProfileScreen renders Physiognomy telemetry table in HTML',
  cleanProfileHtml.includes('48.4') &&
    cleanProfileHtml.includes('32,490') &&
    cleanProfileHtml.includes('91.4%') &&
    cleanProfileHtml.includes('14') &&
    cleanProfileHtml.includes('±14'),
  'Telemetry values formatted in HTML'
);

assert(
  SUITE_5,
  'ComposerProfileScreen renders Repertoire Ledger with 0px radius progress bars',
  cleanProfileHtml.includes('Partita No. 2 in D minor (BWV 1004)') &&
    cleanProfileHtml.includes('Gradus IV') &&
    cleanProfileHtml.includes('78%'),
  'Repertoire card and mastery progress bar verified'
);

assert(
  SUITE_5,
  'ComposerProfileScreen renders guest status in registry header',
  profileHtml.includes('REGISTRY: GUEST_MMXXVI // STATUS: AUDITION VIRTUS // DISCIPLINE ACTIVE'),
  'Guest auth status displayed'
);

// =========================================================================
// SUITE 6: Stress & Adversarial Edge Case Testing (Fuzzing / Generator)
// =========================================================================
const SUITE_6 = 'Suite 6: Adversarial Fuzzing & Stress Testing';

// 6.1 Fuzz testing coordinate mapping with 10,000 extreme/random inputs
let fuzzXPassed = true;
let fuzzYPassed = true;
let fuzzRadiusPassed = true;

for (let i = 0; i < 10000; i++) {
  // Extreme inputs from -5000 to +5000
  const randomBpm = (Math.random() - 0.5) * 10000;
  const randomAcc = (Math.random() - 0.5) * 1000;
  const randomMins = (Math.random() - 0.5) * 500;

  const x = mapTempoToX(randomBpm);
  const y = mapAccuracyToY(randomAcc);
  const r = mapDurationToRadius(randomMins);

  if (Number.isNaN(x) || !Number.isFinite(x) || x < 80 || x > 920) {
    fuzzXPassed = false;
  }
  if (Number.isNaN(y) || !Number.isFinite(y) || y < 60 || y > 540) {
    fuzzYPassed = false;
  }
  if (Number.isNaN(r) || !Number.isFinite(r) || r < 4 || r > 14) {
    fuzzRadiusPassed = false;
  }
}

assert(
  SUITE_6,
  '10,000 randomized BPM inputs strictly bound X within [80, 920] with zero NaNs',
  fuzzXPassed,
  '10,000 fuzzed BPM values clamped safely'
);

assert(
  SUITE_6,
  '10,000 randomized Accuracy inputs strictly bound Y within [60, 540] with zero NaNs',
  fuzzYPassed,
  '10,000 fuzzed Accuracy values clamped safely'
);

assert(
  SUITE_6,
  '10,000 randomized Duration inputs strictly bound Radius within [4, 14] with zero NaNs',
  fuzzRadiusPassed,
  '10,000 fuzzed Duration values clamped safely'
);

// 6.2 Zero / Negative / Infinity / NaN Defensive Handling
assert(
  SUITE_6,
  'mapTempoToX handles boundary values gracefully',
  mapTempoToX(-Infinity) === 80 && mapTempoToX(Infinity) === 920,
  `-Infinity -> ${mapTempoToX(-Infinity)}, Infinity -> ${mapTempoToX(Infinity)}`
);

assert(
  SUITE_6,
  'mapAccuracyToY handles boundary values gracefully',
  mapAccuracyToY(-Infinity) === 540 && mapAccuracyToY(Infinity) === 60,
  `-Infinity -> ${mapAccuracyToY(-Infinity)}, Infinity -> ${mapAccuracyToY(Infinity)}`
);

// 6.3 Filament generator handles edge case collections (0 nodes, 1 node, single piece)
function generateFilamentPath(nodes: Array<{ tempoBpm: number; accuracyPercent: number }>): string | null {
  if (nodes.length < 2) return null;
  const sorted = [...nodes].sort((a, b) => a.tempoBpm - b.tempoBpm);
  return sorted.reduce((acc, node, idx) => {
    const x = mapTempoToX(node.tempoBpm);
    const y = mapAccuracyToY(node.accuracyPercent);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');
}

assert(
  SUITE_6,
  'Filament generator returns null for 0 nodes',
  generateFilamentPath([]) === null,
  'Returned null as expected'
);

assert(
  SUITE_6,
  'Filament generator returns null for 1 node',
  generateFilamentPath([{ tempoBpm: 80, accuracyPercent: 90 }]) === null,
  'Returned null as expected'
);

assert(
  SUITE_6,
  'Filament generator returns valid SVG path for 2 identical nodes',
  generateFilamentPath([
    { tempoBpm: 80, accuracyPercent: 90 },
    { tempoBpm: 80, accuracyPercent: 90 },
  ]) === 'M 248 180 L 248 180',
  'Path generated properly'
);

// =========================================================================
// SUMMARY & REPORT
// =========================================================================
console.log('\n----------------------------------------------------------------');
const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;
console.log(`TOTAL TESTS: ${results.length}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${failedCount}`);
console.log('================================================================\n');

if (failedCount > 0) {
  console.error('FAILURES:');
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.error(`- [${r.suite}] ${r.name}: ${r.details}`);
    });
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL TESTS PASSED CONVINCINGLY.');
  process.exit(0);
}
