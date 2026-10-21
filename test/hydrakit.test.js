/**
 * test/hydrakit.test.js — Unit test suite for hydrakit midix, beatMs, and mutator protections
 */

import assert from 'assert';
import { midiEngine, midix, beatMs, midixStatus } from '../modules/hydrakit.js';
import { MutationJumpService } from '../modules/mutationJump/mutationJumpService.js';
import { Mutator } from '../modules/automutate.js';

console.log('Testing Hydrakit midix, beatMs, and Mutator Protections...\n');

// Mock window globals
global.window = {
  bpm: 120,
  cc: {},
  virtualCC: {}
};

// --- Test 1: beatMs calculation ---
{
  assert.strictEqual(beatMs(1, 120), 500, '1 beat @ 120bpm should be 500ms');
  assert.strictEqual(beatMs(4, 120), 2000, '4 beats @ 120bpm should be 2000ms');
  assert.strictEqual(beatMs(0.5, 120), 250, '0.5 beat @ 120bpm should be 250ms');
  // Default to window.bpm
  global.window.bpm = 60;
  assert.strictEqual(beatMs(1), 1000, '1 beat @ 60bpm should be 1000ms');
  global.window.bpm = 120;
  console.log('✔ beatMs timing conversions verified');
}

// --- Test 2: Numeric CC unreceived tracking & default value ---
{
  midix.reset();
  // CC 42 has never received a message
  const m = midix(42, { min: 0, max: 100, default: 20 });
  assert.strictEqual(m(), 20, 'midix should return custom default when CC not yet received');
  assert.strictEqual(m.pickedUp(), false, 'midix should not be picked up initially');

  // Receive a message on CC 42 far from default (e.g. 90/100 -> normalized 0.9)
  midiEngine.onMidiMessage({ data: [0xb0, 42, Math.round(0.9 * 127)] });
  assert.strictEqual(m(), 20, 'CC far from default should be ignored under pickup mode');
  assert.strictEqual(m.pickedUp(), false);

  // Now turn knob near default (e.g. 21/100 -> normalized 0.21, within 5% threshold)
  midiEngine.onMidiMessage({ data: [0xb0, 42, Math.round(0.21 * 127)] });
  m();
  assert.strictEqual(m.pickedUp(), true, 'midix should pick up when CC approaches default');
  console.log('✔ Numeric CC unreceived detection & pickup threshold verified');
}

// --- Test 3: Virtual CC (A-D) pickup crossing & live modulation ---
{
  midix.reset();
  global.window.cc['A'] = undefined;
  let mockTime = 1000;
  midix.setClock(() => mockTime);

  const m = midix('A', { min: 0, max: 10, default: 5, ease: 'none', pickup: true });
  assert.strictEqual(m(), 5, 'Virtual CC starts at default');

  // Knob was at 0, moves directly to 10 crossing default (5)
  global.window.cc['A'] = 0.0;
  m();
  assert.strictEqual(m.pickedUp(), false, 'Value at 0 is not close to 5');

  global.window.cc['A'] = 1.0; // jumps across 5
  assert.strictEqual(m(), 10, 'Crossing default triggers pickup and follows CC');
  assert.strictEqual(m.pickedUp(), true);

  // fn.set(v) jumps and re-arms pickup
  m.set(2);
  assert.strictEqual(m(), 2, 'fn.set(2) jumps value immediately');
  assert.strictEqual(m.pickedUp(), false, 'fn.set re-arms pickup');

  // Next move to 8 ignored until passing 2
  global.window.cc['A'] = 0.8;
  assert.strictEqual(m(), 2, 'CC ignored while waiting for pickup against new reference');

  global.window.cc['A'] = 0.2; // reaches 2
  m();
  assert.strictEqual(m.pickedUp(), true, 'Picked up at new reference point');
  console.log('✔ Virtual CC crossing detection and fn.set() pickup re-arm verified');
}

// --- Test 4: Shared state across Hydra sketch re-evaluation ---
{
  midix.reset();
  global.window.cc['B'] = 0.7; // normalized 0.7 -> 7 on range 0..10

  let mockTime = 1000;
  midix.setClock(() => mockTime);

  // Initial sketch evaluation
  const m1 = midix('B', { min: 0, max: 10, default: 5, ease: 'none', pickup: false });
  assert.strictEqual(m1(), 7, 'First evaluation reads CC');

  // Simulating Ctrl+Enter / auto-mutate re-evaluating sketch: midix is called again with identical settings
  const m2 = midix('B', { min: 0, max: 10, default: 5, ease: 'none', pickup: false });
  assert.strictEqual(m2(), 7, 'Re-evaluated midix call preserves shared state and does not reset to default');

  const status = midixStatus('B');
  assert.strictEqual(status.length, 1, 'Only one state entry tracked for identical control definition');
  console.log('✔ State persistence across sketch re-evaluation verified');
}

