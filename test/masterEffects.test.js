import assert from 'node:assert';
import { masterEffectsService, MASTER_EFFECTS } from '../modules/masterEffects/masterEffectsService.js';

console.log('Testing Master Effects Service & AST Transformation...');

// Test 1: Preset definitions and MIDI bindings
assert.strictEqual(MASTER_EFFECTS.length >= 4, true, 'At least 4 presets exist');
for (const preset of MASTER_EFFECTS) {
  assert.ok(preset.controls.length <= 4, `${preset.id} must use at most 4 midi controls, has ${preset.controls.length}`);
  for (const ctrl of preset.controls) {
    assert.ok(['A', 'B', 'C', 'D'].includes(ctrl.cc), `${preset.id} control ${ctrl.cc} must be within A-D`);
  }
  assert.ok(preset.chain.includes('midix('), `${preset.id} chain must use midix macro`);
  assert.ok(preset.chain.includes('beatMs(2)'), `${preset.id} chain must use default beatMs(2)`);
}
const hsl = MASTER_EFFECTS.find(e => e.id === 'hsl_plus');
assert.ok(hsl, 'HSL+ preset exists');
assert.strictEqual(hsl.controls.length, 4, 'HSL+ has 4 controls: A, B, C, D');
assert.strictEqual(hsl.controls[0].cc, 'A');
assert.strictEqual(hsl.controls[1].cc, 'B');
assert.strictEqual(hsl.controls[2].cc, 'C');
assert.strictEqual(hsl.controls[3].cc, 'D');
console.log('✔ Preset definitions & MIDI bindings (A-D, midix, beatMs(2)) verified');

// Test 2: Target buffer detection with default o0
const codeSimple = 'osc(10, 0.1, 0.8).color(1, 0, 1).out()';
const { targetBuffer: buf1, outStart: start1 } = masterEffectsService.findTargetBufferAndInsertionPoint(codeSimple);
assert.strictEqual(buf1, 'o0', 'Defaults to o0 when no render() is present');
assert.strictEqual(codeSimple.slice(start1, start1 + 6), '.out()', 'Insertion point is right before .out()');
console.log('✔ Default o0 detection verified');

// Test 3: Target buffer detection with render(o1)
const codeMulti = `
osc(20, 0.1).out(o0)
src(o0).diff(shape(4)).out(o1)
render(o1)
`.trim();
const { targetBuffer: buf2, outStart: start2 } = masterEffectsService.findTargetBufferAndInsertionPoint(codeMulti);
assert.strictEqual(buf2, 'o1', 'Detects render(o1) as target buffer');
assert.strictEqual(codeMulti.slice(start2, start2 + 8), '.out(o1)', 'Insertion point targets .out(o1)');
console.log('✔ render(o1) buffer detection verified');

// Test 4: Applying HSL+ effect to code
const applied = masterEffectsService.applyEffectToCode(codeMulti, 'hsl_plus');
assert.ok(applied.includes('/* [master-effects-start:hsl_plus] */'), 'Marker start exists');
assert.ok(applied.includes('/* [master-effects-end] */'), 'Marker end exists');
assert.ok(applied.includes('midix("A"'), 'Contains A midix binding');
assert.ok(applied.includes('midix("D"'), 'Contains D zoom binding');
assert.strictEqual(masterEffectsService.getActiveEffectFromCode(applied), 'hsl_plus');
console.log('✔ HSL+ application verified');

// Test 5: Switching effects replaces cleanly without duplicates
const switched = masterEffectsService.applyEffectToCode(applied, 'psyche_warp');
assert.strictEqual(masterEffectsService.getActiveEffectFromCode(switched), 'psyche_warp');
assert.ok(!switched.includes('hsl_plus'), 'Previous effect replaced');
assert.ok(switched.includes('kaleid'), 'Contains kaleid transform');
assert.strictEqual((switched.match(/\[master-effects-start/g) || []).length, 1, 'Exactly one effect block exists');
console.log('✔ Switching presets verified');

// Test 6: Clean removal restores original code
const removed = masterEffectsService.removeMasterEffectFromCode(switched);
assert.strictEqual(masterEffectsService.getActiveEffectFromCode(removed), null);
assert.strictEqual(removed.trim(), codeMulti.trim(), 'Clean removal restores original code structure');
console.log('✔ Removal/bypass verified');

// Test 7: Resilient fallback with syntax error in code
const brokenCode = 'osc(10, 0.1).color(1, 0, ).out(o0)\nrender(o0)';
const fallbackRes = masterEffectsService.findTargetBufferAndInsertionPoint(brokenCode);
assert.strictEqual(fallbackRes.targetBuffer, 'o0');
assert.ok(fallbackRes.outStart > 0, 'Regex fallback found .out(o0)');
console.log('✔ Syntax error regex fallback verified');

// Test 8: Custom Effect CRUD & Auto-Derived Controls
const custom = masterEffectsService.saveEffect({
  name: 'Test Glow',
  chain: '.brightness(midix("A", { min: -0.5, max: 0.5, default: 0 })).contrast(midix("B", { min: 1, max: 2 }))'
});
assert.ok(custom.id.startsWith('test_glow'), 'ID auto-generated');
assert.strictEqual(custom.controls.length, 2, 'Two controls detected');
assert.strictEqual(custom.controls[0].cc, 'A');
assert.strictEqual(custom.controls[0].label, 'brightness');
assert.strictEqual(custom.controls[1].cc, 'B');
assert.strictEqual(custom.controls[1].label, 'contrast');

const found = masterEffectsService.getEffect(custom.id);
assert.strictEqual(found.name, 'Test Glow');

// Update effect
masterEffectsService.saveEffect({
  ...custom,
  name: 'Test Glow 2',
  chain: '.brightness(midix("A", { min: -1, max: 1 }))'
});
const updated = masterEffectsService.getEffect(custom.id);
assert.strictEqual(updated.name, 'Test Glow 2');
assert.strictEqual(updated.controls.length, 1);

// Delete effect
const deleted = masterEffectsService.deleteEffect(custom.id);
assert.strictEqual(deleted, true);
assert.strictEqual(masterEffectsService.getEffect(custom.id), null);
console.log('✔ Custom Effect CRUD and control auto-detection verified');

console.log('\nAll Master Effects tests PASSED successfully! 🎉');

