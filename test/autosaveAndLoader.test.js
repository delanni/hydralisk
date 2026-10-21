import test from "node:test";
import assert from "node:assert/strict";

// Mock browser globals for testing
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  sessionStorage: new MockStorage(),
  localStorage: new MockStorage(),
  location: { search: "", pathname: "/", host: "localhost", protocol: "http:" },
  history: {
    replaceState: () => {},
  },
};
globalThis.sessionStorage = globalThis.window.sessionStorage;
globalThis.localStorage = globalThis.window.localStorage;
globalThis.document = {
  title: "",
};

// Now import modules
const { MemoryStore } = await import("../modules/automutate.js");
const {
  cleanMetadata,
  formatSketchCode,
  extractSketchMetadata,
  resolveSketchIndex,
  getNextIndex,
  getRandomIndex,
  loadSketch,
} = await import("../modules/sketchLoader.js");

test("MemoryStore: quicksave persists across instances via sessionStorage", () => {
  globalThis.sessionStorage.clear();
  const mem1 = new MemoryStore();
  assert.equal(mem1.quickLoad(), null);

  const sketchCode = "osc(10, 0.1, 0.8).out()";
  mem1.quickSave(sketchCode);
  assert.equal(mem1.quickLoad(), sketchCode);

  // New instance simulates page refresh / reload
  const mem2 = new MemoryStore();
  assert.equal(mem2.quickLoad(), sketchCode);
});

test("MemoryStore: undo history culling every 5th mutation", () => {
  globalThis.sessionStorage.clear();
  const mem = new MemoryStore();
  assert.equal(mem._autosaveCulling, 5);

  mem.resetAutosaves();
  assert.equal(mem.autoSaves.length, 0);

  // 4 mutations should NOT trigger autosave
  mem.autoSave("code_1");
  mem.autoSave("code_2");
  mem.autoSave("code_3");
  mem.autoSave("code_4");
  assert.equal(mem.autoSaves.length, 0);

  // 5th mutation triggers autosave snapshot
  mem.autoSave("code_5");
  assert.equal(mem.autoSaves.length, 1);
  assert.equal(mem.autoSaves[0], "code_5");

  // Force autosave bypasses counter
  mem.autoSave("forced_code", true);
  assert.equal(mem.autoSaves.length, 2);
  assert.equal(mem.autoSaves[1], "forced_code");
});

test("MemoryStore: jumpBack pops history and persists", () => {
  globalThis.sessionStorage.clear();
  const mem = new MemoryStore();
  mem.resetAutosaves();

  mem.autoSave("snapshot_1", true);
  mem.autoSave("snapshot_2", true);
  mem.autoSave("snapshot_3", true);

  assert.equal(mem.autoSaves.length, 3);

  // jumpBack 1
  const popped1 = mem.jumpBack(1);
  assert.equal(popped1, "snapshot_3");
  assert.equal(mem.autoSaves.length, 2);

  // New instance simulates reload
  const memReloaded = new MemoryStore();
  assert.equal(memReloaded.autoSaves.length, 2);
  assert.equal(memReloaded.autoSaves[1], "snapshot_2");

  // jumpBack remaining
  const popped2 = memReloaded.jumpBack(1);
  assert.equal(popped2, "snapshot_2");

  // When down to 1 entry, jumping back returns it and retains it as floor
  const popped3 = memReloaded.jumpBack(1);
  assert.equal(popped3, "snapshot_1");
  assert.equal(memReloaded.autoSaves.length, 1);
  assert.equal(memReloaded.autoSaves[0], "snapshot_1");
});

test("MemoryStore: reduceToPreviousScene reduces undo history to exactly 1 entry on forward navigation", () => {
  globalThis.sessionStorage.clear();
  const mem = new MemoryStore();

  // Simulate scene 1 with 3 mutation snapshots
  mem.autoSave("scene_1_base", true);
  mem.autoSave("scene_1_mut_5", true);
  mem.autoSave("scene_1_mut_10", true);
  assert.equal(mem.autoSaves.length, 3);

  // Navigating forward to scene 2: reduce to previous scene
  mem.reduceToPreviousScene("scene_1_current_state");
  assert.equal(mem.autoSaves.length, 1);
  assert.equal(mem.autoSaves[0], "scene_1_current_state");

  // Scene 2 is loaded, user immediately triggers jumpBack (wants previous scene)
  const jumpBackResult = mem.jumpBack(1);
  assert.equal(jumpBackResult, "scene_1_current_state");
});

test("sketchLoader: cleanMetadata does not mutate source object and strips internal keys", () => {
  const sourceMeta = {
    bpm: 140,
    date: "2026-10-01",
    local: true,
    index: 3,
    type: "live",
    tags: ["acid", "techno"],
    customParam: 42,
  };

  const cleaned = cleanMetadata(sourceMeta);

  // Source object is untouched
  assert.equal(sourceMeta.bpm, 140);
  assert.equal(sourceMeta.local, true);
  assert.equal(sourceMeta.index, 3);

  // Cleaned copy omits internal keys
  assert.equal(cleaned.bpm, undefined);
  assert.equal(cleaned.date, undefined);
  assert.equal(cleaned.local, undefined);
  assert.equal(cleaned.index, undefined);
  assert.equal(cleaned.type, undefined);
  assert.deepEqual(cleaned.tags, ["acid", "techno"]);
  assert.equal(cleaned.customParam, 42);
});