// --- Test 5: Easing modes (smooth spring, lerp, and retargeting timed tweens) ---
{
  midix.reset();
  let mockTime = 0;
  midix.setClock(() => mockTime);
  global.window.cc['C'] = undefined;

  // 5a. Critically damped spring (ease: 'smooth')
  const smoothControl = midix('C', { min: 0, max: 100, default: 0, ease: 'smooth', duration: 300, pickup: false });
  assert.strictEqual(smoothControl(), 0);

  global.window.cc['C'] = 1.0; // target 100
  mockTime = 100;
  const val100ms = smoothControl();
  assert.ok(val100ms > 0 && val100ms < 100, `Spring advances smoothly: ${val100ms}`);

  mockTime = 500;
  const val500ms = smoothControl();
  assert.ok(val500ms > 90, `Spring settles near target: ${val500ms}`);

  // 5b. Timed tween retargeting without stall
  midix.reset();
  mockTime = 0;
  global.window.cc['D'] = 0.0;
  const tweenControl = midix('D', { min: 0, max: 100, default: 0, ease: 'cubic', duration: 500, pickup: false });
  tweenControl();

  // Rapid knob turn: message 1 target 50
  global.window.cc['D'] = 0.5;
  mockTime = 100; // tween starts at t=100
  tweenControl();
  mockTime = 250; // advanced by 150ms
  const rapid1 = tweenControl();
  assert.ok(rapid1 > 0, `Tween progresses: ${rapid1}`);

  // Message 2 target 80 while tween still running
  global.window.cc['D'] = 0.8;
  mockTime = 350;
  const rapid2 = tweenControl();
  assert.ok(rapid2 > rapid1, `Retargeted tween continues progressing: ${rapid2} > ${rapid1}`);

  mockTime = 800;
  const rapidEnd = tweenControl();
  assert.strictEqual(rapidEnd, 80, 'Tween arrives at updated target');

  midix.setClock(null); // restore clock
  console.log('✔ Easing modes (SmoothDamp spring and non-stalling timed tweens) verified');
}

// --- Test 6: Mutation protection for midi, midix, and beatMs in AST mutators ---
{
  const testSketch = `
osc(midix("A", { min: 10, max: 80, default: 40, duration: () => beatMs(2) }))
  .color(1, 0.5, 0.2)
  .rotate(0.5)
  /* [master-effects-start:hsl_plus] */
  .hue(midix("B", { min: -1, max: 1, default: 0 }))
  /* [master-effects-end] */
  .out(o0);
`.trim();

  // 6a. MutationJumpService
  const jumpService = new MutationJumpService();
  const mutatedJump = jumpService.mutateCode(testSketch);

  assert.ok(
    mutatedJump.includes('min: 10') &&
    mutatedJump.includes('max: 80') &&
    mutatedJump.includes('default: 40') &&
    mutatedJump.includes('beatMs(2)'),
    'MutationJump must not alter midix option literals or beatMs calls'
  );
  assert.ok(mutatedJump.includes('/* [master-effects-start:hsl_plus] */'),
    'MutationJump must preserve master effects block');

  // 6b. Automutate Mutator
  let editorContent = testSketch;
  const mockEditor = {
    getValue: () => editorContent,
    setValue: (val) => { editorContent = val; }
  };
  const autoMutator = new Mutator(mockEditor);
  // Run 10 mutations
  for (let i = 0; i < 10; i++) {
    autoMutator.mutate({ changeTransform: false });
  }

  assert.ok(
    editorContent.includes('min: 10') &&
    editorContent.includes('max: 80') &&
    editorContent.includes('default: 40') &&
    editorContent.includes('beatMs(2)'),
    'Automutator must not mutate literals inside protected midix calls'
  );
  assert.ok(editorContent.includes('/* [master-effects-start:hsl_plus] */'),
    'Automutator must preserve master effects block');

  console.log('✔ Mutator protection for midi/midix/beatMs and Master Effects blocks verified');
}

console.log('\nAll Hydrakit tests PASSED successfully! 🎛️⚡🎉');
