/**
 * Hydralisk Engine & Canvas Lifecycle Module
 * Handles Hydra engine initialization, audio context startup, resolution updates, and backup pattern fallback.
 */

import { state } from './state.js';
import { showToast, showError } from './intercom.js';
import { loadAllSketches, playSketch, updateNowPlaying } from './sketchManager.js';
import { updatePlayPauseButton } from './controls.js';
import { applySettingsFromHash } from './settingsSync.js';

/**
 * Resize Hydra canvas to fit current viewport resolution
 */
export function resizeCanvas() {
  const canvas = document.getElementById('hydra-canvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (typeof setResolution === 'function') {
      setResolution(window.innerWidth, window.innerHeight);
    }
  }
}

/**
 * Initialise Hydra synth and start the experience
 */
export async function startExperience() {
  const splash = document.getElementById('splash-screen');
  const canvas = document.getElementById('hydra-canvas');

  try {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    if (typeof Hydra !== 'undefined') {
      state.hydraInstance = new Hydra({
        canvas: canvas,
        detectAudio: true,
        makeGlobal: true,
        width: window.innerWidth,
        height: window.innerHeight
      });

      window.addEventListener('resize', resizeCanvas);

      const hydraAudioCanvas = document.querySelector('body > canvas:not(#hydra-canvas)');
      if (hydraAudioCanvas) {
        hydraAudioCanvas.id = 'audio-canvas';
      }
      if (window.HydraliskPlugins) {
        window.HydraliskPlugins.init({ hydra: state.hydraInstance });
        window.HydraliskPlugins.onHydraReady(state.hydraInstance);
      }
    } else {
      throw new Error('Hydra player engine library not loaded.');
    }

    // Persist welcome screen closed in localStorage
    try {
      localStorage.setItem('welcomeScreenClosed', 'true');
    } catch (e) {}

    // Fade out splash
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.style.display = 'none';
        state.isPlaying = true;
        updatePlayPauseButton();
        if (window.xemitter) window.xemitter.emit('engine:ready');
      }, 500);
    }

    // Load sketches
    await loadAllSketches();

    // Check URL querystring or localStorage for sketch protocol
    const urlParams = new URLSearchParams(window.location.search);
    const targetName = urlParams.get('sketch') || localStorage.getItem('lastSelectedSketchName');

    let initialIdx = 0;
    if (targetName && state.sketchesList.length > 0) {
      const foundIdx = state.sketchesList.findIndex(s => s.name && s.name.toLowerCase() === targetName.toLowerCase());
      if (foundIdx >= 0) initialIdx = foundIdx;
    }

    if (state.sketchesList.length > 0) {
      playSketch(initialIdx);
    } else {
      playBackupVisual();
    }

    applySettingsFromHash();
    window.addEventListener('hashchange', applySettingsFromHash);

    showToast("Visual engine initialized successfully");
  } catch (err) {
    console.error(err);
    showError(err);
  }
}

/**
 * Backup visual pattern if sketch fetching fails
 */
export function playBackupVisual() {
  if (typeof hush === 'function') hush();
  if (typeof osc === 'function') {
    osc(10, 0.1, 1.2)
      .color(0.2, 0.7, 0.9)
      .rotate(0.1, 0.05)
      .out(typeof o0 !== 'undefined' ? o0 : undefined);
  }

  updateNowPlaying({
    name: "Default Oscillation",
    author: "System",
    bpm: 120,
    code: "osc(10, 0.1, 1.2).color(0.2, 0.7, 0.9).rotate(0.1, 0.05).out(o0);"
  });
}
