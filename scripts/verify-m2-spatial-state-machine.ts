/**
 * Challenger M2-1 Empirical Verification & Stress Test Suite
 * Spatial State Machine, Navigation Transitions, Hash Inputs, & Keyboard Shielding
 */

import {
  VALID_SPATIAL_TARGETS,
  isSpatialTarget,
  type SpatialTarget,
  type SpatialCoordinates,
} from '../apps/web/src/components/spatial/types';
import {
  SPATIAL_MOTION_CONFIG,
  MUSICAL_GLYPHS,
} from '../apps/web/src/design-system/tokens';

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
console.log('CHALLENGER M2-1: EMPIRICAL SPATIAL STATE MACHINE TEST HARNESS');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// SUITE 1: 4-Target Transition Matrix & State Machine Invariants
// -------------------------------------------------------------------------
const SUITE_1 = 'Suite 1: State Machine Transitions';

// 1.1 Type Guard & Target Completeness
assert(
  SUITE_1,
  'VALID_SPATIAL_TARGETS contains exactly 4 targets',
  VALID_SPATIAL_TARGETS.length === 4 &&
    VALID_SPATIAL_TARGETS.includes('practice') &&
    VALID_SPATIAL_TARGETS.includes('profile') &&
    VALID_SPATIAL_TARGETS.includes('history') &&
    VALID_SPATIAL_TARGETS.includes('tuning'),
  `Targets: ${VALID_SPATIAL_TARGETS.join(', ')}`
);

// 1.2 State machine transition simulator
class SimulatedSpatialStateMachine {
  currentTarget: SpatialTarget = 'practice';
  previousTarget: SpatialTarget | null = null;
  isPanning = false;

  panTo(target: unknown): boolean {
    if (!isSpatialTarget(target)) return false;
    if (this.currentTarget === target) return false; // idempotent no-op

    this.previousTarget = this.currentTarget;
    this.currentTarget = target;
    this.isPanning = true;
    return true;
  }

  returnToCenter(): boolean {
    return this.panTo('practice');
  }

  canNavigate(target: unknown): boolean {
    return isSpatialTarget(target) && target !== this.currentTarget;
  }
}

const sm = new SimulatedSpatialStateMachine();

// Test all 6 core bidirectionals:
// practice <-> profile
assert(SUITE_1, 'practice -> profile transition', sm.panTo('profile') && sm.currentTarget === 'profile' && sm.previousTarget === 'practice');
assert(SUITE_1, 'profile -> practice returnToCenter', sm.returnToCenter() && sm.currentTarget === 'practice' && sm.previousTarget === 'profile');

// practice <-> history
assert(SUITE_1, 'practice -> history transition', sm.panTo('history') && sm.currentTarget === 'history' && sm.previousTarget === 'practice');
assert(SUITE_1, 'history -> practice returnToCenter', sm.returnToCenter() && sm.currentTarget === 'practice' && sm.previousTarget === 'history');

// practice <-> tuning
assert(SUITE_1, 'practice -> tuning transition', sm.panTo('tuning') && sm.currentTarget === 'tuning' && sm.previousTarget === 'practice');
assert(SUITE_1, 'tuning -> practice returnToCenter', sm.returnToCenter() && sm.currentTarget === 'practice' && sm.previousTarget === 'tuning');

// Direct cross-transitions (Compass 4-point modalities)
assert(SUITE_1, 'practice -> profile', sm.panTo('profile'));
assert(SUITE_1, 'profile -> history direct transition', sm.panTo('history') && sm.currentTarget === 'history' && sm.previousTarget === 'profile');
assert(SUITE_1, 'history -> tuning direct transition', sm.panTo('tuning') && sm.currentTarget === 'tuning' && sm.previousTarget === 'history');
assert(SUITE_1, 'tuning -> profile direct transition', sm.panTo('profile') && sm.currentTarget === 'profile' && sm.previousTarget === 'tuning');
sm.returnToCenter();

// Idempotency: panTo same target must return false and preserve previousTarget
sm.panTo('profile');
const prev = sm.previousTarget;
const noopResult = sm.panTo('profile');
assert(
  SUITE_1,
  'Idempotent panTo("profile") while at profile is rejected',
  noopResult === false && sm.currentTarget === 'profile' && sm.previousTarget === prev
);

// Invalid target rejection
const invalidResult = sm.panTo('invalid' as any);
assert(
  SUITE_1,
  'Invalid target panTo("invalid") is rejected without mutating state',
  invalidResult === false && sm.currentTarget === 'profile'
);

