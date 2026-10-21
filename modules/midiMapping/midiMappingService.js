/**
 * MIDI Mapping Service
 * Handles state, Web MIDI hardware access, mapping persistence, and action triggers.
 */

const STORAGE_KEY = "hydra-midi-mapping";
const CC_TRIGGER_THRESHOLD = 0.5;
const WAITING_TIMEOUT_MS = 15000;

export const DEFAULT_MAPPABLE_ACTIONS = {
  "gallery:nextSketch": {
    action: "gallery:nextSketch",
    label: "Next sketch",
  },
  "gallery:prevSketch": {
    action: "gallery:nextSketch",
    payload: { backwards: true },
    label: "Prev sketch",
  },
  "gallery:randomSketch": {
    action: "gallery:randomSketch",
    label: "Random Sketch",
  },
  "editor:randomize": {
    action: "editor:randomize",
    label: "Randomize",
  },
  "editor:jumpBack1": {
    action: "editor:jumpBack1",
    label: "Jump back 1",
  },
  "editor:jumpBack5": {
    action: "editor:jumpBack5",
    label: "Jump back 5",
  },
  "gfx:speedReverse": {
    action: "gfx:speedReverse",
    label: "Speed reverse",
  },
  "editor:quickSave": {
    action: "editor:quickSave",
    label: "Quick save",
  },
  "editor:quickLoad": {
    action: "editor:quickLoad",
    label: "Quick load",
  },
  "editor:toggleAutomutate|off": {
    action: "editor:toggleAutomutate",
    payload: { lastCombo: "Shift-Ctrl-0" },
    label: "Automutate off",
  },
  "editor:toggleAutomutate|1x": {
    action: "editor:toggleAutomutate",
    payload: { lastCombo: "Shift-Ctrl-1" },
    label: "Automutate 1x",
  },
  "editor:toggleAutomutate|2x": {
    action: "editor:toggleAutomutate",
    payload: { lastCombo: "Shift-Ctrl-2" },
    label: "Automutate 2x",
  },
  "editor:toggleAutomutate|4x": {
    action: "editor:toggleAutomutate",
    payload: { lastCombo: "Shift-Ctrl-3" },
    label: "Automutate 4x",
  },
  "editor:toggleAutomutate|8x": {
    action: "editor:toggleAutomutate",
    payload: { lastCombo: "Shift-Ctrl-4" },
    label: "Automutate 8x",
  },
  "editor:toggleAutomutate|16x": {
    action: "editor:toggleAutomutate",
    payload: { lastCombo: "Shift-Ctrl-5" },
    label: "Automutate 16x",
  },
  "taptempo": {
    action: "taptempo",
    label: "Tap tempo",
  },
  "fullscreen": {
    action: "fullscreen",
    label: "Toggle Fullscreen",
  },
  "hideAll": {
    action: "hideAll",
    label: "Hide/Show UI",
  },
  "mutationJump:trigger": {
    action: "mutationJump:trigger",
    label: "Mutation Jump Trigger (Press)",
  },
  "mutationJump:cc": {
    callback: (value) => {
      if (window.mutationJump && typeof window.mutationJump.setCC === "function") {
        window.mutationJump.setCC(value);
      } else if (window.impromptuMutator && typeof window.impromptuMutator.setCC === "function") {
        window.impromptuMutator.setCC(value);
      } else if (window.xemitter) {
        window.xemitter.emit("mutationJump:setCC", value);
      }
    },
    label: "Mutation Jump (CC Dial: 0-10)",
  },
  "speed": {
    callback: (value) => {
      const speed = Math.pow(2, value * 2) - 1;
      if (typeof window !== "undefined" && window.speed !== undefined) {
        window.speed = speed;
      }
    },
    label: "Speed (CC bind)",
  },
  ...(["A", "B", "C", "D"].map((midiShortcut) => ({
    ["midi" + midiShortcut]: {
      callback: (value) => {
        if (typeof window !== "undefined") {
          if (!window.cc) window.cc = {};
          window.cc[midiShortcut] = value;
        }
      },
      label: `midi('${midiShortcut}', {min, max, transform}) cc bind`,
    },
  })).reduce((acc, curr) => ({ ...acc, ...curr }), {})),
};

export class MidiMappingService {
  constructor() {
    this.storageKey = STORAGE_KEY;
    this.mappableActions = { ...DEFAULT_MAPPABLE_ACTIONS };
    this.mapping = this.loadMapping();
    this.waitingForAction = null;
    this.waitingTimeoutId = null;
    this.isOpen = false;
    this.deviceCount = 0;
    this.deviceNames = [];
    this.listeners = new Set();
    this.activeMidiAccess = null;

    this.handleMIDIMessage = this.createMIDIHandler();
  }

