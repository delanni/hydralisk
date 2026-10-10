// src/player/hotkeys.js - Keybindings and xemitter event listener setup for Hydralisk Player
import { state } from './state.js';
import { intercomNotify } from './intercom.js';
import { handleTapTempo, playPrevSketch, playNextSketch, playRandomSketch, nudgeSpeed } from './controls.js';
import { triggerMutation, undoMutation } from './automutate.js';
import { toggleUI, toggleTouchActions, toggleFullscreen } from './ui.js';

export function setupHotkeysAndEvents() {
  // Wire xemitter event handlers
  if (window.xemitter) {
    window.xemitter.on("taptempo", (data) => handleTapTempo(data));
    window.xemitter.on("bpm:taptempo", (data) => handleTapTempo(data));
    window.xemitter.on("gallery:nextSketch", () => playNextSketch());
    window.xemitter.on("gallery:prevSketch", () => playPrevSketch());
    window.xemitter.on("gallery:randomSketch", () => playRandomSketch());
    window.xemitter.on("editor:randomize", () => triggerMutation());
    window.xemitter.on("editor:jumpBack1", () => undoMutation());
    window.xemitter.on("gfx:speedSlower", () => nudgeSpeed(-0.1));
    window.xemitter.on("gfx:speedFaster", () => nudgeSpeed(0.1));
    window.xemitter.on("gfx:speedDefault", () => {
      window.speed = 1.0;
      const speedSlider = document.getElementById('speed-slider');
      const speedVal = document.getElementById('speed-val');
      if (speedSlider) speedSlider.value = "1.0";
      if (speedVal) speedVal.innerText = "1.0x";
      intercomNotify("Speed: 1.0x");
    });
    window.xemitter.on("gfx:speedReverse", () => {
      window.speed = -1 * (window.speed || 1.0);
      const speedVal = document.getElementById('speed-val');
      if (speedVal) speedVal.innerText = window.speed.toFixed(1) + "x";
      intercomNotify(`Speed: ${window.speed.toFixed(1)}x`);
    });
    window.xemitter.on("hideAll", () => toggleUI());
    window.xemitter.on("fullscreen", () => toggleFullscreen());
  }

  // Keyboard shortcut listeners
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        playPrevSketch();
        break;
      case 'ArrowRight':
        e.preventDefault();
        playNextSketch();
        break;
      case 'KeyR':
        playRandomSketch();
        break;
      case 'KeyH':
        toggleUI();
        break;
      case 'KeyT':
        toggleTouchActions();
        break;
      case 'KeyF':
        toggleFullscreen();
        break;
    }
  });
}
