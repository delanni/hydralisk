/**
 * Player lifecycle: engine start-up and URL hash settings.
 */
import { getState, setState } from '../store/playerStore.js';
import { notify, notifyError } from '../services/intercom.js';
import { initHydra } from '../services/hydraEngine.js';
import { findSketchIndexByName } from '../services/sketchRepository.js';
import { readString, writeString, PREF_KEYS } from '../services/preferences.js';
import { readHashSettings } from '../services/hashSettings.js';
import { reloadSketches } from './library.js';
import { playSketch, playFallbackSketch } from './playback.js';
import { setBpm } from './tempo.js';
import { setAutomutateMode } from './automutate.js';
import { setUIHidden } from './layout.js';

const SPLASH_FADE_MS = 500;

export function shouldAutoLaunch() {
  return readString(PREF_KEYS.welcomeClosed) === 'true';
}

/** Apply performance settings encoded in the URL hash (#b120|h1|m4|s10). */
export function applyHashSettings() {
  const settings = readHashSettings();

  if (typeof settings.bpm === 'number') setBpm(settings.bpm);
  if (typeof settings.hud === 'number') setUIHidden(settings.hud === 0);
  if (settings.automutate) setAutomutateMode(settings.automutate, true);
  if (typeof settings.speed === 'number') {
    window.speed = settings.speed;
    setState({ speed: settings.speed });
  }
  setState({ hashSettingsApplied: true });
}

function pickInitialSketchIndex(sketches) {
  const urlParams = new URLSearchParams(window.location.search);
  const targetName = urlParams.get('sketch') || readString(PREF_KEYS.lastSketch);
  return Math.max(0, findSketchIndexByName(sketches, targetName));
}

/** Initialise Hydra, load the library and start playing. */
export async function startExperience() {
  if (getState().engineReady) return;
  try {
    initHydra();
    setState({ engineReady: true });
    writeString(PREF_KEYS.welcomeClosed, 'true');

    if (getState().splash === 'visible') setState({ splash: 'fading' });
    setTimeout(() => {
      setState({ splash: 'hidden', isPlaying: true });
      if (window.xemitter) window.xemitter.emit('engine:ready');
    }, SPLASH_FADE_MS);

    const sketches = await reloadSketches();
    if (sketches.length > 0) {
      playSketch(pickInitialSketchIndex(sketches));
    } else {
      playFallbackSketch();
    }

    applyHashSettings();
    window.addEventListener('hashchange', applyHashSettings);

    notify('Visual engine initialized successfully');
  } catch (err) {
    console.error(err);
    notifyError(err);
  }
}
