/**
 * Layout / HUD actions: tabs, sidebar, HUD visibility, touch overlay, fullscreen.
 */
import { getState, setState, selectIsUIHidden, selectCurrentSketch } from '../store/playerStore.js';
import { notify, notifyError } from '../services/intercom.js';
import { readString, writeString, PREF_KEYS } from '../services/preferences.js';

export const TABS = [
  { id: 'library', label: 'Library' },
  { id: 'editor', label: 'Editor' },
  { id: 'performance', label: 'Performance' }
];

export function isMobileDevice() {
  return window.matchMedia('(max-width: 768px)').matches ||
    ('ontouchstart' in window && window.innerWidth <= 1024) ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isUIHidden() {
  return selectIsUIHidden(getState());
}

export function switchTab(currentTab) {
  setState({ currentTab });
}

export function toggleCollapse() {
  setState((s) => ({ panelCollapsed: !s.panelCollapsed }));
}

/** Hide/show the whole HUD (sidebar + shortcuts guide). */
export function toggleUI() {
  if (isUIHidden()) {
    setState({ panelCollapsed: false, hudHidden: false });
    notify('Interface shown');
  } else {
    setState({ panelCollapsed: true, hudHidden: true });
    notify("Interface hidden. Press 'H' to show again.");
  }
}

export function setUIHidden(hidden) {
  if (hidden !== isUIHidden()) toggleUI();
}

export function updateViewport() {
  setState({ isMobile: isMobileDevice() });
}

/** On mobile, the touch overlay defaults to enabled unless the user turned it off. */
export function restoreTouchActionsPreference() {
  if (!isMobileDevice()) return;
  const saved = readString(PREF_KEYS.touchActions);
  setState({ touchActionsEnabled: saved === null ? true : saved === 'true' });
}

export function toggleTouchActions() {
  const touchActionsEnabled = !getState().touchActionsEnabled;
  setState({ touchActionsEnabled });
  writeString(PREF_KEYS.touchActions, touchActionsEnabled);
  notify(touchActionsEnabled ? 'Touch actions enabled' : 'Touch actions disabled');
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      notifyError(`Error enabling fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

export function openEditorWithCurrentSketch() {
  const sketchName = selectCurrentSketch(getState())?.name || readString(PREF_KEYS.lastSketch, '');
  window.location.href = sketchName ? `index.html?sketch=${encodeURIComponent(sketchName)}` : 'index.html';
}

export function toggleFeedback() {
  if (window.hydraFeedback) {
    window.hydraFeedback.toggle();
  } else if (window.xemitter) {
    window.xemitter.emit('feedback:toggle');
  }
}

export function openMidiMapping() {
  if (window.midiMapping) window.midiMapping.open();
}
