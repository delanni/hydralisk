/**
 * Hydralisk Performance Settings Hash Sync & Protocol Handler
 * Manages encoding and decoding performance state in URL hash fragments.
 */

import { state } from './state.js';
import { isUIHidden, toggleUI } from './ui.js';
import { updateBPM } from './controls.js';
import { setAutomutateMode } from './automutate.js';
import { playerSettings } from '../../modules/settings.js';

export { playerSettings };

/**
 * Sync current live performance state to URL location.hash fragment according to protocol: #b120|h1|m4|s10
 */
export function syncPerformanceSettingsToHash() {
  if (window.playerSettings && typeof window.playerSettings.syncToHash === 'function') {
    window.playerSettings.syncToHash({
      bpm: window.bpm || state.baseBpm || 120,
      hud: isUIHidden() ? 0 : 1,
      automutate: state.automutateMode || 'off',
      speed: window.speed || 1.0
    });
  }
}

/**
 * Decode performance state from location.hash fragment and apply to player state
 */
export function applySettingsFromHash() {
  if (!window.playerSettings || typeof window.playerSettings.decode !== 'function') return;
  const settings = window.playerSettings.decode(window.location.hash);

  if (typeof settings.bpm === 'number') {
    state.baseBpm = settings.bpm;
    updateBPM(settings.bpm);
  }

  if (typeof settings.hud === 'number') {
    const isHidden = isUIHidden();
    if (settings.hud === 0 && !isHidden) {
      toggleUI();
    } else if (settings.hud === 1 && isHidden) {
      toggleUI();
    }
  }

  if (settings.automutate) {
    setAutomutateMode(settings.automutate, true);
  }

  if (typeof settings.speed === 'number') {
    window.speed = settings.speed;
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    if (speedSlider) speedSlider.value = settings.speed.toFixed(1);
    if (speedVal) speedVal.innerText = `${settings.speed.toFixed(1)}x`;
  }
}
