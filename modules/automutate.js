/**
 * Automutate & Mutator Plugin for Hydralisk
 * Encapsulates the AST-based code mutator ("poop mode"), AST parser/generator,
 * GLSL transform swap definitions, autosaves stack, jump-back, and quick save/load.
 */

import { Parser } from "acorn";
import { generate } from "astring";
import { defaultTraveler, makeTraveler } from "astravel";
import jsBeautify from "js-beautify";
const js_beautify = jsBeautify.js_beautify || jsBeautify;

export const GLSL_TRANSFORMS = {
  src: ["noise", "voronoi", "osc", "shape", "gradient", "src", "solid"],
  coord: [
    "rotate",
    "scale",
    "pixelate",
    "repeat",
    "repeatX",
    "repeatY",
    "modulateRepeat",
    "modulateRepeatX",
    "modulateRepeatY",
    "modulateRotate",
    "modulateScale",
    "modulatePixelate",
    "kaleid",
    "scroll",
    "scrollX",
    "scrollY",
    "modulateScrollX",
    "modulateScrollY",
    "modulate",
  ],
  color: [
    "posterize",
    "shift",
    "invert",
    "contrast",
    "brightness",
    "color",
    "luma",
    "thresh",
    "colorama",
    "saturate",
    "hue",
  ],
  combine: ["add", "sub", "layer", "blend", "mult", "diff", "modulateHue"],
  combineCoord: [
    "modulate",
    "modulateRepeat",
    "modulateRepeatX",
    "modulateRepeatY",
    "modulateRotate",
    "modulateScale",
    "modulatePixelate",
    "modulateScrollX",
    "modulateScrollY",
  ],
};

const BLACKLIST_COMBOS = [{ orig: "modulate", new: "modulateScrollX" }];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class UndoStack {
  constructor() {
    this.stack = [];
  }
  push(item) {
    this.stack.push(item);
  }
  pop() {
    return this.stack.pop();
  }
  get length() {
    return this.stack.length;
  }
}

export class Mutator {
  constructor(editor) {
    this.editor = editor;
    this.undoStack = new UndoStack();
    this.initialVector = null;

    this.traveler = makeTraveler({
      CallExpression(node, state) {
        if (node.callee.type === "MemberExpression") {
          const name = node.callee.property.name;
          if (name !== "out") {
            state.calls.push(node);
          }
        }
        this.super.CallExpression.call(this, node, state);
      },
      Literal(node, state) {
        if (typeof node.value === "number") {
          state.literals.push(node);
        }
      },
    });
  }

  doUndo() {
    if (this.undoStack.length > 0) {
      const prev = this.undoStack.pop();
      if (prev && this.editor) {
        this.editor.setValue(prev);
        if (typeof this.editor.eval === "function") {
          this.editor.eval(prev);
        } else if (window.evalCode) {
          window.evalCode(prev);
        }
      }
    }
  }

  glitchNumber(origVal, initVal) {
    const base = typeof initVal === "number" ? initVal : origVal;
    if (base === 0) {
      return Math.random() < 0.5 ? 0.5 : 0.01;
    }
    return Math.random() * base * 2;
  }

  mutate({ reroll = false, changeTransform = false } = {}) {
    if (!this.editor) return;
    const code = typeof this.editor.getValue === "function" ? this.editor.getValue() : "";
    if (!code) return;

    let ast;
    const comments = [];
    try {
      ast = Parser.parse(code, {
        ecmaVersion: "latest",
        sourceType: "module",
        onComment: comments,
      });
    } catch (e) {
      console.warn("[Mutator] AST parse error:", e);
      return;
    }

    const state = { literals: [], calls: [] };
    this.traveler.go(ast, state);

    if (state.literals.length === 0 && state.calls.length === 0) {
      return;
    }

    if (!this.initialVector || this.initialVector.length !== state.literals.length) {
      this.initialVector = state.literals.map((l) => l.value);
    }

    this.undoStack.push(code);

    if (changeTransform && state.calls.length > 0) {
      let callNode = getRandomElement(state.calls);
      let currentFunc = callNode.callee.property.name;
      let category = Object.keys(GLSL_TRANSFORMS).find((cat) =>
        GLSL_TRANSFORMS[cat].includes(currentFunc)
      );

      if (category && GLSL_TRANSFORMS[category]) {
        let candidates = GLSL_TRANSFORMS[category].filter((f) => f !== currentFunc);
        if (candidates.length > 0) {
          let newFunc = getRandomElement(candidates);
          let isBlacklisted = BLACKLIST_COMBOS.some(
            (b) => b.orig === currentFunc && b.new === newFunc
          );
          if (!isBlacklisted) {
            callNode.callee.property.name = newFunc;
          }
        }
      }
    } else if (state.literals.length > 0) {
      let idx = getRandomInt(0, state.literals.length);
      let targetNode = state.literals[idx];
      let initVal = this.initialVector[idx];
      targetNode.value = this.glitchNumber(targetNode.value, initVal);
      targetNode.raw = String(targetNode.value);
    }

    const newCode = generate(ast, { comments: true });
    this.editor.setValue(newCode);

    if (typeof this.editor.formatCode === "function") {
      this.editor.formatCode();
    } else if (window.xemitter) {
      window.xemitter.emit("editor:formatCode");
    }
  }
}

