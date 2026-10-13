/**
 * Hydralisk Visual Player — entry point.
 * Bundled by Rollup into ./player.dist.js; React and ReactDOM are provided as
 * globals by ./react.min.js and ./react-dom.min.js.
 */
import React from 'react';
import { createRoot } from 'react-dom';
import { App } from './App.jsx';
import { store, getState, setState } from './store/playerStore.js';
import { exposeGlobalApi } from './globalApi.js';
import { bindEmitterEvents } from './services/emitterBridge.js';
import { notify as showToast } from './services/intercom.js';
import {
  startExperience, playSketch, toggleUI, openEditorWithCurrentSketch, shouldAutoLaunch
} from './actions/index.js';

exposeGlobalApi();

function mount() {
  bindEmitterEvents();
  if (shouldAutoLaunch()) setState({ splash: 'hidden' });

  const container = document.getElementById('player-root');
  createRoot(container).render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

export { store, getState, startExperience, showToast, playSketch, toggleUI, openEditorWithCurrentSketch };