  loadMapping() {
    if (typeof localStorage === "undefined") return {};
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn("[MidiMappingService] Failed to load from localStorage:", e);
      return {};
    }
  }

  saveMapping() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.mapping));
    } catch (e) {
      console.warn("[MidiMappingService] Failed to save to localStorage:", e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error("[MidiMappingService] Error in subscriber:", err);
      }
    }
  }

  getState() {
    return {
      isOpen: this.isOpen,
      mapping: { ...this.mapping },
      waitingForAction: this.waitingForAction,
      deviceCount: this.deviceCount,
      deviceNames: [...this.deviceNames],
      actions: { ...this.mappableActions },
    };
  }

  open() {
    this.isOpen = true;
    this.notify();
  }

  close() {
    this.isOpen = false;
    this.cancelAssign();
    this.notify();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  startAssign(actionId) {
    if (this.waitingForAction === actionId) {
      this.cancelAssign();
      return;
    }

    this.waitingForAction = actionId;
    if (this.waitingTimeoutId) {
      clearTimeout(this.waitingTimeoutId);
    }

    this.waitingTimeoutId = setTimeout(() => {
      this.waitingForAction = null;
      this.waitingTimeoutId = null;
      this.notify();
    }, WAITING_TIMEOUT_MS);

    this.notify();
  }

  cancelAssign() {
    if (this.waitingTimeoutId) {
      clearTimeout(this.waitingTimeoutId);
      this.waitingTimeoutId = null;
    }
    if (this.waitingForAction !== null) {
      this.waitingForAction = null;
      this.notify();
    }
  }

  clearMapping(actionId) {
    if (this.mapping[actionId]) {
      delete this.mapping[actionId];
      this.saveMapping();
      this.notify();
    }
  }

  registerAction(id, config) {
    if (!id || !config) return;
    this.mappableActions[id] = config;
    this.notify();
  }

  getFullMapping() {
    return { ...this.mapping };
  }

  formatMappingDesc(m) {
    if (!m) return "—";
    if (m.type === "cc") return `CC ${m.control} (ch ${m.channel})`;
    if (m.type === "note") return `Note ${m.note} (ch ${m.channel})`;
    return "—";
  }

  findActionForMessage(channel, type, controlOrNote) {
    const hits = [];
    for (const [actionId, m] of Object.entries(this.mapping)) {
      if (!m) continue;
      if (m.type === type && m.channel === channel) {
        if (type === "cc" && m.control === controlOrNote) hits.push(actionId);
        if (type === "note" && m.note === controlOrNote) hits.push(actionId);
      }
    }
    return hits;
  }

  createMIDIHandler() {
    return (midiMessage) => {
      const data = midiMessage.data;
      if (!data || data.length < 3) return;

      const kind = data[0];
      const channel = kind & 0x0f;
      const byte1 = data[1];
      const byte2 = data[2];
      const valNormalized = (byte2 > 64 ? byte2 + 1 : byte2) / 128.0;

      // 1. Assignment Learning Mode
      if (this.waitingForAction) {
        let assignment = null;
        if ((kind & 0xf0) === 0xb0) {
          assignment = { type: "cc", channel, control: byte1 };
        } else if ((kind & 0xf0) === 0x90 && byte2 > 0) {
          assignment = { type: "note", channel, note: byte1 };
        }

        if (assignment) {
          this.mapping[this.waitingForAction] = assignment;
          this.saveMapping();
          this.cancelAssign();
        }
        return;
      }

      // 2. Active Mapping Dispatch
      const status = kind & 0xf0;
      if (status === 0xb0) {
        const actions = this.findActionForMessage(channel, "cc", byte1);
        for (const actionId of actions) {
          const config = this.mappableActions[actionId];
          if (!config) continue;
          if (typeof config.callback === "function") {
            config.callback(valNormalized);
          } else if (
            config.action &&
            valNormalized > CC_TRIGGER_THRESHOLD &&
            typeof window !== "undefined" &&
            window.xemitter
          ) {
            window.xemitter.emit(config.action, config.payload || {});
          }
        }
      } else if (status === 0x90 && byte2 > 0) {
        const actions = this.findActionForMessage(channel, "note", byte1);
        for (const actionId of actions) {
          const config = this.mappableActions[actionId];
          if (!config) continue;
          if (typeof config.callback === "function") {
            config.callback(valNormalized);
          } else if (config.action && typeof window !== "undefined" && window.xemitter) {
            window.xemitter.emit(config.action, config.payload || {});
          }
        }
      }
    };
  }

  attachInput(input) {
    if (!input) return;
    input.removeEventListener("midimessage", this.handleMIDIMessage);
    input.addEventListener("midimessage", this.handleMIDIMessage);
  }

  updateConnectedDevices() {
    if (!this.activeMidiAccess || !this.activeMidiAccess.inputs) {
      this.deviceCount = 0;
      this.deviceNames = [];
      return;
    }

    const names = [];
    for (const input of this.activeMidiAccess.inputs.values()) {
      if (input.state === "connected") {
        names.push(input.name || "MIDI Device");
      }
    }
    this.deviceCount = names.length;
    this.deviceNames = names;
    this.notify();
  }

  setupMIDIHandler() {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) return;

    navigator.requestMIDIAccess().then(
      (midiAccess) => {
        this.activeMidiAccess = midiAccess;
        for (const input of midiAccess.inputs.values()) {
          this.attachInput(input);
        }
        this.updateConnectedDevices();

        midiAccess.onstatechange = (e) => {
          if (e.port && e.port.type === "input" && e.port.state === "connected") {
            this.attachInput(e.port);
          }
          this.updateConnectedDevices();
        };
      },
      () => {
        console.warn("[MidiMappingService] Could not access Web MIDI API");
      }
    );
  }
}

export const midiMappingService = new MidiMappingService();