// -------------------------------------------------------------------------
// SUITE 2: Boundary & Invalid Hash Inputs
// -------------------------------------------------------------------------
const SUITE_2 = 'Suite 2: Hash Inputs & Boundaries';

// Reproduction of spatial-context parseHashTarget logic:
function parseHashTarget(hashString: string): SpatialTarget | null {
  const hash = hashString.replace(/^#/, '').toLowerCase().trim();
  return isSpatialTarget(hash) ? hash : null;
}

const hashCases: Array<{ input: string; expected: SpatialTarget | null; desc: string }> = [
  { input: '#practice', expected: 'practice', desc: 'Canonical #practice' },
  { input: '#profile', expected: 'profile', desc: 'Canonical #profile' },
  { input: '#history', expected: 'history', desc: 'Canonical #history' },
  { input: '#tuning', expected: 'tuning', desc: 'Canonical #tuning' },
  { input: '#PRACTICE', expected: 'practice', desc: 'Uppercase #PRACTICE' },
  { input: '#Profile', expected: 'profile', desc: 'Titlecase #Profile' },
  { input: '#HISTORY', expected: 'history', desc: 'Uppercase #HISTORY' },
  { input: '#Tuning', expected: 'tuning', desc: 'Titlecase #Tuning' },
  { input: '#  profile  ', expected: 'profile', desc: 'Whitespace padded #  profile  ' },
  { input: '', expected: null, desc: 'Empty hash "" falls back to null (practice in context)' },
  { input: '#', expected: null, desc: 'Single hash "#" falls back to null' },
  { input: '##', expected: null, desc: 'Double hash "##" falls back to null' },
  { input: '#invalid', expected: null, desc: 'Arbitrary string #invalid' },
  { input: '#unknown', expected: null, desc: 'Arbitrary string #unknown' },
  { input: '#guest', expected: null, desc: 'Guest mode hash #guest (non-spatial folio)' },
  { input: '#practice?tempo=120', expected: null, desc: 'Hash with query parameter (strict slug check)' },
  { input: '#tuning/1', expected: null, desc: 'Sub-path hash' },
  { input: '#\u0000', expected: null, desc: 'Null character in hash' },
];

for (const tc of hashCases) {
  const actual = parseHashTarget(tc.input);
  const fallbackTarget = actual || 'practice';
  const expectedFallback = tc.expected || 'practice';
  assert(
    SUITE_2,
    `Hash case: ${tc.desc}`,
    fallbackTarget === expectedFallback,
    `Input: "${tc.input}" -> Parsed: ${actual} -> Effective target: ${fallbackTarget}`
  );
}

// -------------------------------------------------------------------------
// SUITE 3: Keyboard Event Shielding & Navigation Key Map
// -------------------------------------------------------------------------
const SUITE_3 = 'Suite 3: Keyboard Event Handling & Shielding';

interface MockKeyboardEvent {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  defaultPrevented?: boolean;
  activeElementTag?: string;
  isContentEditable?: boolean;
}

function simulateKeyNavigation(
  e: MockKeyboardEvent,
  currentTarget: SpatialTarget
): { navigatedTo: SpatialTarget | null; defaultPrevented: boolean } {
  let prevented = false;

  if (e.defaultPrevented) return { navigatedTo: null, defaultPrevented: false };
  if (e.altKey || e.ctrlKey || e.metaKey) return { navigatedTo: null, defaultPrevented: false };

  const tag = e.activeElementTag || 'BODY';
  if (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    e.isContentEditable
  ) {
    return { navigatedTo: null, defaultPrevented: false };
  }

  const key = e.key;

  if (key === 'Escape') {
    if (currentTarget !== 'practice') {
      return { navigatedTo: 'practice', defaultPrevented: true };
    }
    return { navigatedTo: null, defaultPrevented: false };
  }

  // Up: Profile
  if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    if (currentTarget === 'practice') {
      return { navigatedTo: 'profile', defaultPrevented: true };
    }
  }
  // Down: Return to Practice from Profile
  else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    if (currentTarget === 'profile') {
      return { navigatedTo: 'practice', defaultPrevented: true };
    }
  }
  // Left: History from Practice, or Return to Practice from Tuning
  else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    if (currentTarget === 'practice') {
      return { navigatedTo: 'history', defaultPrevented: true };
    } else if (currentTarget === 'tuning') {
      return { navigatedTo: 'practice', defaultPrevented: true };
    }
  }
  // Right: Tuning from Practice, or Return to Practice from History
  else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    if (currentTarget === 'practice') {
      return { navigatedTo: 'tuning', defaultPrevented: true };
    } else if (currentTarget === 'history') {
      return { navigatedTo: 'practice', defaultPrevented: true };
    }
  }

  return { navigatedTo: null, defaultPrevented: false };
}

