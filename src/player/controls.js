// src/player/controls.js - Playback, tempo, and fader controls for Hydralisk Player
import { state } from './state.js';
import { intercomNotify } from './intercom.js';
import { syncPerformanceSettingsToHash } from './settingsSync.js';
import { playSketch } from './sketchManager.js';
import { triggerMutation } from './automutate.js';

export function updateBPM(newBpm) {
  window.bpm = newBpm;
  state.baseBpm = newBpm;

  const numInput = document.getElementById('bpm-number-input');
  if (numInput) numInput.value = newBpm;

  // Re-adjust automutate interval if active
  if (state.automutateMode !== 'off') {
    // Import dynamically or pass down if needed
    if (window.setAutomutateMode) {
      window.setAutomutateMode(state.automutateMode, true);
    }
  }
  syncPerformanceSettingsToHash();
}

export function handleTapTempo(evt = {}) {
  if (evt && typeof evt.bpm === "number") {
    state.baseBpm = evt.bpm;
    updateBPM(evt.bpm);
    const bpmInput = document.getElementById('bpm-number-input');
    if (bpmInput) bpmInput.value = evt.bpm;
    intercomNotify(`Tap Tempo: ${evt.bpm} BPM`);
    return;
  }

  const now = performance.now();
  state.tapTimes.push(now);
  if (state.tapTimes.length > 4) {
    state.tapTimes.shift();
  }

  if (state.tapTimes.length >= 2) {
    let sum = 0;
    for (let i = 1; i < state.tapTimes.length; i++) {
      sum += (state.tapTimes[i] - state.tapTimes[i - 1]);
    }
    const avgMs = sum / (state.tapTimes.length - 1);
    const calculatedBPM = Math.round(60000 / avgMs);
    const clampedBPM = Math.max(20, Math.min(240, calculatedBPM));

    state.baseBpm = clampedBPM;
    updateBPM(clampedBPM);
    const bpmInput = document.getElementById('bpm-number-input');
    if (bpmInput) bpmInput.value = clampedBPM;
    intercomNotify(`Tap Tempo: ${clampedBPM} BPM`);
  }

  // Flash TAP button element if available
  const btn = document.getElementById('tap-tempo-btn');
  if (btn) {
    btn.style.background = 'rgba(0, 242, 254, 0.4)';
    btn.style.borderColor = 'var(--color-accent)';
    setTimeout(() => {
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 100);
  }
}

export function updatePlayPauseButton() {
  const btn = document.getElementById('play-pause-btn');
  if (!btn) return;

  if (state.isPlaying) {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>
    `;
    btn.title = "Pause Loop (Space)";
  } else {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
    btn.title = "Resume Loop (Space)";
  }
}

export function togglePlayPause() {
  if (!state.hydraInstance) return;
  state.isPlaying = !state.isPlaying;

  if (state.isPlaying) {
    window.speed = parseFloat(document.getElementById('speed-slider')?.value || '1.0') || 1.0;
    intercomNotify("Visuals resumed");
  } else {
    window.speed = 0;
    intercomNotify("Visuals paused");
  }
  updatePlayPauseButton();
}

export function playPrevSketch() {
  if (state.sketchesList.length === 0) return;
  let prevIdx = state.currentSketchIndex - 1;
  if (prevIdx < 0) prevIdx = state.sketchesList.length - 1;
  playSketch(prevIdx);
}

export function playNextSketch() {
  if (state.sketchesList.length === 0) return;
  let nextIdx = (state.currentSketchIndex + 1) % state.sketchesList.length;
  playSketch(nextIdx);
}

export function playRandomSketch() {
  if (state.sketchesList.length === 0) return;
  const randIdx = Math.floor(Math.random() * state.sketchesList.length);
  playSketch(randIdx);
}

export function nudgeTempo(delta) {
  const bpmInput = document.getElementById('bpm-number-input');
  const current = parseInt(bpmInput?.value || state.baseBpm || 120, 10) || 120;
  const next = Math.max(20, Math.min(240, current + delta));
  state.baseBpm = next;
  updateBPM(next);
  if (bpmInput) bpmInput.value = next;
}

export function nudgeSpeed(delta) {
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-val');
  if (!speedSlider || !speedVal) return;

  const current = parseFloat(speedSlider.value || '1');
  const next = Math.max(0, Math.min(4, current + delta));
  const rounded = Math.round(next * 10) / 10;
  speedSlider.value = rounded.toFixed(1);
  if (state.isPlaying) {
    window.speed = rounded;
  }
  speedVal.innerText = `${rounded.toFixed(1)}x`;
  syncPerformanceSettingsToHash();
}
