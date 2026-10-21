import assert from 'assert';
import { MidiMappingService, DEFAULT_MAPPABLE_ACTIONS } from '../modules/midiMapping/midiMappingService.js';

// Setup mock window & localStorage environment for tests
const storageMock = {};
global.localStorage = {
  getItem: (key) => storageMock[key] || null,
  setItem: (key, val) => { storageMock[key] = String(val); },
  removeItem: (key) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

const emittedEvents = [];
global.window = {
  xemitter: {
    emit: (event, payload) => {
      emittedEvents.push({ event, payload });
    }
  },
  mutationJump: null,
  cc: {},
  speed: 1,
};

console.log("Testing MIDI Mapping Service & React Store...");

const service = new MidiMappingService();

// Test 1: Initialization & Defaults
assert.strictEqual(service.isOpen, false, "Initial isOpen should be false");
assert.strictEqual(service.waitingForAction, null, "Initial waitingForAction should be null");
assert(service.mappableActions["mutationJump:trigger"], "mutationJump:trigger action should exist");
assert(service.mappableActions["mutationJump:cc"], "mutationJump:cc action should exist");
assert(service.mappableActions["speed"], "speed action should exist");
console.log("✔ Initial state & default actions verified");

// Test 2: Subscriptions & Open/Close/Toggle
let subscriberNotified = 0;
let lastState = null;
const unsubscribe = service.subscribe((state) => {
  subscriberNotified++;
  lastState = state;
});

assert.strictEqual(subscriberNotified, 1, "Subscriber should receive initial state");
assert.strictEqual(lastState.isOpen, false, "Subscriber initial isOpen is false");

service.open();
assert.strictEqual(service.isOpen, true, "service.isOpen should be true");
assert.strictEqual(lastState.isOpen, true, "Subscriber received isOpen = true");

service.toggle();
assert.strictEqual(service.isOpen, false, "service.isOpen should be false after toggle");
assert.strictEqual(lastState.isOpen, false, "Subscriber received isOpen = false after toggle");

service.open();
assert.strictEqual(service.isOpen, true, "service.isOpen reopened");
console.log("✔ Reactive subscriptions & modal open/close verified");

// Test 3: MIDI Assignment Mode (Learning Mode)
service.startAssign("mutationJump:trigger");
assert.strictEqual(service.waitingForAction, "mutationJump:trigger", "waitingForAction should be set");
assert.strictEqual(lastState.waitingForAction, "mutationJump:trigger", "Subscriber notified of waiting state");

// Simulate MIDI Note-On message: Channel 0 (0x90), Note 60 (Middle C), Velocity 100
const noteOnMsg = { data: new Uint8Array([0x90, 60, 100]) };
service.handleMIDIMessage(noteOnMsg);

// Should have assigned Note 60 to mutationJump:trigger and exited waiting mode
assert.strictEqual(service.waitingForAction, null, "waitingForAction should clear after assignment");
assert.deepStrictEqual(service.mapping["mutationJump:trigger"], {
  type: "note",
  channel: 0,
  note: 60
}, "Note mapping should be recorded in service.mapping");
assert.strictEqual(lastState.mapping["mutationJump:trigger"].note, 60, "Subscriber state contains updated mapping");
console.log("✔ MIDI Note assignment verified");

// Test 4: CC Assignment Mode
service.startAssign("speed");
assert.strictEqual(service.waitingForAction, "speed", "waitingForAction should be speed");

// Simulate MIDI CC message: Channel 2 (0xb2), Control 14, Value 64
const ccMsg = { data: new Uint8Array([0xb2, 14, 64]) };
service.handleMIDIMessage(ccMsg);

assert.strictEqual(service.waitingForAction, null, "waitingForAction should clear after CC assignment");
assert.deepStrictEqual(service.mapping["speed"], {
  type: "cc",
  channel: 2,
  control: 14
}, "CC mapping should be recorded in service.mapping");
console.log("✔ MIDI CC assignment verified");

// Test 5: Active Trigger & Dispatch
emittedEvents.length = 0;
// Send Note-On 60 again (now mapped to mutationJump:trigger)
service.handleMIDIMessage({ data: new Uint8Array([0x90, 60, 127]) });
assert.strictEqual(emittedEvents.length, 1, "xemitter should have received 1 event");
assert.strictEqual(emittedEvents[0].event, "mutationJump:trigger", "Correct action emitted on Note-On");

// Send CC 14 on Channel 2 (mapped to speed)
let testSpeedValue = null;
window.speed = 0;
service.handleMIDIMessage({ data: new Uint8Array([0xb2, 14, 127]) }); // max CC
assert(window.speed > 1, "Speed CC callback should have modified window.speed");
console.log("✔ Real-time MIDI dispatch to assigned action & callback verified");

// Test 6: Toggle Assign Cancel & Clear Mapping
service.startAssign("gallery:nextSketch");
assert.strictEqual(service.waitingForAction, "gallery:nextSketch");
// Calling startAssign on the same action again should cancel learning mode without side-effects
service.startAssign("gallery:nextSketch");
assert.strictEqual(service.waitingForAction, null, "Calling startAssign again cancels waiting mode");

// Clear mapping for speed
service.clearMapping("speed");
assert.strictEqual(service.mapping["speed"], undefined, "Mapping for speed should be removed");
assert.strictEqual(lastState.mapping["speed"], undefined, "Subscriber reflects cleared mapping");
console.log("✔ Assign cancellation & clearing verified");

// Test 7: Persistence in localStorage
const reloadedService = new MidiMappingService();
assert.deepStrictEqual(reloadedService.mapping["mutationJump:trigger"], {
  type: "note",
  channel: 0,
  note: 60
}, "Persisted mapping should reload accurately from localStorage");
console.log("✔ LocalStorage persistence verified");

unsubscribe();
console.log("\nAll MIDI Mapping tests PASSED successfully! 🎹⚡🎉\n");