export class MemoryStore {
  constructor() {
    this.saveSlot = null;
    this.autoSaves = [];
    this._autosaveCulling = 8;
    this._autosaveIndex = 0;
  }

  quickSave(code) {
    this.saveSlot = code;
  }

  quickLoad() {
    return this.saveSlot;
  }

  autoSave(code, force = false) {
    this._autosaveIndex += 1;
    if (this._autosaveIndex >= this._autosaveCulling || force) {
      this._autosaveIndex = 0;
      this.autoSaves.push(code);
    }
  }

  jumpBack(idx = 1) {
    let code;
    while (idx-- > 0 && this.autoSaves.length > 0) {
      code = this.autoSaves.pop();
    }
    if (this.autoSaves.length === 0 && code) {
      this.autoSaves = [code];
    }
    return code;
  }

  resetAutosaves() {
    this.autoSaves = [];
    this._autosaveIndex = 0;
  }
}

export const memory = new MemoryStore();

if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "automutate",
    name: "Automutate & Mutator Engine",

    init(app) {
      app.automutateInterval = null;
      app.memory = memory;
      app.expose("memory", memory);

      const setAutomutateState = (interval, multiplier = null, changeTransformChance = 1) => {
        app.automutateInterval = interval;
        app.automutateBeatMultiplier = multiplier;
        app.automutateChangeTransformChance = changeTransformChance;
        if (app.state) app.state.automutateInterval = interval;
        if (window.state) window.state.automutateInterval = interval;
        app.emit("render");
      };

      const getEditor = () => {
        return (app.state && app.state.editor && app.state.editor.editor) || window.cm || null;
      };

      const evalAndSave = (code, cb) => {
        const editor = getEditor();
        if (editor && typeof editor.setValue === "function") {
          editor.setValue(code);
        }
        if (window.evalCode) {
          window.evalCode(code, cb);
        } else if (editor && typeof editor.eval === "function") {
          editor.eval(code, cb);
        }
        if (app.emitter) app.emitter.emit("render");
      };

      const retimeAutomutate = (newBpm) => {
        if (!app.automutateInterval || !app.automutateBeatMultiplier) return;
        const currentBpm = Number(newBpm) || app.bpm || window.bpm || 120;
        const mutateTimeout = (60000 / currentBpm) * app.automutateBeatMultiplier;

        clearInterval(app.automutateInterval);

        const newInterval = setInterval(() => {
          const ed = getEditor();
          if (!ed) return;
          if (!ed.mutator) ed.mutator = new Mutator(ed);
          const changeTransform = Math.random() > (app.automutateChangeTransformChance ?? 1);
          ed.mutator.mutate({ reroll: false, changeTransform });
          if (app.emitter) {
            app.emitter.emit("editor:formatCode");
            app.emitter.emit("oblivion:scheduleCheck", { delay: 250 });
          }
          memory.autoSave(ed.getValue());
        }, mutateTimeout);

        setAutomutateState(newInterval, app.automutateBeatMultiplier, app.automutateChangeTransformChance);
      };

      app.on("bpm:change", (newBpm) => retimeAutomutate(newBpm));
      app.on("taptempo", (evt = {}) => {
        const bpm = evt && typeof evt.bpm === "number" ? evt.bpm : app.bpm || window.bpm;
        if (bpm) retimeAutomutate(bpm);
      });

      app.on("editor:randomize", (evt = {}) => {
        const editor = getEditor();
        if (!editor) return;
        if (!editor.mutator) {
          editor.mutator = new Mutator(editor);
        }

        if (evt.shiftKey) {
          editor.mutator.doUndo();
        } else {
          editor.mutator.mutate({
            reroll: false,
            changeTransform: Boolean(evt.metaKey),
          });
          if (app.emitter) {
            app.emitter.emit("editor:formatCode");
            app.emitter.emit("gallery:saveLocally", editor.getValue());
          }
        }
      });

      app.on("editor:midify", (evt = {}) => {
        app.emit("editor:randomize", evt);
      });

      app.on("editor:toggleAutomutate", async (evt = {}) => {
        const bpm = app.bpm || window.bpm || 120;
        const guessedMsPerBeat = 60000 / bpm;
        const lastCombo = evt.lastCombo || "";
        const automutateMode = lastCombo.match(/-(.)$/)?.[1];

        let mutateTimeout = guessedMsPerBeat;
        let beatMultiplier = null;

        if (automutateMode === "X" || !automutateMode) {
          if (app.automutateInterval) {
            clearInterval(app.automutateInterval);
            setAutomutateState(null);
            return;
          } else {
            let promptVal = guessedMsPerBeat;
            if (window.hydraDialog && window.hydraDialog.prompt) {
              promptVal = await window.hydraDialog.prompt("How fast would you like to go? (in ms)", guessedMsPerBeat);
            } else if (typeof window.prompt === "function") {
              promptVal = window.prompt("How fast would you like to go? (in ms)", guessedMsPerBeat);
            }
            mutateTimeout = Number(promptVal) || guessedMsPerBeat;
          }
        } else if (automutateMode === "0") {
          if (app.automutateInterval) {
            clearInterval(app.automutateInterval);
          }
          setAutomutateState(null);
          return;
        } else if (automutateMode === "1") {
          beatMultiplier = 1;
          mutateTimeout = guessedMsPerBeat;
        } else if (automutateMode === "2") {
          beatMultiplier = 2;
          mutateTimeout = guessedMsPerBeat * 2;
        } else if (automutateMode === "3") {
          beatMultiplier = 4;
          mutateTimeout = guessedMsPerBeat * 4;
        } else if (automutateMode === "4") {
          beatMultiplier = 8;
          mutateTimeout = guessedMsPerBeat * 8;
        } else if (automutateMode === "5") {
          beatMultiplier = 16;
          mutateTimeout = guessedMsPerBeat * 16;
        }

        const editor = getEditor();
        if (editor && !editor.mutator) {
          editor.mutator = new Mutator(editor);
        }

        const changeTransformChance = 1 - (evt.metaKey ? 0.25 : 0);

        if (app.automutateInterval) {
          clearInterval(app.automutateInterval);
        }

        const newInterval = setInterval(() => {
          const ed = getEditor();
          if (!ed) return;
          if (!ed.mutator) ed.mutator = new Mutator(ed);
          const changeTransform = Math.random() > changeTransformChance;
          ed.mutator.mutate({ reroll: false, changeTransform });
          if (app.emitter) {
            app.emitter.emit("editor:formatCode");
            app.emitter.emit("oblivion:scheduleCheck", { delay: 250 });
          }
          memory.autoSave(ed.getValue());
        }, mutateTimeout);

        setAutomutateState(newInterval, beatMultiplier, changeTransformChance);

        if (editor) {
          memory.autoSave(editor.getValue(), true);
        }
      });

      app.on("editor:quickSave", () => {
        const editor = getEditor();
        if (editor) {
          const code = editor.getValue();
          evalAndSave(code);
          memory.quickSave(code);
        }
      });

      app.on("editor:quickLoad", () => {
        const code = memory.quickLoad();
        if (code) {
          evalAndSave(code);
        }
      });

      app.on("editor:jumpBack1", () => {
        const code = memory.jumpBack(1);
        if (code) evalAndSave(code);
      });

      app.on("editor:jumpBack5", () => {
        const code = memory.jumpBack(5);
        if (code) evalAndSave(code);
      });
    },
  });
}
