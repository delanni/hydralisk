/**
 * Hydra engine service.
 * Owns the Hydra synth instance and the evaluation of sketch code on the canvas.
 */

let canvasEl = null;
let hydraInstance = null;

export const FALLBACK_SKETCH = {
  name: 'Default Oscillation',
  author: 'System',
  bpm: 120,
  code: 'osc(10, 0.1, 1.2).color(0.2, 0.7, 0.9).rotate(0.1, 0.05).out(o0);'
};

export function registerCanvas(el) {
  canvasEl = el;
}

export function getHydra() {
  return hydraInstance;
}

function resizeCanvas() {
  if (!canvasEl) return;
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
  if (typeof window.setResolution === 'function') {
    window.setResolution(window.innerWidth, window.innerHeight);
  }
}

/**
 * Create the Hydra synth bound to the registered canvas.
 * Throws if the hydra-synth library is not available.
 */
export function initHydra() {
  if (hydraInstance) return hydraInstance;
  if (typeof window.Hydra === 'undefined') {
    throw new Error('Hydra player engine library not loaded.');
  }

  if (canvasEl) {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  }

  hydraInstance = new window.Hydra({
    canvas: canvasEl,
    detectAudio: true,
    makeGlobal: true,
    width: window.innerWidth,
    height: window.innerHeight
  });

  window.addEventListener('resize', resizeCanvas);

  // Hydra appends its audio analyser canvas next to ours; tag it so CSS can hide it.
  const hydraAudioCanvas = (canvasEl?.parentElement || document.body).querySelector(':scope > canvas:not(#hydra-canvas)');
  if (hydraAudioCanvas) hydraAudioCanvas.id = 'audio-canvas';

  if (window.HydraliskPlugins) {
    window.HydraliskPlugins.init({ hydra: hydraInstance });
    window.HydraliskPlugins.onHydraReady(hydraInstance);
  }

  return hydraInstance;
}

export function hush() {
  if (typeof window.hush === 'function') window.hush();
}

/**
 * Evaluate Hydra code in the global scope (Hydra exposes its API globally).
 * Throws on evaluation errors.
 */
export function evaluate(code, sourceName = 'hydra-sketch') {
  hush();
  const wrappedCode = `(() => {
      ${code}
    })()
//# sourceURL=${sourceName}.js\n`;
  // Indirect eval runs in global scope where Hydra functions live.
  (0, eval)(wrappedCode);
}

/** Render a red error pattern after a failed evaluation. */
export function showErrorPattern() {
  hush();
  if (typeof window.osc === 'function') {
    window.osc(10, 0, 1.5).color(1, 0, 0).diff(window.noise(2)).out();
  }
}

/** Render the built-in fallback pattern. */
export function playFallbackPattern() {
  hush();
  if (typeof window.osc === 'function') {
    window.osc(10, 0.1, 1.2)
      .color(0.2, 0.7, 0.9)
      .rotate(0.1, 0.05)
      .out(typeof window.o0 !== 'undefined' ? window.o0 : undefined);
  }
}
