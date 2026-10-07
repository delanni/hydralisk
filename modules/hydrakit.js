/**
 * Hydrakit — WebMIDI State Engine, Tap Tempo Module & Audio-Reactive Sketch Helpers
 * Unified MIDI state management, rolling tap-tempo calculator, and sketch utilities for Hydralisk.
 */

class MidiEngine {
  constructor() {
    this.cc = new Array(128).fill(0.5);
    this.ccc = Array.from({ length: 16 }, () => new Array(128).fill(0.5));
    this.ccbind = [];
    this.isInitialized = false;

    // Expose globals for sketch backward compatibility
    if (typeof window !== "undefined") {
      window.cc = this.cc;
      window.ccc = this.ccc;
      window.ccbind = this.ccbind;
    }
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then((access) => this.handleMidiSuccess(access))
        .catch((err) => console.warn("[Hydrakit] Could not access MIDI devices:", err));
    }
  }

  handleMidiSuccess(midiAccess) {
    console.log("[Hydrakit] WebMIDI access granted");
    for (const input of midiAccess.inputs.values()) {
      this.attachInput(input);
    }
    midiAccess.onstatechange = (e) => {
      if (e.port && e.port.type === "input" && e.port.state === "connected") {
        console.log(`[Hydrakit] Hot-plugged MIDI device: ${e.port.name}`);
        this.attachInput(e.port);
      }
    };
  }

  attachInput(input) {
    if (!input) return;
    input.removeEventListener("midimessage", this.onMidiMessage);
    input.addEventListener("midimessage", this.onMidiMessage);
  }

  onMidiMessage = (event) => {
    if (!event || !event.data) return;
    const [kind, ccIndex, rawValue] = event.data;
    if (ccIndex === undefined) return;

    const channel = kind & 0b00001111;
    const normalizedValue = (rawValue > 64 ? rawValue + 1 : rawValue) / 128.0;

    this.cc[ccIndex] = normalizedValue;
    this.ccc[channel][ccIndex] = normalizedValue;

    if (!this.ccbind.includes(ccIndex)) {
      console.log(`[Hydrakit] CC #${ccIndex} bound to b${this.ccbind.length}`);
      this.ccbind.push(ccIndex);
    }
  };

  getValue(ccIndex, { min = 0, max = 1, channel, transform } = {}) {
    let localIndex = ccIndex;
    let valNorm = min;

    if (typeof ccIndex === "string") {
      if (/^[ABCD]$/.test(ccIndex)) {
        const globalVal = window.cc ? window.cc[ccIndex] : undefined;
        if (globalVal === undefined) return min;
        const value = globalVal * (max - min) + min;
        return transform ? transform(value) : value;
      }
      if (/^b\d+$/.test(ccIndex)) {
        const bindIndex = parseInt(ccIndex.slice(1), 10);
        localIndex = this.ccbind[bindIndex];
        if (localIndex === undefined) return min;
      }
    }

    if (localIndex === undefined || localIndex === null) return min;

    const ccArr = channel !== undefined ? this.ccc[channel] : this.cc;
    const rawVal = ccArr[localIndex] !== undefined ? ccArr[localIndex] : 0.5;
    const value = rawVal * (max - min) + min;

    return transform ? transform(value) : value;
  }
}

export const midiEngine = new MidiEngine();
midiEngine.init();

// --- Tap Tempo Module ---

/**
 * TapTempo — Rolling average BPM calculator & tap manager
 */
export class TapTempo {
  constructor({ maxTaps = 16, idleTimeoutMs = 5000, minTaps = 4 } = {}) {
    this.taps = [];
    this.maxTaps = maxTaps;
    this.idleTimeoutMs = idleTimeoutMs;
    this.minTaps = minTaps;
    this.resetTimer = null;
    this.currentBpm = 120;
    this.appContext = null;
  }

  setAppContext(app) {
    this.appContext = app;
  }

  tap = (timestamp = Date.now()) => {
    // Reset 5s idle timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => {
      this.reset();
    }, this.idleTimeoutMs);

    this.taps.push(timestamp);

    // Keep rolling history up to maxTaps
    if (this.taps.length > this.maxTaps) {
      this.taps.shift();
    }

    // Calculate rolling average BPM ONLY on every 4th tap (4, 8, 12, 16...)
    if (this.taps.length >= 4 && this.taps.length % 4 === 0) {
      const first = this.taps[0];
      const last = this.taps[this.taps.length - 1];
      const count = this.taps.length - 1;
      const totalIntervalMs = last - first;

      if (totalIntervalMs > 0 && count > 0) {
        const avgIntervalMs = totalIntervalMs / count;
        const calculatedBpm = Math.round(60000 / avgIntervalMs);

        if (calculatedBpm >= 30 && calculatedBpm <= 300) {
          this.currentBpm = calculatedBpm;
          if (typeof window !== "undefined") {
            window.bpm = calculatedBpm;
          }
          if (this.appContext) {
            this.appContext.bpm = calculatedBpm;
            this.appContext.emit("bpm:change", calculatedBpm);
          } else if (typeof window !== "undefined" && window.xemitter) {
            window.xemitter.emit("taptempo", { bpm: calculatedBpm });
          }
        }
      }
    }

    return this.currentBpm;
  };

  reset = () => {
    this.taps = [];
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  };

  getBpm = () => {
    return this.currentBpm;
  };
}

export const tapTempo = new TapTempo();

if (typeof window !== "undefined") {
  window.tapTempo = tapTempo;
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.altKey) {
      e.preventDefault();
      tapTempo.tap(e.timeStamp);
    }
  });
}

