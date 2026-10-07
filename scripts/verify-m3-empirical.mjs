/**
 * Challenger M3-1: Empirical Verification & Stress Test Suite
 * Milestone 3: Landing Screen & Tuning Ritual Screen
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const results = [];

function assert(suite, name, condition, details, challengeNote) {
  results.push({
    suite,
    name,
    passed: !!condition,
    details: details || (condition ? 'PASSED' : 'FAILED'),
    challengeNote,
  });
}

console.log('================================================================');
console.log('CHALLENGER M3-1: EMPIRICAL VERIFICATION & STRESS HARNESS');
console.log('Milestone 3 — Landing Screen & Tuning Ritual Screen');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: Astrolabe Needle Angle Formula Mathematical Oracle
// ============================================================================
const SUITE_1 = 'Suite 1: Astrolabe Needle Angle Math Oracle';

function specCentsToNeedleAngle(cents) {
  const clamped = Math.max(-50, Math.min(50, cents));
  return (clamped / 50) * 60;
}

// 1.1 Reference Values Specified in Dispatch
const refPoints = [
  { cents: -50, expectedAngle: -60.0 },
  { cents: -25, expectedAngle: -30.0 },
  { cents: 0, expectedAngle: 0.0 },
  { cents: 25, expectedAngle: 30.0 },
  { cents: 50, expectedAngle: 60.0 },
];

for (const { cents, expectedAngle } of refPoints) {
  const actual = specCentsToNeedleAngle(cents);
  assert(
    SUITE_1,
    `Reference point: ${cents > 0 ? '+' : ''}${cents}¢ yields ${expectedAngle}°`,
    Math.abs(actual - expectedAngle) < 1e-9,
    `cents=${cents} -> actual=${actual}°, expected=${expectedAngle}°`
  );
}

// 1.2 Boundary & Clamping Stress Tests
const boundaryPoints = [
  { cents: -100, expectedAngle: -60.0, desc: 'Extreme flat -100¢ clamped to -60°' },
  { cents: 100, expectedAngle: 60.0, desc: 'Extreme sharp +100¢ clamped to +60°' },
  { cents: -50.0001, expectedAngle: -60.0, desc: 'Micro flat boundary -50.0001¢ clamped to -60°' },
  { cents: 50.0001, expectedAngle: 60.0, desc: 'Micro sharp boundary +50.0001¢ clamped to +60°' },
  { cents: -1000, expectedAngle: -60.0, desc: 'Pathological flat -1000¢ clamped to -60°' },
  { cents: 1000, expectedAngle: 60.0, desc: 'Pathological sharp +1000¢ clamped to +60°' },
];

for (const { cents, expectedAngle, desc } of boundaryPoints) {
  const actual = specCentsToNeedleAngle(cents);
  assert(
    SUITE_1,
    desc,
    Math.abs(actual - expectedAngle) < 1e-4,
    `cents=${cents} -> actual=${actual}°, expected=${expectedAngle}°`
  );
}

// 1.3 Linear Gradient & Monotonicity Check
let isMonotonic = true;
let constantGradient = true;
const dCents = 1.0;
for (let c = -49; c <= 49; c += dCents) {
  const aPrev = specCentsToNeedleAngle(c - 1);
  const aCurr = specCentsToNeedleAngle(c);
  if (aCurr <= aPrev) isMonotonic = false;
  const gradient = (aCurr - aPrev) / 1.0;
  if (Math.abs(gradient - 1.2) > 1e-7) constantGradient = false;
}
assert(
  SUITE_1,
  'Needle angle is strictly monotonic increasing over [-50, +50]',
  isMonotonic,
  'dθ/dc > 0 across entire active arc'
);
assert(
  SUITE_1,
  'Angular sensitivity gradient is exactly 1.2° per cent',
  constantGradient,
  'Gradient = 60° / 50¢ = 1.2°/¢'
);


// ============================================================================
// SUITE 2: In-Tune Resonance Halo Threshold Oracle
// ============================================================================
const SUITE_2 = 'Suite 2: In-Tune Resonance Ring Activation Oracle';

function isInTune(cents) {
  return Math.abs(cents) <= 3.0;
}

const resonancePoints = [
  { cents: 0.0, expected: true, desc: 'Exact equilibrium 0.0¢ is in-tune' },
  { cents: 1.5, expected: true, desc: 'Halfway tolerance +1.5¢ is in-tune' },
  { cents: -1.5, expected: true, desc: 'Halfway tolerance -1.5¢ is in-tune' },
  { cents: 3.0, expected: true, desc: 'Positive boundary exactly +3.0¢ is in-tune' },
  { cents: -3.0, expected: true, desc: 'Negative boundary exactly -3.0¢ is in-tune' },
  { cents: 3.0001, expected: false, desc: 'Strict boundary transgression +3.0001¢ is out-of-tune' },
  { cents: -3.0001, expected: false, desc: 'Strict boundary transgression -3.0001¢ is out-of-tune' },
  { cents: 18.0, expected: false, desc: 'Worker test trigger +18¢ is out-of-tune' },
  { cents: -18.0, expected: false, desc: 'Worker test trigger -18¢ is out-of-tune' },
  { cents: 24.0, expected: false, desc: 'Worker test trigger +24¢ is out-of-tune' },
];

for (const { cents, expected, desc } of resonancePoints) {
  const actual = isInTune(cents);
  assert(
    SUITE_2,
    desc,
    actual === expected,
    `cents=${cents} -> inTune=${actual}, expected=${expected}`
  );
}


// ============================================================================
// SUITE 3: Equal Temperament Chromatic Pitch Engine Oracle
// ============================================================================
const SUITE_3 = 'Suite 3: Equal Temperament & A4 Reference Pitch Engine';

const CHROMATIC_NOTES = [
  'C', 'C♯', 'D', 'E♭', 'E', 'F',
  'F♯', 'G', 'A♭', 'A', 'B♭', 'B',
];

function frequencyToPitchSpec(frequency, a4Standard = 440.0) {
  if (!frequency || frequency <= 0 || !Number.isFinite(frequency)) {
    return null;
  }
  const midiFractional = 69 + 12 * Math.log2(frequency / a4Standard);
  const midiNote = Math.round(midiFractional);
  const nominalFrequency = a4Standard * Math.pow(2, (midiNote - 69) / 12);
  const centsDeviation = 1200 * Math.log2(frequency / nominalFrequency);
  const octave = Math.floor(midiNote / 12) - 1;
  const chroma = ((midiNote % 12) + 12) % 12;
  const noteName = CHROMATIC_NOTES[chroma] ?? 'A';
  const fullNote = `${noteName}${octave}`;
  const inTune = Math.abs(centsDeviation) <= 3.0;

  return {
    noteName,
    octave,
    fullNote,
    nominalFrequency: Math.round(nominalFrequency * 10) / 10,
    centsDeviation: Math.round(centsDeviation * 10) / 10,
    inTune,
  };
}

// 3.1 Standard Modern Concert Pitch A4 = 440 Hz
const pitchA4_440 = frequencyToPitchSpec(440.0, 440.0);
assert(
  SUITE_3,
  '440.0 Hz at A4=440 yields A4 with 0.0¢ deviation',
  pitchA4_440?.fullNote === 'A4' && pitchA4_440?.centsDeviation === 0.0 && pitchA4_440?.inTune === true,
  JSON.stringify(pitchA4_440)
);

// 3.2 Baroque Kammerton Standard A4 = 415 Hz
const pitchA4_415 = frequencyToPitchSpec(415.0, 415.0);
assert(
  SUITE_3,
  '415.0 Hz at A4=415 yields A4 with 0.0¢ deviation',
  pitchA4_415?.fullNote === 'A4' && pitchA4_415?.centsDeviation === 0.0 && pitchA4_415?.inTune === true,
  JSON.stringify(pitchA4_415)
);

// 3.3 Symphonic Standard A4 = 442 Hz
const pitchA4_442 = frequencyToPitchSpec(442.0, 442.0);
assert(
  SUITE_3,
  '442.0 Hz at A4=442 yields A4 with 0.0¢ deviation',
  pitchA4_442?.fullNote === 'A4' && pitchA4_442?.centsDeviation === 0.0 && pitchA4_442?.inTune === true,
  JSON.stringify(pitchA4_442)
);

// 3.4 Flat note at -18 cents
const freqFlat18 = 440.0 * Math.pow(2, -18 / 1200);
const pitchFlat18 = frequencyToPitchSpec(freqFlat18, 440.0);
assert(
  SUITE_3,
  'Frequency corresponding to -18¢ detects as A4 with -18.0¢ deviation and out-of-tune',
  pitchFlat18?.fullNote === 'A4' && Math.abs(pitchFlat18?.centsDeviation - (-18.0)) <= 0.1 && pitchFlat18?.inTune === false,
  JSON.stringify(pitchFlat18)
);

// 3.5 Sharp note at +24 cents
const freqSharp24 = 440.0 * Math.pow(2, 24 / 1200);
const pitchSharp24 = frequencyToPitchSpec(freqSharp24, 440.0);
assert(
  SUITE_3,
  'Frequency corresponding to +24¢ detects as A4 with +24.0¢ deviation and out-of-tune',
  pitchSharp24?.fullNote === 'A4' && Math.abs(pitchSharp24?.centsDeviation - 24.0) <= 0.1 && pitchSharp24?.inTune === false,
  JSON.stringify(pitchSharp24)
);


// ============================================================================
// SUITE 4: Source Code Contract & Visual Token Verification
// ============================================================================
const SUITE_4 = 'Suite 4: Source Code Blueprint & Token Conformance';

const landingPath = path.resolve(rootDir, 'apps/web/src/components/screens/landing-screen.tsx');
const tuningPath = path.resolve(rootDir, 'apps/web/src/components/screens/tuning-ritual-screen.tsx');
const inkBleedPath = path.resolve(rootDir, 'apps/web/src/components/ui/ink-bleed-filter.tsx');

const landingSource = fs.readFileSync(landingPath, 'utf8');
const tuningSource = fs.readFileSync(tuningPath, 'utf8');
const inkBleedSource = fs.readFileSync(inkBleedPath, 'utf8');

// 4.1 Landing Screen Ink Bleed Filter Integration
assert(
  SUITE_4,
  'LandingScreen renders <InkBleedFilter id="ink-bleed" ... />',
  landingSource.includes('<InkBleedFilter') && landingSource.includes('id="ink-bleed"'),
  'Verified InkBleedFilter component invocation'
);

assert(
  SUITE_4,
  'LandingScreen applies filter: url(#ink-bleed) to PRISM calligraphic title and bloom underlay',
  landingSource.includes("filter: 'url(#ink-bleed)'"),
  'Verified SVG filter URL reference on title and underlay'
);

// 4.2 Guest Audition CTA
assert(
  SUITE_4,
  'LandingScreen implements [data-testid="guest-audition-btn"] with instant session storage entry',
  landingSource.includes('data-testid="guest-audition-btn"') &&
  landingSource.includes("sessionStorage.setItem('prism_guest_mode', 'true')"),
  'Verified guest-audition-btn and session storage flag'
);

// 4.3 Ink Bleed Filter SVG Primitive Pipeline
assert(
  SUITE_4,
  'InkBleedFilter declares feTurbulence, feDisplacementMap, feGaussianBlur, feMerge pipeline',
  inkBleedSource.includes('<feTurbulence') &&
  inkBleedSource.includes('<feDisplacementMap') &&
  inkBleedSource.includes('<feGaussianBlur') &&
  inkBleedSource.includes('<feMerge'),
  'Verified complete 4-stage procedural SVG filter pipeline'
);

// 4.4 Astrolabe Dial Geometry in Tuning Ritual Screen
assert(
  SUITE_4,
  'TuningRitualScreen implements Astrolabe 320px SVG dial and needle',
  tuningSource.includes('data-testid="astrolabe-dial"') &&
  tuningSource.includes('data-testid="astrolabe-needle"'),
  'Verified dial and needle testids'
);

assert(
  SUITE_4,
  'TuningRitualScreen needle transform applies computed needleAngle degrees',
  tuningSource.includes('transform: `rotate(${needleAngle}deg)`') &&
  tuningSource.includes("transformOrigin: '160px 160px'"),
  'Verified needle rotation and origin at 160, 160'
);

assert(
  SUITE_4,
  'TuningRitualScreen resonance ring activates stroke #9A2A2A and glow filter on inTune',
  tuningSource.includes("stroke={inTune ? '#9A2A2A' : '#2C2A29'}") &&
  tuningSource.includes("strokeWidth={inTune ? '3' : '0.75'}") &&
  tuningSource.includes('filter={inTune ? `url(#halo-glow-${filterId})` : undefined}'),
  'Verified inTune conditional styling and SVG halo filter'
);

assert(
  SUITE_4,
  'TuningRitualScreen provides deterministic test triggers (0¢, -18¢, +24¢)',
  tuningSource.includes('data-testid="test-in-tune"') &&
  tuningSource.includes('data-testid="test-flat"') &&
  tuningSource.includes('data-testid="test-sharp"'),
  'Verified headless test triggers'
);


// ============================================================================
// SUITE 5: Adversarial Stress-Testing & Failure Mode Identification
// ============================================================================
const SUITE_5 = 'Suite 5: Adversarial Review & Bug Detection';

// Challenge 5.1: Mode Switcher Leaking Active Microphone Stream
// In tuning-ritual-screen.tsx, when setMode('midi') is called, stopMicrophone is NOT invoked,
// nor does loop() check if mode === 'mic'.
const loopChecksMode = tuningSource.includes("if (mode !== 'mic') return") || tuningSource.includes("if (mode === 'midi') return");
const effectHandlesModeSwitch = tuningSource.includes("if (mode === 'midi') {\n      stopMicrophone") || tuningSource.includes("mode === 'midi' && stopMicrophone");

const micCleanlyTerminatedOnMidi = loopChecksMode || effectHandlesModeSwitch;

assert(
  SUITE_5,
  'CHALLENGE: Switching to MIDI mode cleanly terminates the physical microphone stream and pauses audio loop',
  micCleanlyTerminatedOnMidi,
  micCleanlyTerminatedOnMidi
    ? 'stopMicrophone called or loop paused when mode switches to midi'
    : 'BUG FOUND: setMode("midi") leaves AudioContext and requestAnimationFrame(loop) running. Real mic loop continues capturing and overriding pitch state while in MIDI mode.',
  'HIGH: Audio stream leak and mode state collision. The microphone stream continues processing input during MIDI mode because loop() lacks a mode guard and setMode does not stop the microphone.'
);

// Challenge 5.2: Test Simulation Triggers Overwritten by Real Mic / Drift Interval
const triggersPauseDrift =
  tuningSource.includes("isSimulated = false") && tuningSource.includes("triggerSimulationCents") ||
  tuningSource.includes("driftPaused");

assert(
  SUITE_5,
  'CHALLENGE: Headless test triggers (0¢, -18¢, +24¢) latch state without immediate overwrite by drift loop or mic',
  triggersPauseDrift,
  triggersPauseDrift
    ? 'Triggers hold deterministic state'
    : 'FAILURE: triggerSimulationCents sets state but does NOT pause the 50ms drift interval or real mic loop. The simulated drift or real mic overwrites triggered values in 50ms - 500ms.',
  'HIGH: Test flakiness risk in Playwright E2E. Automated assertions must assert immediately before the 50ms drift interval or ambient audio frame fires.'
);


// ============================================================================
// REPORT EXECUTION SUMMARY
// ============================================================================
console.log('RESULTS BY SUITE:');
let totalPassed = 0;
let totalFailed = 0;

const grouped = {};
for (const r of results) {
  grouped[r.suite] = grouped[r.suite] || [];
  grouped[r.suite].push(r);
  if (r.passed) totalPassed++;
  else totalFailed++;
}

for (const [suiteName, tests] of Object.entries(grouped)) {
  console.log(`\n--- ${suiteName} ---`);
  for (const t of tests) {
    const icon = t.passed ? '✓' : '✗';
    console.log(`  ${icon} ${t.name}`);
    if (!t.passed && t.challengeNote) {
      console.log(`    -> Challenge: ${t.challengeNote}`);
    }
  }
}

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${totalPassed} | FINDINGS: ${totalFailed}`);
console.log('================================================================\n');

// Write out JSON report for handoff reference
const reportOut = {
  timestamp: new Date().toISOString(),
  totalTests: results.length,
  passed: totalPassed,
  failed: totalFailed,
  results,
};

fs.writeFileSync(
  path.resolve(__dirname, 'm3-empirical-results.json'),
  JSON.stringify(reportOut, null, 2)
);
console.log('Wrote execution results to scripts/m3-empirical-results.json');
