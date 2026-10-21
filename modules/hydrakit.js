/**
 * Hydrakit — WebMIDI State Engine, Tap Tempo Module & Audio-Reactive Sketch Helpers
 * Unified MIDI state management, rolling tap-tempo calculator, and sketch utilities for Hydralisk.
 */

class MidiEngine {
  constructor() {
    this.cc = new Array(128).fill(0.5);
    this.ccc = Array.from({ length: 16 }, () => new Array(128).fill(0.5));
    this.ccbind = [];
    // CC slots that actually received a message ("3" for any channel, "0:3" per channel).
    // cc/ccc are pre-filled with 0.5 for legacy sketches, so they can't tell us this.
    this.received = new Set();
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
    this.received.add(String(ccIndex));
    this.received.add(`${channel}:${ccIndex}`);

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

  /**
   * Raw normalized (0..1) CC value, or undefined if no message received yet.
   */
  getNormalized(ccIndex, { channel } = {}) {
    let localIndex = ccIndex;
    if (typeof ccIndex === "string") {
      if (/^[ABCD]$/.test(ccIndex)) {
        return typeof window !== "undefined" && window.cc ? window.cc[ccIndex] : undefined;
      }
      if (/^b\d+$/.test(ccIndex)) {
        localIndex = this.ccbind[parseInt(ccIndex.slice(1), 10)];
      }
    }
    if (localIndex === undefined || localIndex === null) return undefined;
    const receivedKey = channel !== undefined ? `${channel}:${localIndex}` : String(localIndex);
    if (!this.received.has(receivedKey)) return undefined;
    const ccArr = channel !== undefined ? this.ccc[channel] : this.cc;
    return ccArr ? ccArr[localIndex] : undefined;
  }
}

export const midiEngine = new MidiEngine();
midiEngine.init();

// --- Tap Tempo Module ---

/**
 * TapTempo — Rolling average BPM calculator & tap manager
 */
export class TapTempo {
  constructor({ maxTaps = 128, idleTimeoutMs = 3000 } = {}) {
    this.taps = [];
    this.totalTaps = 0;
    this.maxTaps = maxTaps;
    this.idleTimeoutMs = idleTimeoutMs;
    this.resetTimer = null;
    this.currentBpm = 120;
    this.lastTapTime = null;
    this.appContext = null;
  }

  setAppContext(app) {
    this.appContext = app;
  }

  reset = () => {
    this.taps = [];
    this.totalTaps = 0;
    this.lastTapTime = null;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  };

  tap = (timestamp = Date.now()) => {
    // 1. If more than 3 seconds elapsed since the last tap, clear buffer and counters first
    if (this.lastTapTime && (timestamp - this.lastTapTime >= this.idleTimeoutMs)) {
      this.reset();
    }
    this.lastTapTime = timestamp;

    // 2. Reset 3-second idle timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => {
      this.reset();
    }, this.idleTimeoutMs);

    // 3. Record tap and increment total tap counter
    this.taps.push(timestamp);
    this.totalTaps++;

    // 4. Retain buffer history up to maxTaps without emptying on recalculations
    if (this.taps.length > this.maxTaps) {
      this.taps.shift();
    }

    // 5. Only recalculate when the recorded tempo taps count is divisible by 4 (4, 8, 12, 16...)
    if (this.totalTaps >= 4 && this.totalTaps % 4 === 0) {
      const count = this.taps.length - 1;
      const totalIntervalMs = this.taps[this.taps.length - 1] - this.taps[0];

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
            this.appContext.emit("taptempo", { bpm: calculatedBpm });
          } else if (typeof window !== "undefined" && window.xemitter) {
            window.xemitter.emit("bpm:change", calculatedBpm);
            window.xemitter.emit("taptempo", { bpm: calculatedBpm });
          }
        }
      }
    }

    return this.currentBpm;
  };

  getBpm = () => {
    return this.currentBpm;
  };
}

export const tapTempo = new TapTempo();

