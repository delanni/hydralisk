/**
 * Bridges the global `window.xemitter` bus (used by Hydralisk plugins such as
 * hydrakit, midi-mapping and editorActions) to player actions.
 * The SimpleEmitter has no `off`, so this must only be bound once.
 */
import {
  tapTempo, playNextSketch, playPrevSketch, playRandomSketch, triggerMutation, undoMutation,
  nudgeSpeed, resetSpeed, reverseSpeed, toggleUI, toggleFullscreen
} from '../actions/index.js';

let bound = false;

export function bindEmitterEvents(emitter = window.xemitter) {
  if (bound || !emitter) return;
  bound = true;

  emitter.on('taptempo', (data) => tapTempo(data));
  emitter.on('bpm:taptempo', (data) => tapTempo(data));
  emitter.on('gallery:nextSketch', () => playNextSketch());
  emitter.on('gallery:prevSketch', () => playPrevSketch());
  emitter.on('gallery:randomSketch', () => playRandomSketch());
  emitter.on('editor:randomize', () => triggerMutation());
  emitter.on('editor:jumpBack1', () => undoMutation());
  emitter.on('gfx:speedSlower', () => nudgeSpeed(-0.1));
  emitter.on('gfx:speedFaster', () => nudgeSpeed(0.1));
  emitter.on('gfx:speedDefault', () => resetSpeed({ announce: true }));
  emitter.on('gfx:speedReverse', () => reverseSpeed());
  emitter.on('hideAll', () => toggleUI());
  emitter.on('fullscreen', () => toggleFullscreen());
}