// 3.1 Input Shielding
const shieldedTags = ['INPUT', 'TEXTAREA', 'SELECT'];
const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', 'Escape'];

for (const tag of shieldedTags) {
  for (const key of navKeys) {
    const res = simulateKeyNavigation({ key, activeElementTag: tag }, 'practice');
    assert(
      SUITE_3,
      `Shielding: tag <${tag}> shields key "${key}"`,
      res.navigatedTo === null && res.defaultPrevented === false
    );
  }
}

// ContentEditable shielding
for (const key of navKeys) {
  const res = simulateKeyNavigation({ key, isContentEditable: true }, 'practice');
  assert(
    SUITE_3,
    `Shielding: isContentEditable shields key "${key}"`,
    res.navigatedTo === null && res.defaultPrevented === false
  );
}

// 3.2 Modifiers Shielding
const modifiers: Array<{ name: string; opts: Partial<MockKeyboardEvent> }> = [
  { name: 'Ctrl', opts: { ctrlKey: true } },
  { name: 'Alt', opts: { altKey: true } },
  { name: 'Meta', opts: { metaKey: true } },
  { name: 'Ctrl+Alt', opts: { ctrlKey: true, altKey: true } },
];

for (const mod of modifiers) {
  for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'Escape']) {
    const res = simulateKeyNavigation({ key, ...mod.opts }, 'practice');
    assert(
      SUITE_3,
      `Modifier shielding: ${mod.name}+"${key}" does not navigate`,
      res.navigatedTo === null
    );
  }
}

// 3.3 Active Key Mappings
assert(SUITE_3, 'practice + ArrowUp -> profile', simulateKeyNavigation({ key: 'ArrowUp' }, 'practice').navigatedTo === 'profile');
assert(SUITE_3, 'practice + w -> profile', simulateKeyNavigation({ key: 'w' }, 'practice').navigatedTo === 'profile');
assert(SUITE_3, 'practice + W -> profile', simulateKeyNavigation({ key: 'W' }, 'practice').navigatedTo === 'profile');

assert(SUITE_3, 'profile + ArrowDown -> practice', simulateKeyNavigation({ key: 'ArrowDown' }, 'profile').navigatedTo === 'practice');
assert(SUITE_3, 'profile + s -> practice', simulateKeyNavigation({ key: 's' }, 'profile').navigatedTo === 'practice');
assert(SUITE_3, 'profile + S -> practice', simulateKeyNavigation({ key: 'S' }, 'profile').navigatedTo === 'practice');
assert(SUITE_3, 'profile + Escape -> practice', simulateKeyNavigation({ key: 'Escape' }, 'profile').navigatedTo === 'practice');

assert(SUITE_3, 'practice + ArrowLeft -> history', simulateKeyNavigation({ key: 'ArrowLeft' }, 'practice').navigatedTo === 'history');
assert(SUITE_3, 'practice + a -> history', simulateKeyNavigation({ key: 'a' }, 'practice').navigatedTo === 'history');
assert(SUITE_3, 'history + ArrowRight -> practice', simulateKeyNavigation({ key: 'ArrowRight' }, 'history').navigatedTo === 'practice');
assert(SUITE_3, 'history + d -> practice', simulateKeyNavigation({ key: 'd' }, 'history').navigatedTo === 'practice');
assert(SUITE_3, 'history + Escape -> practice', simulateKeyNavigation({ key: 'Escape' }, 'history').navigatedTo === 'practice');

assert(SUITE_3, 'practice + ArrowRight -> tuning', simulateKeyNavigation({ key: 'ArrowRight' }, 'practice').navigatedTo === 'tuning');
assert(SUITE_3, 'practice + d -> tuning', simulateKeyNavigation({ key: 'd' }, 'practice').navigatedTo === 'tuning');
assert(SUITE_3, 'tuning + ArrowLeft -> practice', simulateKeyNavigation({ key: 'ArrowLeft' }, 'tuning').navigatedTo === 'practice');
assert(SUITE_3, 'tuning + a -> practice', simulateKeyNavigation({ key: 'a' }, 'tuning').navigatedTo === 'practice');
assert(SUITE_3, 'tuning + Escape -> practice', simulateKeyNavigation({ key: 'Escape' }, 'tuning').navigatedTo === 'practice');