test("sketchLoader: formatSketchCode handles preambles and metadata cleanly", () => {
  const sketchWithoutMeta = {
    name: "Cosmic Bloom",
    code: "noise(10).out()",
  };
  const formatted = formatSketchCode(sketchWithoutMeta);
  assert.equal(formatted, "/* Cosmic Bloom */\nnoise(10).out()");

  const sketchWithMeta = {
    name: "Acid Bassline",
    code: "osc(40).out()",
    metadata: { author: "Alex", bpm: 130 },
  };
  const formattedWithMeta = formatSketchCode(sketchWithMeta);
  assert.match(formattedWithMeta, /^\/\* Acid Bassline \*\/\nosc\(40\)\.out\(\)\n\/\* metadata = \{"author":"Alex"\} \*\//);
  // Source metadata author kept, bpm stripped in output
  assert.equal(sketchWithMeta.metadata.bpm, 130);
});

test("sketchLoader: resolveSketchIndex and navigation wrapping", () => {
  const list = [
    { name: "Alpha", code: "osc().out()" },
    { name: "Beta", code: "shape().out()" },
    { name: "Gamma", code: "noise().out()" },
  ];

  // Index resolution
  assert.equal(resolveSketchIndex(0, list).index, 0);
  assert.equal(resolveSketchIndex("beta", list).index, 1);
  assert.equal(resolveSketchIndex("GAMMA", list).index, 2);
  assert.equal(resolveSketchIndex(list[0], list).index, 0);

  // getNextIndex forward and backward wrapping
  assert.equal(getNextIndex(0, 3, false), 1);
  assert.equal(getNextIndex(2, 3, false), 0);
  assert.equal(getNextIndex(0, 3, true), 2);
  assert.equal(getNextIndex(1, 3, true), 0);

  // getRandomIndex produces valid bounds
  for (let i = 0; i < 20; i++) {
    const rnd = getRandomIndex(1, 3);
    assert.ok(rnd >= 0 && rnd < 3);
    // When total > 1, random avoids immediately picking current
    assert.notEqual(rnd, 1);
  }
});

test("sketchLoader: loadSketch executes canonical load sequence and integrates with memory", () => {
  let evaluatedCode = "";
  let editorValue = "previous_sketch_code()";
  let titleSet = "";

  const mockApp = {
    mySketches: [
      { name: "Sketch One", code: "osc(20).out()", bpm: 125 },
      { name: "Sketch Two", code: "shape(4).out()" },
    ],
    sketchIdx: 0,
    state: {
      editor: {
        editor: {
          getValue: () => editorValue,
          setValue: (val) => {
            editorValue = val;
          },
          eval: (code) => {
            evaluatedCode = code;
          },
        },
      },
    },
    memory: new MemoryStore(),
    emitter: {
      emit: () => {},
    },
    emit: (event, payload) => {
      mockApp.lastEvent = { event, payload };
    },
    expose: (key, val) => {
      mockApp[key] = val;
    },
  };

  mockApp.memory.resetAutosaves();

  // Load Sketch Two
  const result = loadSketch(mockApp, "Sketch Two");
  assert.ok(result);
  assert.equal(result.index, 1);
  assert.equal(mockApp.sketchIdx, 1);
  assert.match(evaluatedCode, /shape\(4\)\.out\(\)/);

  // Verify memory reduced to previous sketch code and added new sketch
  assert.equal(mockApp.memory.autoSaves.length, 2);
  assert.equal(mockApp.memory.autoSaves[0], "previous_sketch_code()");

  // JumpBack returns the previous sketch!
  const restored = mockApp.memory.jumpBack(1);
  assert.equal(restored, result.formattedCode);
  const previousScene = mockApp.memory.jumpBack(1);
  assert.equal(previousScene, "previous_sketch_code()");
});

test("sketchLoader: cleanMetadata validates and clamps quality to 1-5", () => {
  assert.equal(cleanMetadata({ quality: 5 }).quality, 5);
  assert.equal(cleanMetadata({ quality: "4" }).quality, 4);
  assert.equal(cleanMetadata({ quality: 3.2 }).quality, 3);
  assert.equal(cleanMetadata({ quality: 1 }).quality, 1);

  // Out of bounds / invalid quality values should be omitted
  assert.equal(cleanMetadata({ quality: 0 }).quality, undefined);
  assert.equal(cleanMetadata({ quality: 6 }).quality, undefined);
  assert.equal(cleanMetadata({ quality: -1 }).quality, undefined);
  assert.equal(cleanMetadata({ quality: "good" }).quality, undefined);
  assert.equal(cleanMetadata({ quality: null }).quality, undefined);
});

test("sketchFilterService: filterAndRankSketches minQuality filtering", async () => {
  const { filterAndRankSketches } = await import("../modules/sketchManager/sketchFilterService.js");

  const sketches = [
    { name: "Sketch Low", code: "osc().out()", metadata: { quality: 1 } },
    { name: "Sketch Mid", code: "shape().out()", metadata: { quality: 3 } },
    { name: "Sketch High", code: "noise().out()", metadata: { quality: 5 } },
    { name: "Sketch TopLevelQuality", code: "voronoi().out()", quality: 4 },
    { name: "Sketch Unrated", code: "solid().out()", metadata: {} },
  ];

  // minQuality = 0 (all sketches returned)
  const all = filterAndRankSketches(sketches, "", [], "all", 0);
  assert.equal(all.length, 5);

  // minQuality = 3 (returns sketches with quality >= 3: Mid, High, TopLevelQuality)
  const min3 = filterAndRankSketches(sketches, "", [], "all", 3);
  assert.equal(min3.length, 3);
  assert.deepEqual(min3.map((s) => s.name), ["Sketch Mid", "Sketch High", "Sketch TopLevelQuality"]);

  // minQuality = 5 (returns only Sketch High)
  const min5 = filterAndRankSketches(sketches, "", [], "all", 5);
  assert.equal(min5.length, 1);
  assert.equal(min5[0].name, "Sketch High");
});

test("SketchStorage: new sketches are prepended to the collection (index 0)", async () => {
  const { default: SketchStorage } = await import("../modules/sketchManager/sketchstorage.js");

  globalThis.localStorage.clear();
  const storage = new SketchStorage(globalThis.localStorage, "testSketches");

  storage.saveSketch({ name: "Existing Sketch 1", code: "osc().out()" });
  storage.saveSketch({ name: "Existing Sketch 2", code: "shape().out()" });

  let list = storage.getSketches();
  assert.equal(list.length, 2);
  // Existing Sketch 2 was prepended before Existing Sketch 1
  assert.equal(list[0].name, "Existing Sketch 2");
  assert.equal(list[1].name, "Existing Sketch 1");

  // Save brand new sketch
  storage.saveSketch({ name: "Brand New Sketch", code: "noise().out()", metadata: { quality: 5 } });
  list = storage.getSketches();
  assert.equal(list.length, 3);
  // Verify it is prepended at index 0
  assert.equal(list[0].name, "Brand New Sketch");
  assert.equal(list[0].metadata.quality, 5);

  // Updating existing sketch updates in-place without prepending
  storage.saveSketch({ name: "Existing Sketch 1", code: "osc(100).out()" });
  list = storage.getSketches();
  assert.equal(list.length, 3);
  assert.equal(list[0].name, "Brand New Sketch");
  assert.equal(list[2].name, "Existing Sketch 1");
  assert.equal(list[2].code, "osc(100).out()");
});

test("CollectionStorage: addSketchToCollection prepends to sketchIds", async () => {
  const { default: CollectionStorage } = await import("../modules/sketchManager/collectionStorage.js");

  globalThis.localStorage.clear();
  const storage = new CollectionStorage(globalThis.localStorage, "testCollections");

  const col = storage.createCollection("Live Set");
  storage.addSketchToCollection(col.id, "sketch-A");
  storage.addSketchToCollection(col.id, "sketch-B");

  const updatedCol = storage.getCollections().collections.find((c) => c.id === col.id);
  // sketch-B was added second, so it should be prepended before sketch-A
  assert.deepEqual(updatedCol.sketchIds, ["sketch-B", "sketch-A"]);
});

test("Mutator: mutate measures calculation duration and emits mutation:done", async () => {
  const { Mutator } = await import("../modules/automutate.js");
  let currentCode = "osc(20, 0.1, 0.8).out()";
  let emittedDone = null;

  const mockEditor = {
    getValue: () => currentCode,
    setValue: (val) => {
      currentCode = val;
    },
    emitter: {
      emit: (evt, payload) => {
        if (evt === "mutation:done") emittedDone = payload;
      },
    },
  };

  const mutator = new Mutator(mockEditor);
  const res = mutator.mutate({ reroll: false, changeTransform: false });

  assert.ok(res);
  assert.equal(typeof res.duration, "number");
  assert.ok(res.duration >= 0);
  assert.ok(emittedDone);
  assert.equal(typeof emittedDone.duration, "number");
});

test("OblivionGuard: is completely disabled and returns null without scheduling checks", async () => {
  const { OblivionGuard } = await import("../modules/oblivionGuard.js");
  const guard = new OblivionGuard({});

  assert.equal(guard.enabled, false);
  assert.equal(guard.inspectCanvas(), null);
  guard.scheduleCheck(100);
  assert.equal(guard.checkTimeout, null);
  guard.performCheck();
  assert.equal(guard.consecutiveReverts, 0);
});
