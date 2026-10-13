/**
 * Hydralisk Player State Store
 * Centralized state object for live performance player context.
 */

export const state = {
  hydraInstance: null,
  sketchesList: [],
  filteredSketchesList: [],
  currentSketchIndex: 0,
  isPlaying: false,
  currentTab: 'library',
  activeTags: new Set(),
  isPanelCollapsed: false,
  touchActionsEnabled: false,

  // BPM & Pitch bend state
  baseBpm: 120,

  // TAP tempo state
  tapTimes: [],

  // Mutation state & history
  automutateIntervalId: null,
  automutateMode: 'off',
  mutationHistory: [],
  mutationHistoryIndex: -1
};

export default state;