if (typeof window !== "undefined") {
  window.tapTempo = tapTempo;
  window.addEventListener("keydown", (e) => {
    const isOptionSpace = e.altKey && (e.code === "Space" || e.key === " " || e.key === "Spacebar");
    if (isOptionSpace) {
      e.preventDefault();
      e.stopPropagation();
      tapTempo.tap(e.timeStamp);
      return;
    }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
      return;
    }
    // Only bare '[' and ']' without Cmd/Ctrl/Alt modifier keys should navigate setlist; ignore repeats
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }
    if (e.key === "[") {
      window.xemitter?.emit('gallery:prevSetlistSketch');
    } else if (e.key === "]") {
      window.xemitter?.emit('gallery:nextSetlistSketch');
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
 * Easing curves for midix duration-based tweens (t in 0..1).
 */
export const easings = {
  linear: (t) => t,
  quad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  cubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  expo: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
};

const defaultClock = () =>
  typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
let midixClock = defaultClock;

/**
 * Shared midix state, keyed by the call's identity (cc, channel, min, max, default).
 * Hydra re-evaluates the whole sketch on Ctrl+Enter, automutate, mutation jump and
 * master-effect apply; without this every re-eval would snap values back to their
 * default and re-arm pickup.
 */
const MIDIX_MAX_STATES = 512;
const midixStates = new Map();

function getMidixState(ccIndex, channel, min, max, def, pickup) {
  const key = `${ccIndex}|${channel ?? ""}|${min}|${max}|${def}`;
  let state = midixStates.get(key);
  if (!state) {
    state = {
      key,
      ccIndex,
      current: def,
      target: def,
      from: def,
      tweenStart: -Infinity,
      velocity: 0,
      lastTime: null,
      pickupRef: def,
      pickedUp: !pickup,
      lastSide: null, // sign of (ccValue - pickupRef), to detect fast crossings
    };
    midixStates.set(key, state);
    // Bound memory: mutations that rewrite min/max create new keys
    if (midixStates.size > MIDIX_MAX_STATES) {
      midixStates.delete(midixStates.keys().next().value);
    }
  }
  return state;
}

/**
 * Smoothed MIDI value getter: like midi(), but holds a value that eases toward
 * the CC-controlled target. State survives sketch re-evaluation (see above).
 *
 * Usage:
 *   midix(3, {min: 0, max: 10})                                // lerp smoothing, default = 5
 *   midix('A', {default: 0, ease: 'smooth', duration: () => beatMs(1)})
 *   midix('b0', {ease: 'cubic', duration: 500})
 *   midix(7, {ease: 'none'})                                   // no easing
 *
 * Options:
 *   min, max, channel, transform — same as midi()
 *   default  — value used until the CC is first received (default: (min+max)/2)
 *   ease     — 'lerp'   frame-rate independent exponential smoothing (default), rate = speed
 *              'smooth' critically damped spring; keeps velocity, so it follows a moving knob
 *                       without stalling. Settles in roughly `duration`. Best for knobs.
 *              'linear' | 'quad' | 'cubic' | 'sine' | 'expo' | 'outCubic' | (t) => t
 *                       timed tween over `duration`. While a tween runs, new CC values
 *                       retarget it instead of restarting it, so a turning knob never freezes.
 *              'none'   follow the CC directly
 *   speed    — lerp rate per second (default 6, ~0.5s to settle)
 *   duration — ms for 'smooth' and timed easings (default 300), or a function returning ms,
 *              re-evaluated every frame, e.g. () => beatMs(2)
 *   pickup   — synth-style pickup (default true): ignore CC until it reaches the
 *              default value (within pickupThreshold, or crossing it)
 *   pickupThreshold — fraction of |max-min| counted as "close" (default 0.05)
 *
 * Returned function extras: fn.set(v), fn.pickedUp(), fn.target()
 * Globals: midix.reset() clears all state; midixStatus(cc) lists state for a cc.
 */
export function midix(ccIndex, options = {}) {
  const {
    min = 0,
    max = 1,
    channel,
    transform,
    ease = "lerp",
    speed = 6,
    duration = 300,
    pickup = true,
    pickupThreshold = 0.05,
  } = options;
  const def = options.default !== undefined ? options.default : (min + max) / 2;
  const curve = typeof ease === "function" ? ease : easings[ease];
  const range = Math.abs(max - min) || 1;
  const s = getMidixState(ccIndex, channel, min, max, def, pickup);
  const getDuration = () => {
    const d = typeof duration === "function" ? duration() : duration;
    return Number.isFinite(d) && d > 0 ? d : 0;
  };

  const fn = () => {
    const t = midixClock();
    const norm = midiEngine.getNormalized(ccIndex, { channel });
    let newTarget = s.target;

    if (norm !== undefined) {
      const ccValue = norm * (max - min) + min;
      if (!s.pickedUp) {
        const side = Math.sign(ccValue - s.pickupRef);
        const close = Math.abs(ccValue - s.pickupRef) <= range * pickupThreshold;
        const crossed = s.lastSide !== null && side !== 0 && side !== s.lastSide;
        if (close || crossed || side === 0) s.pickedUp = true;
        s.lastSide = side;
      }
      if (s.pickedUp) newTarget = ccValue;
    }

    const dur = curve && ease !== "lerp" ? getDuration() : 0;

    if (newTarget !== s.target) {
      // Timed tweens: only start a new tween when the previous one has finished;
      // otherwise retarget the running one so continuous knob moves keep flowing.
      if (t - s.tweenStart >= dur) {
        s.from = s.current;
        s.tweenStart = t;
      }
      s.target = newTarget;
    }

    const dt = s.lastTime === null ? 0 : Math.max(0, Math.min((t - s.lastTime) / 1000, 0.25));

    if (ease === "none") {
      s.current = s.target;
      s.velocity = 0;
    } else if (ease === "smooth") {
      // Critically damped spring (Game Programming Gems 4, "SmoothDamp")
      const smoothTime = Math.max(getDuration() / 1000 / 3, 0.0001);
      const omega = 2 / smoothTime;
      const x = omega * dt;
      const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = s.current - s.target;
      const temp = (s.velocity + omega * change) * dt;
      s.velocity = (s.velocity - omega * temp) * exp;
      s.current = s.target + (change + temp) * exp;
      if (Math.abs(s.target - s.current) < range * 1e-4 && Math.abs(s.velocity) < range * 1e-3) {
        s.current = s.target;
        s.velocity = 0;
      }
    } else if (ease === "lerp" || !curve) {
      s.current += (s.target - s.current) * (1 - Math.exp(-speed * dt));
      if (Math.abs(s.target - s.current) < range * 1e-4) s.current = s.target;
      s.velocity = 0;
    } else {
      const p = dur > 0 ? Math.min((t - s.tweenStart) / dur, 1) : 1;
      s.current = s.from + (s.target - s.from) * curve(p);
      s.velocity = 0;
    }
    s.lastTime = t;

    return transform ? transform(s.current) : s.current;
  };

  // Jump to a value; with pickup enabled, CC is ignored again until it reaches v
  fn.set = (v) => {
    s.current = s.target = s.from = s.pickupRef = v;
    s.velocity = 0;
    s.tweenStart = -Infinity;
    s.pickedUp = !pickup;
    s.lastSide = null;
  };
  fn.pickedUp = () => s.pickedUp;
  fn.target = () => s.target;
  return fn;
}

/** Forget all midix state (values return to defaults, pickup re-arms). */
midix.reset = () => midixStates.clear();

/** Override the clock (ms) used by midix; pass nothing to restore. For tests. */
midix.setClock = (clock) => {
  midixClock = typeof clock === "function" ? clock : defaultClock;
};

/**
 * Snapshot of midix states for a cc (e.g. 'A'), for UI feedback such as
 * "waiting for pickup" indicators.
 */
export function midixStatus(ccIndex) {
  const out = [];
  for (const s of midixStates.values()) {
    if (s.ccIndex === ccIndex) {
      out.push({ key: s.key, pickedUp: s.pickedUp, pickupRef: s.pickupRef, current: s.current, target: s.target });
    }
  }
  return out;
}

/**
 * Convert a beat count to milliseconds at the current BPM (window.bpm, default 120).
 * Usage: beatMs(4) -> 2000 at 120 bpm, beatMs(0.5) -> 250, beatMs(1, 90) -> 666.67
 */
export function beatMs(beats = 1, bpm) {
  const currentBpm = bpm || (typeof window !== "undefined" && window.bpm ? window.bpm : 120);
  return (beats * 60000) / currentBpm;
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
        app.on("taptempo", (evt = {}) => {
          if (evt && typeof evt.bpm === "number") return;
          tapTempo.tap();
        });
        app.on("bpm:taptempo", (evt = {}) => {
          if (evt && typeof evt.bpm === "number") return;
          tapTempo.tap();
        });
        app.on("bpm:change", (bpmVal) => {
          if (typeof window !== "undefined") window.bpm = bpmVal;
        });
      }
      app.expose("midiEngine", midiEngine);
      app.expose("tapTempo", tapTempo);
      app.expose("midi", midi);
      app.expose("midix", midix);
      app.expose("midixStatus", midixStatus);
      app.expose("beatMs", beatMs);
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
