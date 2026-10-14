/**
 * Hydralisk Player state.
 * Single source of truth for the player UI. Components read it through
 * `useStore`; actions (src/player/actions) are the only writers.
 */
import { createStore } from './createStore.js';

export const DEFAULT_BPM = 120;
export const MIN_BPM = 20;
export const MAX_BPM = 240;
export const MIN_SPEED = 0;
export const MAX_SPEED = 4;
export const MUTATION_HISTORY_LIMIT = 50;

export const initialState = {
  // Engine lifecycle
  splash: 'visible', // 'visible' | 'fading' | 'hidden'
  engineReady: false,
  isPlaying: false,

  // Sketch library
  sketches: [],
  currentSketchIndex: 0,
  searchQuery: '',
  activeTags: [],

  // Now playing / editor
  nowPlaying: null, // { name, author, bpm, tags, midi }
  editorCode: '',
  mutationPulse: 0,

  // Tempo & speed
  bpm: DEFAULT_BPM,
  baseBpm: DEFAULT_BPM,
  speed: 1.0,
  tapPulse: 0,

  // Automutate & mutation history
  automutateMode: 'off',
  selectedAutomutateMode: '1',
  mutationHistory: [],
  mutationHistoryIndex: -1,

  // Layout / HUD
  currentTab: 'library',
  panelCollapsed: false,
  hudHidden: false,
  isMobile: false,
  touchActionsEnabled: false,

  // Integrations
  midiAvailable: false,
  cloudAuthenticated: false,
  hashSettingsApplied: false
};

export const store = createStore(initialState);

export const getState = store.getState;
export const setState = store.setState;

// Derived selectors
export const selectCurrentSketch = (s) => s.sketches[s.currentSketchIndex] || null;

export const selectShortcutsHidden = (s) => s.hudHidden || s.isMobile;

export const selectIsUIHidden = (s) => s.panelCollapsed && selectShortcutsHidden(s);

export const selectExpandTriggerVisible = (s) => s.panelCollapsed && !s.hudHidden;

export const selectTouchOverlayVisible = (s) =>
  (s.isMobile || selectIsUIHidden(s)) && s.touchActionsEnabled;

export const selectCanUndo = (s) => s.mutationHistoryIndex > 0;

export const selectCanRedo = (s) => s.mutationHistoryIndex < s.mutationHistory.length - 1;

export const selectAllTags = (s) => {
  const tags = new Set();
  s.sketches.forEach((sketch) => (sketch.metadata?.tags || []).forEach((t) => tags.add(t)));
  return [...tags];
};
