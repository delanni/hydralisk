import assert from 'node:assert';
import { masterEffectsService, MASTER_EFFECTS } from '../modules/masterEffects/masterEffectsService.js';

console.log('Testing Master Effects Service & AST Transformation...');

// Test 1: Preset definitions and MIDI bindings
assert.strictEqual(MASTER_EFFECTS.length >= 4, true, 'At least 4 presets exist');
const hsl = MASTER_EFFECTS.find(e => e.id === 'hsl_plus');
assert.ok(hsl, 'HSL+ preset exists');
assert.strictEqual(hsl.controls.length, 4, 'HSL+ has 4 controls: b1, b2, b3, b4');
assert.strictEqual(hsl.controls[0].cc, 'b1');
assert.strictEqual(hsl.controls[1].cc, 'b2');
assert.strictEqual(hsl.controls[2].cc, 'b3');
assert.strictEqual(hsl.controls[3].cc, 'b4');
console.log('✔ Preset definitions & MIDI bindings verified');

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
assert.ok(applied.includes('midi("b1"'), 'Contains b1 midi binding');
assert.ok(applied.includes('midi("b4"'), 'Contains b4 zoom binding');
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

console.log('\nAll Master Effects tests PASSED successfully! 🎉');