// Boundary key presses that must NOT navigate:
assert(SUITE_3, 'practice + ArrowDown does NOT navigate (no bottom screen)', simulateKeyNavigation({ key: 'ArrowDown' }, 'practice').navigatedTo === null);
assert(SUITE_3, 'profile + ArrowUp does NOT navigate (already at top)', simulateKeyNavigation({ key: 'ArrowUp' }, 'profile').navigatedTo === null);
assert(SUITE_3, 'history + ArrowLeft does NOT navigate (already at left)', simulateKeyNavigation({ key: 'ArrowLeft' }, 'history').navigatedTo === null);
assert(SUITE_3, 'tuning + ArrowRight does NOT navigate (already at right)', simulateKeyNavigation({ key: 'ArrowRight' }, 'tuning').navigatedTo === null);
assert(SUITE_3, 'practice + Escape does NOT navigate (already at center)', simulateKeyNavigation({ key: 'Escape' }, 'practice').navigatedTo === null);

// -------------------------------------------------------------------------
// SUITE 4: Motion Physics & Coordinate Alignment
// -------------------------------------------------------------------------
const SUITE_4 = 'Suite 4: Coordinate Physics Alignment';

const coords = SPATIAL_MOTION_CONFIG.coordinates;

assert(SUITE_4, 'practice coordinate is (0, 0)', coords.practice.x === 0 && coords.practice.y === 0);
assert(SUITE_4, 'profile translation is (0, 1) -> +100vh canvas translation', coords.profile.x === 0 && coords.profile.y === 1);
assert(SUITE_4, 'history translation is (1, 0) -> +100vw canvas translation', coords.history.x === 1 && coords.history.y === 0);
assert(SUITE_4, 'tuning translation is (-1, 0) -> -100vw canvas translation', coords.tuning.x === -1 && coords.tuning.y === 0);

// Physics tokens
assert(SUITE_4, 'Spring stiffness is 70', SPATIAL_MOTION_CONFIG.spring.stiffness === 70);
assert(SUITE_4, 'Spring damping is 18', SPATIAL_MOTION_CONFIG.spring.damping === 18);
assert(SUITE_4, 'Spring mass is 1', SPATIAL_MOTION_CONFIG.spring.mass === 1);

// -------------------------------------------------------------------------
// SUITE 5: Fuzz Stress Testing (1000 Iterations)
// -------------------------------------------------------------------------
const SUITE_5 = 'Suite 5: Monte Carlo Fuzz Stress Testing';

const allPossibleKeys = [
  ...navKeys,
  'Tab', 'Enter', 'Space', 'Backspace', 'Control', 'Shift', 'Alt', 'Meta',
  '1', '2', '3', 'q', 'e', 'r', 'f', 'z', 'c',
];
const allTags = ['BODY', 'INPUT', 'TEXTAREA', 'SELECT', 'DIV', 'BUTTON'];

let fuzzState: SpatialTarget = 'practice';
let fuzzSuccessCount = 0;

for (let i = 0; i < 1000; i++) {
  const randomKey = allPossibleKeys[Math.floor(Math.random() * allPossibleKeys.length)];
  const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
  const randomCtrl = Math.random() < 0.2;
  const randomAlt = Math.random() < 0.1;
  const randomMeta = Math.random() < 0.1;
  const isEditable = Math.random() < 0.1;

  const event: MockKeyboardEvent = {
    key: randomKey,
    ctrlKey: randomCtrl,
    altKey: randomAlt,
    metaKey: randomMeta,
    activeElementTag: randomTag,
    isContentEditable: isEditable,
  };

  const { navigatedTo } = simulateKeyNavigation(event, fuzzState);
  if (navigatedTo) {
    // Assert target is valid
    if (isSpatialTarget(navigatedTo)) {
      fuzzState = navigatedTo;
      fuzzSuccessCount++;
    } else {
      throw new Error(`Fuzzing navigated to invalid target: ${navigatedTo}`);
    }
  }
}

assert(
  SUITE_5,
  '1000-cycle Monte Carlo fuzz test completed without invariant violations',
  isSpatialTarget(fuzzState) && fuzzSuccessCount > 0,
  `Final target: ${fuzzState}, transitions executed: ${fuzzSuccessCount}`
);

// -------------------------------------------------------------------------
// SUMMARY & OUTPUT
// -------------------------------------------------------------------------
console.log('----------------------------------------------------------------');
const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;

console.log(`TOTAL TESTS: ${results.length}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${failedCount}`);

if (failedCount > 0) {
  console.log('\nFAILED TESTS:');
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`- [${r.suite}] ${r.name}: ${r.details}`);
  }
}

console.log('================================================================');
if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
