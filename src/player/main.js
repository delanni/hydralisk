// src/player/main.js - Entry point for modular Hydralisk Visual Player
import { state } from './state.js';
import { intercomNotify, showToast, showError } from './intercom.js';
import { playerSettings, syncPerformanceSettingsToHash, applySettingsFromHash } from './settingsSync.js';
import { resizeCanvas, startExperience, playBackupVisual } from './engine.js';
import { loadAllSketches, filterSketches, renderSketchesList, renderTagFilters, playSketch, updateNowPlaying, runCustomCode, resetCustomCode } from './sketchManager.js';
import { updateBPM, handleTapTempo, updatePlayPauseButton, togglePlayPause, playPrevSketch, playNextSketch, playRandomSketch, nudgeTempo, nudgeSpeed } from './controls.js';
import { mutateCode, setAutomutateMode, triggerMutation, saveMutationToHistory, undoMutation, redoMutation, updateMutationUndoRedoButtons } from './automutate.js';
import { switchTab, isMobileDevice, isUIHidden, updateTouchActionsUI, toggleCollapse, toggleTouchActions, toggleUI, openEditorWithCurrentSketch, toggleFullscreen, handleCloudLogin, updateAuthUI, startVolumeMeter } from './ui.js';
import { setupHotkeysAndEvents } from './hotkeys.js';

// Attach player settings to window
window.playerSettings = playerSettings;

// Bind all global functions to window for backward compatibility and inline HTML onclick handlers
window.startExperience = startExperience;
window.showToast = showToast;
window.intercomNotify = intercomNotify;
window.showError = showError;

window.playSketch = playSketch;
window.playPrevSketch = playPrevSketch;
window.playNextSketch = playNextSketch;
window.playRandomSketch = playRandomSketch;
window.togglePlayPause = togglePlayPause;
window.updatePlayPauseButton = updatePlayPauseButton;
window.runCustomCode = runCustomCode;
window.resetCustomCode = resetCustomCode;

window.updateBPM = updateBPM;
window.handleTapTempo = handleTapTempo;
window.nudgeTempo = nudgeTempo;
window.nudgeSpeed = nudgeSpeed;

window.setAutomutateMode = setAutomutateMode;
window.triggerMutation = triggerMutation;
window.undoMutation = undoMutation;
window.redoMutation = redoMutation;

window.switchTab = switchTab;
window.toggleCollapse = toggleCollapse;
window.toggleUI = toggleUI;
window.toggleTouchActions = toggleTouchActions;
window.toggleFullscreen = toggleFullscreen;
window.openEditorWithCurrentSketch = openEditorWithCurrentSketch;
window.handleCloudLogin = handleCloudLogin;

// Initialize event handlers & DOM hooks on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupHotkeysAndEvents();

  // Wire tab buttons
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.onclick = () => switchTab(btn.getAttribute('data-tab'));
  });

  // Wire BPM Number Input
  const bpmInput = document.getElementById('bpm-number-input');
  if (bpmInput) {
    bpmInput.onchange = (e) => {
      const val = Math.max(20, Math.min(240, parseInt(e.target.value) || 120));
      state.baseBpm = val;
      updateBPM(val);
    };
  }

  // Wire Pitch Bend Fader
  const bendSlider = document.getElementById('bpm-bend-slider');
  if (bendSlider) {
    bendSlider.oninput = (e) => {
      const offsetPercent = parseFloat(e.target.value);
      const bentBpm = Math.round(state.baseBpm * (1 + offsetPercent / 100));
      updateBPM(bentBpm);
    };

    const resetBend = () => {
      state.baseBpm = window.bpm || 120;
      bendSlider.value = 0;
    };
    bendSlider.onmouseup = resetBend;
    bendSlider.ontouchend = resetBend;
  }

  // Wire Speed Slider
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-val');
  if (speedSlider && speedVal) {
    speedSlider.oninput = (e) => {
      const speed = parseFloat(e.target.value);
      if (state.isPlaying) {
        window.speed = speed;
      }
      speedVal.innerText = speed.toFixed(1) + 'x';
    };
  }

  // Wire sketch search input
  const searchInput = document.getElementById('sketch-search-input');
  if (searchInput) {
    searchInput.oninput = () => filterSketches();
  }

  // Request MIDI Access if supported
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(() => {
      const midiDot = document.getElementById('midi-indicator-dot');
      if (midiDot) midiDot.classList.add('active');
    }).catch(() => { });
  }

  // Check Amakit cloud credentials
  if (window.amakit) {
    const creds = window.amakit.getCredentials();
    if (creds) {
      window.amakit.login(false)
        .then(() => updateAuthUI(true))
        .catch(() => updateAuthUI(false));
    } else {
      updateAuthUI(false);
    }
  }

  if (isMobileDevice()) {
    state.touchActionsEnabled = true;
  }
  updateTouchActionsUI();
  window.addEventListener('resize', updateTouchActionsUI);

  // Auto-launch player experience if welcome screen was previously closed
  try {
    if (localStorage.getItem('welcomeScreenClosed') === 'true') {
      const splash = document.getElementById('splash-screen');
      if (splash) splash.style.display = 'none';
      startExperience();
    }
  } catch (e) {}
});

export {
  state,
  startExperience,
  showToast,
  playSketch,
  toggleUI,
  openEditorWithCurrentSketch
};
