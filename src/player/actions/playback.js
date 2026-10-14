/**
 * Sketch playback actions: selecting, navigating and evaluating sketches.
 */
import { getState, setState, selectCurrentSketch } from '../store/playerStore.js';
import { notify, notifyError } from '../services/intercom.js';
import { evaluate, showErrorPattern, getHydra, FALLBACK_SKETCH, playFallbackPattern } from '../services/hydraEngine.js';
import { findSketchIndexByName } from '../services/sketchRepository.js';
import { writeString, PREF_KEYS } from '../services/preferences.js';
import { setBpm, resetSpeed } from './tempo.js';
import { resetMutationHistory, pushMutationHistory } from './automutate.js';

const toNowPlaying = (sketch) => ({
  name: sketch.name,
  author: sketch.author,
  bpm: sketch.bpm || 120,
  tags: sketch.metadata?.tags || [],
  midi: Boolean(sketch.midi)
});

const sourceNameFor = (sketch) => `hydra-sketch-${sketch.name.replace(/\s+/g, '-').toLowerCase()}`;

function rememberSketch(name) {
  writeString(PREF_KEYS.lastSketch, name);
  try {
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location);
      url.searchParams.set('sketch', name);
      window.history.replaceState({}, '', url.toString());
    }
  } catch (e) {}
}

/**
 * Play a sketch by index in the full list, or by (case-insensitive) name.
 */
export function playSketch(indexOrName) {
  const { sketches } = getState();
  let index = indexOrName;

  if (typeof index === 'string') {
    index = findSketchIndexByName(sketches, indexOrName);
    if (index < 0) {
      console.warn(`Sketch not found: ${indexOrName}`);
      return;
    }
  }
  if (typeof index !== 'number' || index < 0 || index >= sketches.length) return;

  const sketch = sketches[index];
  if (sketch.name) rememberSketch(sketch.name);

  setState({ currentSketchIndex: index });
  setBpm(sketch.bpm || 120);
  resetSpeed();
  resetMutationHistory(sketch.code);

  try {
    evaluate(sketch.code, sourceNameFor(sketch));
    setState({ nowPlaying: toNowPlaying(sketch), editorCode: sketch.code || '' });
    notify(`Loaded: ${sketch.name}`);
  } catch (err) {
    console.error('Evaluation error:', err);
    notifyError(err);
    showErrorPattern();
  }
}

export function playPrevSketch() {
  const { sketches, currentSketchIndex } = getState();
  if (sketches.length === 0) return;
  playSketch(currentSketchIndex - 1 < 0 ? sketches.length - 1 : currentSketchIndex - 1);
}

export function playNextSketch() {
  const { sketches, currentSketchIndex } = getState();
  if (sketches.length === 0) return;
  playSketch((currentSketchIndex + 1) % sketches.length);
}

export function playRandomSketch() {
  const { sketches } = getState();
  if (sketches.length === 0) return;
  playSketch(Math.floor(Math.random() * sketches.length));
}

export function playFallbackSketch() {
  playFallbackPattern();
  setState({ nowPlaying: toNowPlaying(FALLBACK_SKETCH), editorCode: FALLBACK_SKETCH.code });
}

export function togglePlayPause() {
  if (!getHydra()) return;
  const isPlaying = !getState().isPlaying;
  setState({ isPlaying });

  if (isPlaying) {
    window.speed = getState().speed || 1.0;
    notify('Visuals resumed');
  } else {
    window.speed = 0;
    notify('Visuals paused');
  }
}

export function setEditorCode(code) {
  setState({ editorCode: code });
}

/** Evaluate the code currently in the editor tab. */
export function runCustomCode() {
  const code = getState().editorCode;
  try {
    evaluate(code, 'hydra-custom-sketch');
    notify('Code updated & running');
    setState((s) => ({
      nowPlaying: { ...(s.nowPlaying || {}), name: 'Custom Edit', author: 'Developer Session' }
    }));
    pushMutationHistory(code);
  } catch (err) {
    console.error('Evaluation error:', err);
    notifyError(err);
    showErrorPattern();
  }
}

/** Restore and replay the original code of the active sketch. */
export function resetCustomCode() {
  const sketch = selectCurrentSketch(getState());
  if (!sketch) return;
  setState({ editorCode: sketch.code });
  playSketch(getState().currentSketchIndex);
  notify('Sketch code reset');
}
