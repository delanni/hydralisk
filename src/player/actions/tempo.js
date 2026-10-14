/**
 * Tempo & speed actions.
 * Hydra reads the globals `window.bpm` and `window.speed`; these actions keep
 * them in sync with the store.
 */
import {
  getState, setState, DEFAULT_BPM, MIN_BPM, MAX_BPM, MIN_SPEED, MAX_SPEED
} from '../store/playerStore.js';
import { notify } from '../services/intercom.js';
import { clamp, roundTo } from '../utils/math.js';

export function setBpm(bpm) {
  window.bpm = bpm;
  setState({ bpm, baseBpm: bpm });
}

export function setBpmFromInput(rawValue) {
  setBpm(clamp(parseInt(rawValue, 10) || DEFAULT_BPM, MIN_BPM, MAX_BPM));
}

export function nudgeTempo(delta) {
  const current = getState().bpm || DEFAULT_BPM;
  setBpm(clamp(current + delta, MIN_BPM, MAX_BPM));
}

/** Temporarily bend the tempo by a percentage of the base BPM (pitch fader). */
export function bendTempo(offsetPercent) {
  const bent = Math.round(getState().baseBpm * (1 + offsetPercent / 100));
  window.bpm = bent;
  setState({ bpm: bent });
}

/** Release the pitch fader: the bent tempo becomes the new base. */
export function releaseTempoBend() {
  setState({ baseBpm: window.bpm || DEFAULT_BPM });
}

/**
 * Tap tempo. Called with `{ bpm }` when the shared TapTempo engine reports a
 * new tempo, or without arguments when the user taps.
 */
export function tapTempo(evt = {}) {
  if (evt && typeof evt.bpm === 'number') {
    setBpm(evt.bpm);
    notify(`Tap Tempo: ${evt.bpm} BPM`);
    return;
  }

  if (window.tapTempo && typeof window.tapTempo.tap === 'function') {
    window.tapTempo.tap();
  } else if (window.xemitter) {
    window.xemitter.emit('taptempo');
  }
  setState((s) => ({ tapPulse: s.tapPulse + 1 }));
}

export function setSpeed(speed) {
  if (getState().isPlaying) window.speed = speed;
  setState({ speed });
}

export function nudgeSpeed(delta) {
  setSpeed(roundTo(clamp(getState().speed + delta, MIN_SPEED, MAX_SPEED), 1));
}

export function resetSpeed({ announce = false } = {}) {
  window.speed = 1.0;
  setState({ speed: 1.0 });
  if (announce) notify('Speed: 1.0x');
}

export function reverseSpeed() {
  window.speed = -1 * (window.speed || 1.0);
  setState({ speed: window.speed });
  notify(`Speed: ${window.speed.toFixed(1)}x`);
}