// --- Sketch Helper Functions ---

/**
 * MIDI value getter for sketches
 * Usage: midi(3, {min: 10, max: 60}), midi('b0'), midi('A')
 */
export function midi(ccIndex, options = {}) {
  return () => midiEngine.getValue(ccIndex, options);
}

/**
 * BPM-synced sawtooth ramp for Hydra arrays or properties
 */
export const saw =
  ({ min = 0, max = 1, x = 1, t } = {}) =>
  ({ time }) => {
    const currentBpm = typeof window !== "undefined" && window.bpm ? window.bpm : 120;
    const spb = (60 / currentBpm) * x;
    const p = ((time % spb) / spb) * (max - min) + min;
    return t ? t(p) : p;
  };

/**
 * Low Frequency Oscillator (LFO) builder for Hydra params
 */
export function createLFO({
  frequency = 1,
  amplitude = 1,
  phase = 0,
  waveform = "sine",
  bpm = undefined,
  trans = undefined,
  t = undefined,
} = {}) {
  const transform = trans || t;
  if (bpm) {
    frequency = (bpm / 60) * frequency;
  }
  const omega = 2 * Math.PI * frequency;

  return ({ time }) => {
    const theta = omega * time + phase;
    let value;

    switch (waveform) {
      case "sine":
        value = Math.sin(theta);
        break;
      case "square":
        value = Math.sign(Math.sin(theta));
        break;
      case "sawtooth":
        value = 2 * (theta / (2 * Math.PI) - Math.floor(0.5 + theta / (2 * Math.PI)));
        break;
      case "triangle":
        value = 2 * Math.abs(2 * (theta / (2 * Math.PI) - Math.floor(0.5 + theta / (2 * Math.PI)))) - 1;
        break;
      case "random":
        value = Math.random() * 2 - 1;
        break;
      default:
        throw new Error(`[Hydrakit] Unsupported LFO waveform: ${waveform}`);
    }

    const scaled = value * amplitude;
    return transform ? transform(scaled) : scaled;
  };
}

/**
 * Returns random integer in range [from, to]
 */
export function randInt(from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

/**
 * Balanced random float in range [-0.5, 0.5]
 */
export function rx() {
  return Math.random() - 0.5;
}

/**
 * Template string function evaluator: f`x => x * 2`
 */
export const f = (...args) => new Function("return " + String.raw(...args));

/**
 * Call-site keyed target value smoothing/easing across frame re-evaluations
 */
const _xxxStorage = {};
export const xxx = (target) => {
  try {
    const stackLines = new Error().stack.split("\n");
    const callLine = stackLines[2] || stackLines[1] || "";
    const match = callLine.match(/<anonymous>:(\d+:\d+)/) || callLine.match(/:(\d+:\d+)/);
    const key = match ? match[1] : "default";

    if (!_xxxStorage[key]) {
      _xxxStorage[key] = target;
    }
    let current = _xxxStorage[key];
    return () => {
      if (Math.abs(target - current) >= 1 / 30) {
        current += (target - current) / 30;
        _xxxStorage[key] = current;
      } else {
        _xxxStorage[key] = target;
      }
      return current;
    };
  } catch (e) {
    return () => target;
  }
};

/**
 * Euclidean-style beat pattern generator
 */
export const beatPattern = (length, hits, map = (e) => e) => {
  hits = Math.floor(Math.min(length, hits));
  const arr = new Array(Math.floor(length)).fill(0);
  while (hits > 0) {
    const r = Math.floor(Math.random() * length);
    if (!arr[r]) {
      arr[r] = 1;
      hits--;
    }
  }
  return arr.map(map);
};

/**
 * Single-invocation function wrapper
 */
export function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

/**
 * Hex or RGB color solid generator without eval
 */
export function color(...args) {
  function hexToRgb(hex) {
    if (hex.startsWith("#")) hex = hex.slice(1);
    const r = (parseInt(hex.slice(0, 2), 16) / 255).toPrecision(4);
    const g = (parseInt(hex.slice(2, 4), 16) / 255).toPrecision(4);
    const b = (parseInt(hex.slice(4, 6), 16) / 255).toPrecision(4);
    return { r: Number(r), g: Number(g), b: Number(b) };
  }

  let r = 0, g = 0, b = 0;
  if (args.length === 1 && typeof args[0] === "string") {
    const rgb = hexToRgb(args[0]);
    r = rgb.r; g = rgb.g; b = rgb.b;
  } else {
    r = Number(args[0]) || 0;
    g = Number(args[1]) || 0;
    b = Number(args[2]) || 0;
  }

  if (typeof window !== "undefined" && typeof window.solid === "function") {
    return window.solid(r, g, b);
  }
  return ({ time }) => {
    if (typeof window !== "undefined" && typeof window.solid === "function") {
      return window.solid(r, g, b);
    }
  };
}

// --- Plugin System Registration ---
if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "hydrakit",
    name: "Hydrakit Helpers & WebMIDI CC Engine",
    init(app) {
      tapTempo.setAppContext(app);
      if (app.on) {
        app.on("taptempo", () => tapTempo.tap());
        app.on("bpm:taptempo", () => tapTempo.tap());
      }
      app.expose("midiEngine", midiEngine);
      app.expose("tapTempo", tapTempo);
      app.expose("midi", midi);
      app.expose("saw", saw);
      app.expose("createLFO", createLFO);
      app.expose("randInt", randInt);
      app.expose("rx", rx);
      app.expose("f", f);
      app.expose("xxx", xxx);
      app.expose("beatPattern", beatPattern);
      app.expose("once", once);
      app.expose("color", color);
    },
  });
}
