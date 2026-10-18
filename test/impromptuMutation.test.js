/**
 * Test Suite for Impromptu Mutator Service
 * Run with: node test/impromptuMutation.test.js
 */

import assert from 'assert';
import { ImpromptuMutatorService } from '../modules/impromptuMutation/impromptuMutatorService.js';

console.log('Testing Impromptu Mutator Service...');

class MockEditor {
  constructor(initialCode = '') {
    this.code = initialCode;
    this.evalHistory = [];
  }
  getValue() {
    return this.code;
  }
  setValue(val) {
    this.code = val;
  }
  eval(val) {
    this.evalHistory.push(val);
  }
}

const initialSketch = 'osc(60, 0.1, 1.5).diff(o0).rotate(0.5).out(o0);';
const editor = new MockEditor(initialSketch);
const service = new ImpromptuMutatorService({ editor, initialCode: initialSketch });

// Test 1: Defaults and Pre-calculation
assert.strictEqual(service.currentCC, 0, 'Initial CC should be 0');
assert.strictEqual(service.mutationCount, 0, 'Initial count should be 0');
assert.strictEqual(service.precalculatedStates.length, 11, 'Should pre-calculate 11 states (0 through 10)');
assert.strictEqual(service.precalculatedStates[0], initialSketch, 'State 0 should equal base sketch code');
console.log('✔ Initialization & 10-step chain pre-calculation verified');

// Test 2: CC Dial Mapping
service.setCC(0.4);
assert.strictEqual(service.mutationCount, 4, 'CC 0.4 should map to 4 mutations');
assert.strictEqual(service.getToBeState(), service.precalculatedStates[4], 'To-be state should match precalculatedStates[4]');
assert.strictEqual(editor.getValue(), initialSketch, 'Editor code must NOT change while only dialling CC');
console.log('✔ CC dial mapping & non-destructive pre-calculated to-be state verified');

// Test 3: Trigger Press Burst Execution
const toBe4 = service.precalculatedStates[4];
const resultBurst = service.trigger();
assert.strictEqual(resultBurst.action, 'burst', 'Trigger with count 4 should execute burst');
assert.strictEqual(resultBurst.count, 4, 'Burst count should be 4');
assert.strictEqual(editor.getValue(), toBe4, 'Editor should be swapped directly to state 4');
assert.strictEqual(service.preMutationState, initialSketch, 'preMutationState should preserve original sketch');
assert.strictEqual(service.baseCode, toBe4, 'Base code should update to new sketch');
assert.strictEqual(service.precalculatedStates[0], toBe4, 'New precalculatedStates[0] should be new base code');
assert.strictEqual(service.precalculatedStates.length, 11, 'Next 10 mutations should be immediately pre-calculated');
console.log('✔ Instant press burst swap & pre-mutation snapshot verified');

// Test 4: Consecutive Bursts
service.setCC(0.7); // 7 mutations
const toBe7 = service.precalculatedStates[7];
const resultBurst2 = service.trigger();
assert.strictEqual(resultBurst2.action, 'burst');
assert.strictEqual(resultBurst2.count, 7);
assert.strictEqual(editor.getValue(), toBe7);
assert.strictEqual(service.preMutationState, toBe4, 'preMutationState should update to previous burst base');
console.log('✔ Consecutive bursts verified');

// Test 5: CC ~= 0 Press Event (Undo)
service.setCC(0);
assert.strictEqual(service.mutationCount, 0, 'CC 0 should map to count 0');
assert.strictEqual(service.getStateInfo().isUndoMode, true, 'CC 0 should set isUndoMode true');

const resultUndo = service.trigger();
assert.strictEqual(resultUndo.action, 'undo', 'Trigger with CC 0 should execute undo');
assert.strictEqual(editor.getValue(), toBe4, 'Editor should restore preMutationState');
assert.strictEqual(service.baseCode, toBe4, 'Base code should restore to pre-mutation state');
console.log('✔ CC~=0 press event fires undo retrieving pre-mutation state');

// Test 6: Master Effects comment block preservation
const sketchWithMasterEffect = 'osc(40, 0.2)/* [master-effects-start:hsl_plus] */.color(1, 1, 1).hue(() => b1(0))/* [master-effects-end] */.out(o0);';
const singleMutation = service.mutateCode(sketchWithMasterEffect);
assert.ok(singleMutation.includes('/* [master-effects-start:hsl_plus] */'), 'Must preserve master-effects start marker');
assert.ok(singleMutation.includes('/* [master-effects-end] */'), 'Must preserve master-effects end marker');
assert.ok(singleMutation.includes('() => b1(0)'), 'Must preserve MIDI binding arrow function inside master effects');
console.log('✔ Master effects block preservation verified');

console.log('\nAll Impromptu Mutator tests PASSED successfully! ⚡🎉\n');
