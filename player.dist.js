var HydraliskPlayer = (function (exports, React, reactDom) {
  'use strict';

  /**
   * Minimal observable store.
   * Holds an immutable state snapshot and notifies subscribers on every change.
   * Designed to plug straight into React's `useSyncExternalStore`.
   */
  function createStore(initialState) {
    let state = initialState;
    const listeners = new Set();
    const getState = () => state;
    const setState = partial => {
      const patch = typeof partial === 'function' ? partial(state) : partial;
      if (!patch) return;
      const next = {
        ...state,
        ...patch
      };
      const changed = Object.keys(patch).some(key => !Object.is(state[key], next[key]));
      if (!changed) return;
      state = next;
      listeners.forEach(listener => listener());
    };
    const subscribe = listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    return {
      getState,
      setState,
      subscribe
    };
  }

  /**
   * Hydralisk Player state.
   * Single source of truth for the player UI. Components read it through
   * `useStore`; actions (src/player/actions) are the only writers.
   */
  const DEFAULT_BPM = 120;
  const MIN_BPM = 20;
  const MAX_BPM = 240;
  const MIN_SPEED = 0;
  const MAX_SPEED = 4;
  const MUTATION_HISTORY_LIMIT = 50;
  const initialState = {
    // Engine lifecycle
    splash: 'visible',
    // 'visible' | 'fading' | 'hidden'
    engineReady: false,
    isPlaying: false,
    // Sketch library
    sketches: [],
    currentSketchIndex: 0,
    searchQuery: '',
    activeTags: [],
    // Now playing / editor
    nowPlaying: null,
    // { name, author, bpm, tags, midi }
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
  const store = createStore(initialState);
  const getState = store.getState;
  const setState = store.setState;

  // Derived selectors
  const selectCurrentSketch = s => s.sketches[s.currentSketchIndex] || null;
  const selectShortcutsHidden = s => s.hudHidden || s.isMobile;
  const selectIsUIHidden = s => s.panelCollapsed && selectShortcutsHidden(s);
  const selectExpandTriggerVisible = s => s.panelCollapsed && !s.hudHidden;
  const selectTouchOverlayVisible = s => (s.isMobile || selectIsUIHidden(s)) && s.touchActionsEnabled;
  const selectCanUndo = s => s.mutationHistoryIndex > 0;
  const selectCanRedo = s => s.mutationHistoryIndex < s.mutationHistory.length - 1;
  const selectAllTags = s => {
    const tags = new Set();
    s.sketches.forEach(sketch => (sketch.metadata?.tags || []).forEach(t => tags.add(t)));
    return [...tags];
  };

  /**
   * Intercom notification service.
   * Queues ticker messages; the <IntercomBar> component drains the queue
   * and animates each message as a single-pass marquee.
   */

  const queue = [];
  const listeners = new Set();
  function notify(message, isError = false) {
    if (!message) return;
    queue.push({
      message: String(message),
      isError: Boolean(isError)
    });
    listeners.forEach(listener => listener());
  }
  function notifyError(error) {
    notify(error && error.message || error, true);
  }
  function takeNext() {
    return queue.shift() || null;
  }
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const roundTo = (value, decimals) => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  };
  const formatSpeed = speed => `${Number(speed || 0).toFixed(1)}x`;

  /**
   * Tempo & speed actions.
   * Hydra reads the globals `window.bpm` and `window.speed`; these actions keep
   * them in sync with the store.
   */
  function setBpm(bpm) {
    window.bpm = bpm;
    setState({
      bpm,
      baseBpm: bpm
    });
  }
  function setBpmFromInput(rawValue) {
    setBpm(clamp(parseInt(rawValue, 10) || DEFAULT_BPM, MIN_BPM, MAX_BPM));
  }
  function nudgeTempo(delta) {
    const current = getState().bpm || DEFAULT_BPM;
    setBpm(clamp(current + delta, MIN_BPM, MAX_BPM));
  }

  /** Temporarily bend the tempo by a percentage of the base BPM (pitch fader). */
  function bendTempo(offsetPercent) {
    const bent = Math.round(getState().baseBpm * (1 + offsetPercent / 100));
    window.bpm = bent;
    setState({
      bpm: bent
    });
  }

  /** Release the pitch fader: the bent tempo becomes the new base. */
  function releaseTempoBend() {
    setState({
      baseBpm: window.bpm || DEFAULT_BPM
    });
  }

  /**
   * Tap tempo. Called with `{ bpm }` when the shared TapTempo engine reports a
   * new tempo, or without arguments when the user taps.
   */
  function tapTempo(evt = {}) {
    if (evt && typeof evt.bpm === 'number') {
      setBpm(evt.bpm);
      notify(`Tap Tempo: ${evt.bpm} BPM`);
      return;
    }
    if (window.tapTempo && typeof window.tapTempo.tap === 'function') {
      window.tapTempo.tap();
    } else if (window.xemitter) {
      window.xemitter.emit('taptempo');
    }
    setState(s => ({
      tapPulse: s.tapPulse + 1
    }));
  }
  function setSpeed(speed) {
    if (getState().isPlaying) window.speed = speed;
    setState({
      speed
    });
  }
  function nudgeSpeed(delta) {
    setSpeed(roundTo(clamp(getState().speed + delta, MIN_SPEED, MAX_SPEED), 1));
  }
  function resetSpeed({
    announce = false
  } = {}) {
    window.speed = 1.0;
    setState({
      speed: 1.0
    });
    if (announce) notify('Speed: 1.0x');
  }
  function reverseSpeed() {
    window.speed = -1 * (window.speed || 1.0);
    setState({
      speed: window.speed
    });
    notify(`Speed: ${window.speed.toFixed(1)}x`);
  }

  /**
   * Hydra engine service.
   * Owns the Hydra synth instance and the evaluation of sketch code on the canvas.
   */

  let canvasEl = null;
  let hydraInstance = null;
  const FALLBACK_SKETCH = {
    name: 'Default Oscillation',
    author: 'System',
    bpm: 120,
    code: 'osc(10, 0.1, 1.2).color(0.2, 0.7, 0.9).rotate(0.1, 0.05).out(o0);'
  };
  function registerCanvas(el) {
    canvasEl = el;
  }
  function getHydra() {
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
  function initHydra() {
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
      window.HydraliskPlugins.init({
        hydra: hydraInstance
      });
      window.HydraliskPlugins.onHydraReady(hydraInstance);
    }
    return hydraInstance;
  }
  function hush() {
    if (typeof window.hush === 'function') window.hush();
  }

  /**
   * Evaluate Hydra code in the global scope (Hydra exposes its API globally).
   * Throws on evaluation errors.
   */
  function evaluate(code, sourceName = 'hydra-sketch') {
    hush();
    const wrappedCode = `(() => {
      ${code}
    })()
//# sourceURL=${sourceName}.js\n`;
    // Indirect eval runs in global scope where Hydra functions live.
    (0, eval)(wrappedCode);
  }

  /** Render a red error pattern after a failed evaluation. */
  function showErrorPattern() {
    hush();
    if (typeof window.osc === 'function') {
      window.osc(10, 0, 1.5).color(1, 0, 0).diff(window.noise(2)).out();
    }
  }

  /** Render the built-in fallback pattern. */
  function playFallbackPattern() {
    hush();
    if (typeof window.osc === 'function') {
      window.osc(10, 0.1, 1.2).color(0.2, 0.7, 0.9).rotate(0.1, 0.05).out(typeof window.o0 !== 'undefined' ? window.o0 : undefined);
    }
  }

  /**
   * Code mutator.
   * Pure function that randomly swaps a Hydra function for a sibling of the same
   * category, or perturbs a numeric literal.
   */

  const CATEGORIES = {
    sources: ['osc', 'shape', 'noise', 'voronoi', 'gradient', 'solid'],
    geometry: ['rotate', 'scale', 'pixelate', 'repeat', 'repeatX', 'repeatY', 'kaleid', 'scroll', 'scrollX', 'scrollY'],
    color: ['posterize', 'shift', 'invert', 'contrast', 'luma', 'thresh', 'color', 'saturate', 'hue', 'colorama'],
    blends: ['add', 'sub', 'mult', 'diff', 'blend', 'mask'],
    modulators: ['modulate', 'modulateScale', 'modulatePixelate', 'modulateRotate', 'modulateKaleid', 'modulateScrollX', 'modulateScrollY', 'modulateHue']
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  function mutateFunction(code) {
    const found = [];
    Object.entries(CATEGORIES).forEach(([category, funcs]) => {
      funcs.forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        let match;
        while ((match = regex.exec(code)) !== null) {
          found.push({
            name,
            index: match.index,
            category
          });
        }
      });
    });
    if (found.length === 0) return null;
    const selected = pick(found);
    const others = CATEGORIES[selected.category].filter(f => f !== selected.name);
    if (others.length === 0) return null;
    const become = pick(others);
    console.log(`Mutator: changing function ${selected.name} to ${become}`);
    return code.substring(0, selected.index) + become + code.substring(selected.index + selected.name.length);
  }
  function mutateNumber(code) {
    const numRegex = /(?<![\w'"`])(?:\b-?\d+(?:\.\d+)?\b)/g;
    const matches = [...code.matchAll(numRegex)];
    if (matches.length === 0) return code;
    const selected = pick(matches);
    const oldStr = selected[0];
    const oldVal = parseFloat(oldStr);
    const newVal = oldVal === 0 ? Math.random() > 0.5 ? 0.5 : -0.5 : Math.round(Math.random() * oldVal * 2 * 1000) / 1000;
    console.log(`Mutator: changing number ${oldStr} to ${newVal}`);
    return code.substring(0, selected.index) + String(newVal) + code.substring(selected.index + oldStr.length);
  }
  function mutateCode(code, changeTransform = false) {
    if (changeTransform) {
      const mutated = mutateFunction(code);
      if (mutated !== null) return mutated;
    }
    return mutateNumber(code);
  }

  /**
   * Automutate & mutation history actions.
   * The automutate clock itself lives in the `useAutomutateClock` hook, which
   * re-schedules whenever the mode or the BPM changes.
   */
  const AUTOMUTATE_MODES = [{
    mode: 'off',
    label: 'Off'
  }, {
    mode: '1',
    label: '1b',
    title: '1x per beat'
  }, {
    mode: '2',
    label: '2b',
    title: '1x per 1/2 bar (2 beats)'
  }, {
    mode: '4',
    label: '4b',
    title: '1x per 1 bar (4 beats)'
  }, {
    mode: '8',
    label: '8b',
    title: '1x per 2 bars (8 beats)'
  }, {
    mode: '16',
    label: '16b',
    title: '1x per 4 bars (16 beats)'
  }];
  function beatsForMode(mode) {
    const beats = parseInt(mode, 10);
    return [1, 2, 4, 8, 16].includes(beats) ? beats : 1;
  }
  function setAutomutateMode(mode, quiet = false) {
    setState(s => ({
      automutateMode: mode,
      selectedAutomutateMode: mode !== 'off' ? mode : s.selectedAutomutateMode
    }));
    if (quiet) return;
    if (mode === 'off') {
      notify('Auto-Mutate disabled');
    } else {
      const beats = beatsForMode(mode);
      notify(`Auto-Mutate active (every ${beats === 1 ? 'beat' : beats + ' beats'})`);
    }
  }
  function toggleMobileAutomutate() {
    const {
      automutateMode,
      selectedAutomutateMode
    } = getState();
    setAutomutateMode(automutateMode === 'off' ? selectedAutomutateMode : 'off');
  }

  /** Start a fresh history for a newly loaded sketch. */
  function resetMutationHistory(code) {
    setState({
      mutationHistory: [code],
      mutationHistoryIndex: 0
    });
  }
  function pushMutationHistory(code) {
    const {
      mutationHistory,
      mutationHistoryIndex
    } = getState();
    const history = mutationHistory.slice(0, mutationHistoryIndex + 1);
    history.push(code);
    if (history.length > MUTATION_HISTORY_LIMIT) history.shift();
    setState({
      mutationHistory: history,
      mutationHistoryIndex: history.length - 1
    });
  }
  function triggerMutation() {
    const currentCode = getState().editorCode;
    const newCode = mutateCode(currentCode, Math.random() > 0.5);
    if (newCode === currentCode) return;
    try {
      evaluate(newCode, 'hydra-mutated-sketch');
      setState(s => ({
        editorCode: newCode,
        mutationPulse: s.mutationPulse + 1
      }));
      pushMutationHistory(newCode);
    } catch (err) {
      console.error('Mutation evaluation failed:', err);
    }
  }
  function jumpHistory(offset, message) {
    const {
      mutationHistory,
      mutationHistoryIndex
    } = getState();
    const index = mutationHistoryIndex + offset;
    if (index < 0 || index >= mutationHistory.length) return;
    const code = mutationHistory[index];
    setState({
      mutationHistoryIndex: index
    });
    evaluate(code, 'hydra-mutated-sketch');
    setState({
      editorCode: code
    });
    notify(message);
  }
  const undoMutation = () => jumpHistory(-1, 'Mutation undone');
  const redoMutation = () => jumpHistory(1, 'Mutation redone');

  /**
   * Safe localStorage helpers (storage may be unavailable, e.g. private mode).
   */

  function readString(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }
  function writeString(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {}
  }
  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
  function readJSON(key, fallback) {
    const raw = readString(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`Could not parse ${key} from localStorage`, e);
      return fallback;
    }
  }
  const PREF_KEYS = {
    lastSketch: 'lastSelectedSketchName',
    welcomeClosed: 'welcomeScreenClosed',
    touchActions: 'touchActionsEnabled',
    awsCredentials: 'awsCredentials'
  };

  /**
   * Sketch repository.
   * Loads sketches from Cloud drafts (Amakit), sketches.json and localStorage,
   * then merges them by name into a normalized list.
   */
  const PLACEHOLDER_SKETCH = {
    name: 'Nebula Glitch',
    author: 'Hydra Synth',
    bpm: 120,
    code: 'osc(40, 0.05, 1.5).modulate(noise(4), 0.5).colorama(0.4).out(o0);',
    metadata: {
      tags: ['glitch', 'colorful']
    }
  };
  async function fetchCloudSketches() {
    const amakit = window.amakit;
    if (!amakit || !amakit.isAuthenticated) return [];
    try {
      notify('Syncing sketches from Cloud...');
      await amakit.loadDrafts();
      const drafts = amakit.draftCache || [];
      notify(`Loaded ${drafts.length} remote sketches`);
      return drafts;
    } catch (e) {
      console.error('Failed to load drafts from Amakit', e);
      notify('Cloud sync failed. Loading backup.', true);
      return [];
    }
  }
  async function fetchBuiltInSketches() {
    try {
      const response = await fetch('sketches.json');
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn('Could not fetch sketches.json', e);
    }
    return [];
  }
  function normalizeRemote(sketch) {
    const metadata = sketch.metadata || {
      tags: []
    };
    return {
      ...sketch,
      isLocal: false,
      author: sketch.author || 'Hydralisk Team',
      bpm: sketch.bpm || 120,
      metadata: {
        ...metadata,
        tags: metadata.tags || []
      }
    };
  }
  function normalizeLocal(sketch) {
    const metadata = sketch.metadata || {
      tags: ['local']
    };
    let code = sketch.code;
    if (!code && sketch.fullDraft) {
      try {
        code = atob(sketch.fullDraft);
      } catch (e) {
        code = sketch.fullDraft;
      }
    }
    return {
      ...sketch,
      code,
      isLocal: true,
      author: sketch.author || 'You (Local)',
      bpm: sketch.bpm || 120,
      metadata: {
        ...metadata,
        tags: metadata.tags || ['local']
      }
    };
  }
  async function loadAllSketches() {
    let sourceSketches = await fetchCloudSketches();
    if (sourceSketches.length === 0) {
      sourceSketches = await fetchBuiltInSketches();
    }
    const localSketches = readJSON('mySketches', []);
    const merged = {};
    sourceSketches.forEach(s => {
      const sketch = normalizeRemote(s);
      merged[sketch.name] = sketch;
    });
    (Array.isArray(localSketches) ? localSketches : []).forEach(s => {
      const sketch = normalizeLocal(s);
      merged[sketch.name] = sketch;
    });
    const sketches = Object.values(merged);
    return sketches.length > 0 ? sketches : [PLACEHOLDER_SKETCH];
  }
  function findSketchIndexByName(sketches, name) {
    if (!name) return -1;
    const target = name.toLowerCase();
    return sketches.findIndex(s => s.name && s.name.toLowerCase() === target);
  }
  function filterSketches(sketches, query, activeTags) {
    const q = (query || '').toLowerCase();
    return sketches.filter(s => {
      const nameMatch = (s.name || '').toLowerCase().includes(q) || (s.author || '').toLowerCase().includes(q);
      const tagMatch = activeTags.length === 0 || (s.metadata?.tags || []).some(t => activeTags.includes(t));
      return nameMatch && tagMatch;
    });
  }

  /**
   * Sketch playback actions: selecting, navigating and evaluating sketches.
   */
  const toNowPlaying = sketch => ({
    name: sketch.name,
    author: sketch.author,
    bpm: sketch.bpm || 120,
    tags: sketch.metadata?.tags || [],
    midi: Boolean(sketch.midi)
  });
  const sourceNameFor = sketch => `hydra-sketch-${sketch.name.replace(/\s+/g, '-').toLowerCase()}`;
  function rememberSketch(name) {
    writeString(PREF_KEYS.lastSketch, name);
    try {
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.set('sketch', name);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {}
  }

  /**
   * Play a sketch by index in the full list, or by (case-insensitive) name.
   */
  function playSketch(indexOrName) {
    const {
      sketches
    } = getState();
    let index = indexOrName;
    if (typeof index === 'string') {
      index = findSketchIndexByName(sketches, indexOrName);
      if (index < 0) {
        console.warn(`Sketch not found: ${indexOrName}`);
        return;
      }
    }
    if (typeof index !== 'number' || index < 0 || index >= sketches.length) return;
    const sketch = sketches[index];
    if (sketch.name) rememberSketch(sketch.name);
    setState({
      currentSketchIndex: index
    });
    setBpm(sketch.bpm || 120);
    resetSpeed();
    resetMutationHistory(sketch.code);
    try {
      evaluate(sketch.code, sourceNameFor(sketch));
      setState({
        nowPlaying: toNowPlaying(sketch),
        editorCode: sketch.code || ''
      });
      notify(`Loaded: ${sketch.name}`);
    } catch (err) {
      console.error('Evaluation error:', err);
      notifyError(err);
      showErrorPattern();
    }
  }
  function playPrevSketch() {
    const {
      sketches,
      currentSketchIndex
    } = getState();
    if (sketches.length === 0) return;
    playSketch(currentSketchIndex - 1 < 0 ? sketches.length - 1 : currentSketchIndex - 1);
  }
  function playNextSketch() {
    const {
      sketches,
      currentSketchIndex
    } = getState();
    if (sketches.length === 0) return;
    playSketch((currentSketchIndex + 1) % sketches.length);
  }
  function playRandomSketch() {
    const {
      sketches
    } = getState();
    if (sketches.length === 0) return;
    playSketch(Math.floor(Math.random() * sketches.length));
  }
  function playFallbackSketch() {
    playFallbackPattern();
    setState({
      nowPlaying: toNowPlaying(FALLBACK_SKETCH),
      editorCode: FALLBACK_SKETCH.code
    });
  }
  function togglePlayPause() {
    if (!getHydra()) return;
    const isPlaying = !getState().isPlaying;
    setState({
      isPlaying
    });
    if (isPlaying) {
      window.speed = getState().speed || 1.0;
      notify('Visuals resumed');
    } else {
      window.speed = 0;
      notify('Visuals paused');
    }
  }
  function setEditorCode(code) {
    setState({
      editorCode: code
    });
  }

  /** Evaluate the code currently in the editor tab. */
  function runCustomCode() {
    const code = getState().editorCode;
    try {
      evaluate(code, 'hydra-custom-sketch');
      notify('Code updated & running');
      setState(s => ({
        nowPlaying: {
          ...(s.nowPlaying || {}),
          name: 'Custom Edit',
          author: 'Developer Session'
        }
      }));
      pushMutationHistory(code);
    } catch (err) {
      console.error('Evaluation error:', err);
      notifyError(err);
      showErrorPattern();
    }
  }

  /** Restore and replay the original code of the active sketch. */
  function resetCustomCode() {
    const sketch = selectCurrentSketch(getState());
    if (!sketch) return;
    setState({
      editorCode: sketch.code
    });
    playSketch(getState().currentSketchIndex);
    notify('Sketch code reset');
  }

  /**
   * Library browsing actions: search and tag filtering.
   */
  async function reloadSketches() {
    const sketches = await loadAllSketches();
    setState({
      sketches
    });
    return sketches;
  }
  function setSearchQuery(searchQuery) {
    setState({
      searchQuery
    });
  }
  function toggleTag(tag) {
    setState(s => ({
      activeTags: s.activeTags.includes(tag) ? s.activeTags.filter(t => t !== tag) : [...s.activeTags, tag]
    }));
  }
  function clearTags() {
    setState({
      activeTags: []
    });
  }

  /**
   * Layout / HUD actions: tabs, sidebar, HUD visibility, touch overlay, fullscreen.
   */
  const TABS = [{
    id: 'library',
    label: 'Library'
  }, {
    id: 'editor',
    label: 'Editor'
  }, {
    id: 'performance',
    label: 'Performance'
  }];
  function isMobileDevice() {
    return window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window && window.innerWidth <= 1024 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  function isUIHidden() {
    return selectIsUIHidden(getState());
  }
  function switchTab(currentTab) {
    setState({
      currentTab
    });
  }
  function toggleCollapse() {
    setState(s => ({
      panelCollapsed: !s.panelCollapsed
    }));
  }

  /** Hide/show the whole HUD (sidebar + shortcuts guide). */
  function toggleUI() {
    if (isUIHidden()) {
      setState({
        panelCollapsed: false,
        hudHidden: false
      });
      notify('Interface shown');
    } else {
      setState({
        panelCollapsed: true,
        hudHidden: true
      });
      notify("Interface hidden. Press 'H' to show again.");
    }
  }
  function setUIHidden(hidden) {
    if (hidden !== isUIHidden()) toggleUI();
  }
  function updateViewport() {
    setState({
      isMobile: isMobileDevice()
    });
  }

  /** On mobile, the touch overlay defaults to enabled unless the user turned it off. */
  function restoreTouchActionsPreference() {
    if (!isMobileDevice()) return;
    const saved = readString(PREF_KEYS.touchActions);
    setState({
      touchActionsEnabled: saved === null ? true : saved === 'true'
    });
  }
  function toggleTouchActions() {
    const touchActionsEnabled = !getState().touchActionsEnabled;
    setState({
      touchActionsEnabled
    });
    writeString(PREF_KEYS.touchActions, touchActionsEnabled);
    notify(touchActionsEnabled ? 'Touch actions enabled' : 'Touch actions disabled');
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        notifyError(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
  function openEditorWithCurrentSketch() {
    const sketchName = selectCurrentSketch(getState())?.name || readString(PREF_KEYS.lastSketch, '');
    window.location.href = sketchName ? `index.html?sketch=${encodeURIComponent(sketchName)}` : 'index.html';
  }
  function toggleFeedback() {
    if (window.hydraFeedback) {
      window.hydraFeedback.toggle();
    } else if (window.xemitter) {
      window.xemitter.emit('feedback:toggle');
    }
  }
  function openMidiMapping() {
    if (window.midiMapping) window.midiMapping.open();
  }

  /**
   * Cloud (Amakit) authentication service.
   */
  function isCloudAvailable() {
    return Boolean(window.amakit);
  }

  /** Resolve to true if stored credentials can log in silently. */
  async function restoreSession() {
    const amakit = window.amakit;
    if (!amakit || !amakit.getCredentials()) return false;
    try {
      await amakit.login(false);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Interactive login; rejects on failure. */
  function login() {
    return window.amakit.login(true);
  }
  function logout() {
    remove(PREF_KEYS.awsCredentials);
    if (window.amakit) window.amakit.isAuthenticated = false;
  }

  /**
   * Cloud synchronisation actions.
   */
  async function restoreCloudSession() {
    if (!isCloudAvailable()) return;
    setState({
      cloudAuthenticated: await restoreSession()
    });
  }
  function loginToCloud() {
    if (!isCloudAvailable()) {
      notifyError('Amakit module not loaded');
      return;
    }
    login().then(() => {
      notify('Successfully authenticated with Cloud!');
      setState({
        cloudAuthenticated: true
      });
      reloadSketches();
    }).catch(err => {
      notifyError(err || 'Login failed');
      setState({
        cloudAuthenticated: false
      });
    });
  }
  function logoutFromCloud() {
    logout();
    setState({
      cloudAuthenticated: false
    });
    notify('Disconnected from Cloud');
    reloadSketches();
  }

  /**
   * Performance State Hash Fragment Settings Module for Hydralisk
   * Encodes/decodes player performance state (BPM, HUD visibility, Automutate mode, Speed)
   * Protocol format: #(<key>[a-z])(<value>[a-z0-9][0-9]*)|(<key>[a-z])(<value>[a-z0-9][0-9]*)
   */

  class PlayerSettings {
    constructor() {
      this.keyMap = {
        b: "bpm",
        h: "hud",
        m: "automutate",
        s: "speed"
      };
      this.reverseKeyMap = {
        bpm: "b",
        hud: "h",
        automutate: "m",
        speed: "s"
      };
    }

    /**
     * Decode URL fragment string into a settings object
     * @param {string} hashStr e.g. "#b120|h1|m4|s10"
     * @returns {object} decoded settings object e.g. { bpm: 120, hud: 1, automutate: '4', speed: 1.0 }
     */
    decode(hashStr = typeof window !== "undefined" ? window.location.hash : "") {
      const settings = {};
      if (!hashStr) return settings;
      let raw = hashStr.startsWith("#") ? hashStr.substring(1) : hashStr;
      if (!raw) return settings;
      const pairs = raw.split("|");
      for (const pair of pairs) {
        if (!pair) continue;
        // Match protocol: key [a-z] followed by value [a-z0-9][0-9]*
        const match = pair.match(/^([a-z])([a-z0-9][0-9]*)$/i);
        if (match) {
          const keyChar = match[1].toLowerCase();
          const rawVal = match[2];
          const settingsKey = this.keyMap[keyChar] || keyChar;
          if (settingsKey === "bpm") {
            const num = parseInt(rawVal, 10);
            if (!isNaN(num)) settings[settingsKey] = num;
          } else if (settingsKey === "hud") {
            settings[settingsKey] = rawVal === "1" ? 1 : 0;
          } else if (settingsKey === "automutate") {
            settings[settingsKey] = rawVal;
          } else if (settingsKey === "speed") {
            const num = parseInt(rawVal, 10);
            if (!isNaN(num)) settings[settingsKey] = num / 10;
          } else {
            settings[settingsKey] = rawVal;
          }
        }
      }
      return settings;
    }

    /**
     * Encode settings object into a URL fragment string
     * @param {object} settings e.g. { bpm: 120, hud: 1, automutate: '4', speed: 1.0 }
     * @returns {string} e.g. "#b120|h1|m4|s10"
     */
    encode(settings = {}) {
      const pairs = [];
      if (typeof settings.bpm === "number" && !isNaN(settings.bpm)) {
        pairs.push(`b${settings.bpm}`);
      }
      if (typeof settings.hud !== "undefined") {
        pairs.push(`h${settings.hud ? 1 : 0}`);
      }
      if (settings.automutate) {
        pairs.push(`m${settings.automutate}`);
      }
      if (typeof settings.speed === "number" && !isNaN(settings.speed)) {
        const speedVal = Math.round(settings.speed * 10);
        pairs.push(`s${speedVal}`);
      }
      return "#" + pairs.join("|");
    }

    /**
     * Update browser location.hash with current settings without reloading/scrolling
     * @param {object} settings
     */
    syncToHash(settings = {}) {
      if (typeof window === "undefined" || !window.history || !window.history.replaceState) return;
      const hash = this.encode(settings);
      const url = new URL(window.location);
      url.hash = hash;
      window.history.replaceState(null, "", url.toString());
    }
  }

  // Instantiate singleton
  const playerSettings = new PlayerSettings();
  if (typeof window !== "undefined") {
    window.playerSettings = playerSettings;
    if (window.HydraliskPlugins) {
      window.HydraliskPlugins.register({
        id: "player-settings",
        name: "Player Performance State Fragment Encoder/Decoder",
        init(app) {
          app.expose("playerSettings", playerSettings);
        }
      });
    }
  }

  /**
   * URL hash performance settings (protocol: #b120|h1|m4|s10).
   * Thin wrapper around the shared PlayerSettings codec from modules/settings.js.
   */
  function readHashSettings() {
    return playerSettings.decode(window.location.hash);
  }
  function writeHashSettings({
    bpm,
    hud,
    automutate,
    speed
  }) {
    playerSettings.syncToHash({
      bpm,
      hud,
      automutate,
      speed
    });
  }

  /**
   * Player lifecycle: engine start-up and URL hash settings.
   */
  const SPLASH_FADE_MS = 500;
  function shouldAutoLaunch() {
    return readString(PREF_KEYS.welcomeClosed) === 'true';
  }

  /** Apply performance settings encoded in the URL hash (#b120|h1|m4|s10). */
  function applyHashSettings() {
    const settings = readHashSettings();
    if (typeof settings.bpm === 'number') setBpm(settings.bpm);
    if (typeof settings.hud === 'number') setUIHidden(settings.hud === 0);
    if (settings.automutate) setAutomutateMode(settings.automutate, true);
    if (typeof settings.speed === 'number') {
      window.speed = settings.speed;
      setState({
        speed: settings.speed
      });
    }
    setState({
      hashSettingsApplied: true
    });
  }
  function pickInitialSketchIndex(sketches) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetName = urlParams.get('sketch') || readString(PREF_KEYS.lastSketch);
    return Math.max(0, findSketchIndexByName(sketches, targetName));
  }

  /** Initialise Hydra, load the library and start playing. */
  async function startExperience() {
    if (getState().engineReady) return;
    try {
      initHydra();
      setState({
        engineReady: true
      });
      writeString(PREF_KEYS.welcomeClosed, 'true');
      if (getState().splash === 'visible') setState({
        splash: 'fading'
      });
      setTimeout(() => {
        setState({
          splash: 'hidden',
          isPlaying: true
        });
        if (window.xemitter) window.xemitter.emit('engine:ready');
      }, SPLASH_FADE_MS);
      const sketches = await reloadSketches();
      if (sketches.length > 0) {
        playSketch(pickInitialSketchIndex(sketches));
      } else {
        playFallbackSketch();
      }
      applyHashSettings();
      window.addEventListener('hashchange', applyHashSettings);
      notify('Visual engine initialized successfully');
    } catch (err) {
      console.error(err);
      notifyError(err);
    }
  }

  const KEY_BINDINGS = {
    ArrowLeft: {
      action: playPrevSketch,
      preventDefault: true
    },
    ArrowRight: {
      action: playNextSketch,
      preventDefault: true
    },
    KeyR: {
      action: playRandomSketch
    },
    KeyH: {
      action: toggleUI
    },
    KeyT: {
      action: toggleTouchActions
    },
    KeyF: {
      action: toggleFullscreen
    }
  };

  /** Global single-key performance shortcuts (ignored while typing). */
  function useHotkeys() {
    React.useEffect(() => {
      const onKeyDown = e => {
        const tag = document.activeElement?.tagName;
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (e.repeat) return;
        const binding = KEY_BINDINGS[e.code];
        if (!binding) return;
        if (binding.preventDefault) e.preventDefault();
        binding.action();
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, []);
  }

  /**
   * Tracks mobile mode and exposes the visual viewport width as a CSS variable.
   * Mobile browsers can keep a wider layout viewport than the visible one, so the
   * touch sheet is sized from the visual viewport to avoid trailing off-screen.
   */
  function useViewport() {
    React.useEffect(() => {
      const update = () => {
        const width = window.visualViewport?.width || document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--player-viewport-width', `${width}px`);
        updateViewport();
      };
      update();
      window.addEventListener('resize', update);
      window.visualViewport?.addEventListener('resize', update);
      return () => {
        window.removeEventListener('resize', update);
        window.visualViewport?.removeEventListener('resize', update);
      };
    }, []);
  }

  /**
   * Subscribe a component to a slice of the player store.
   * The selector must return a stable value (primitive or a reference held in state)
   * so React can skip re-renders when the slice is unchanged.
   */
  function useStore(selector) {
    return React.useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  }

  /** Runs `triggerMutation` on a beat-synced interval while automutate is on. */
  function useAutomutateClock() {
    const mode = useStore(s => s.automutateMode);
    const bpm = useStore(s => s.bpm);
    React.useEffect(() => {
      if (mode === 'off') return undefined;
      const msPerBeat = 60000 / (bpm || DEFAULT_BPM);
      const id = setInterval(triggerMutation, msPerBeat * beatsForMode(mode));
      return () => clearInterval(id);
    }, [mode, bpm]);
  }

  /**
   * Mirrors live performance settings into the URL hash (#b120|h1|m4|s10).
   * Starts only after the incoming hash has been applied, so it is never overwritten.
   */
  function useHashSync() {
    const ready = useStore(s => s.hashSettingsApplied);
    const bpm = useStore(s => s.bpm);
    const hidden = useStore(selectIsUIHidden);
    const automutate = useStore(s => s.automutateMode);
    const speed = useStore(s => s.speed);
    React.useEffect(() => {
      if (!ready) return;
      writeHashSettings({
        bpm,
        hud: hidden ? 0 : 1,
        automutate,
        speed: speed || 1.0
      });
    }, [ready, bpm, hidden, automutate, speed]);
  }

  /** Flags MIDI availability once the browser grants Web MIDI access. */
  function useMidiAccess() {
    React.useEffect(() => {
      if (!navigator.requestMIDIAccess) return;
      navigator.requestMIDIAccess().then(() => setState({
        midiAvailable: true
      })).catch(() => {});
    }, []);
  }

  /** Launch screen: the click gesture unlocks AudioContext & WebMIDI. */
  function SplashScreen() {
    const splash = useStore(s => s.splash);
    if (splash === 'hidden') return null;
    return /*#__PURE__*/React.createElement("div", {
      id: "splash-screen",
      className: "splash-screen",
      style: splash === 'fading' ? {
        opacity: 0
      } : undefined
    }, /*#__PURE__*/React.createElement("div", {
      className: "splash-card"
    }, /*#__PURE__*/React.createElement("h1", {
      className: "splash-logo"
    }, "HYDRALISK"), /*#__PURE__*/React.createElement("p", {
      className: "splash-description"
    }, "A dedicated presentation player for live-coded Hydra visuals. Feed scripts directly to the canvas, map physical MIDI controls, and run audio-reactive synthesizers in fullscreen."), /*#__PURE__*/React.createElement("button", {
      id: "start-experience-btn",
      className: "start-btn",
      onClick: startExperience
    }, "Launch Player & Engine"), /*#__PURE__*/React.createElement("div", {
      className: "splash-footer"
    }, "Requires microphone access for audio-reactive visuals.")));
  }

  /** Fullscreen background canvas Hydra renders into. */
  function HydraCanvas() {
    const ref = React.useCallback(el => {
      if (el) registerCanvas(el);
    }, []);
    return /*#__PURE__*/React.createElement("canvas", {
      id: "hydra-canvas",
      ref: ref
    });
  }

  /** Join truthy class names. */
  const cx = (...classes) => classes.filter(Boolean).join(' ');

  const SCROLL_SPEED_PX_PER_SEC = 140;
  const MIN_DURATION_SEC = 2.2;
  const GAP_BETWEEN_MESSAGES_MS = 150;

  /** Thin top ticker that scrolls queued intercom messages one at a time. */
  function IntercomBar() {
    const hidden = useStore(selectIsUIHidden);
    const [current, setCurrent] = React.useState(null);
    const busyRef = React.useRef(false);
    const viewportRef = React.useRef(null);
    const trackRef = React.useRef(null);
    const pump = React.useCallback(() => {
      if (busyRef.current) return;
      const next = takeNext();
      busyRef.current = Boolean(next);
      setCurrent(next);
    }, []);
    React.useEffect(() => {
      pump();
      return subscribe(pump);
    }, [pump]);
    React.useLayoutEffect(() => {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return undefined;
      if (!current) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        return undefined;
      }
      const viewportWidth = viewport.offsetWidth || window.innerWidth;
      const textWidth = track.offsetWidth || current.message.length * 8;
      const startX = viewportWidth;
      const endX = -textWidth - 20;
      const durationSec = Math.max(MIN_DURATION_SEC, (startX - endX) / SCROLL_SPEED_PX_PER_SEC);
      track.style.transition = 'none';
      track.style.transform = `translateX(${startX}px)`;
      void track.offsetWidth; // force reflow before starting the transition
      track.style.transition = `transform ${durationSec}s linear`;
      track.style.transform = `translateX(${endX}px)`;
      let ended = false;
      let gapTimer = null;
      const onEnd = () => {
        if (ended) return;
        ended = true;
        clearTimeout(fallbackTimer);
        track.removeEventListener('transitionend', onEnd);
        gapTimer = setTimeout(() => {
          busyRef.current = false;
          pump();
        }, GAP_BETWEEN_MESSAGES_MS);
      };
      track.addEventListener('transitionend', onEnd);
      const fallbackTimer = setTimeout(onEnd, durationSec * 1000 + 200);
      return () => {
        clearTimeout(fallbackTimer);
        clearTimeout(gapTimer);
        track.removeEventListener('transitionend', onEnd);
      };
    }, [current, pump]);
    const isError = Boolean(current?.isError);
    return /*#__PURE__*/React.createElement("div", {
      id: "intercom-bar",
      className: cx('intercom-bar', hidden && 'hidden')
    }, /*#__PURE__*/React.createElement("div", {
      id: "intercom-badge",
      className: cx('intercom-badge', isError && 'error')
    }, isError ? 'HYDRA // ERR' : 'HYDRA // SYS'), /*#__PURE__*/React.createElement("div", {
      id: "intercom-viewport",
      className: "intercom-viewport",
      ref: viewportRef
    }, /*#__PURE__*/React.createElement("div", {
      id: "intercom-track",
      className: cx('intercom-track', isError && 'error'),
      ref: trackRef
    }, current ? current.message : '')));
  }

  const Svg = ({
    size = 18,
    filled = true,
    children
  }) => /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? undefined : 'currentColor',
    strokeWidth: filled ? undefined : 2
  }, children);
  const ChevronRightIcon = ({
    size = 20
  }) => /*#__PURE__*/React.createElement(Svg, {
    size: size,
    filled: false
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 18l6-6-6-6"
  }));
  const ChevronLeftIcon = ({
    size = 18
  }) => /*#__PURE__*/React.createElement(Svg, {
    size: size,
    filled: false
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 18l-6-6 6-6"
  }));
  const PrevIcon = () => /*#__PURE__*/React.createElement(Svg, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 6h2v12H6zm3.5 6l8.5 6V6z"
  }));
  const NextIcon = () => /*#__PURE__*/React.createElement(Svg, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"
  }));
  const PlayIcon = () => /*#__PURE__*/React.createElement(Svg, null, /*#__PURE__*/React.createElement("path", {
    d: "M8 5v14l11-7z"
  }));
  const PauseIcon = () => /*#__PURE__*/React.createElement(Svg, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 19h4V5H6v14zm8-14v14h4V5h-4z"
  }));
  const ShuffleIcon = () => /*#__PURE__*/React.createElement(Svg, null, /*#__PURE__*/React.createElement("path", {
    d: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
  }));

  /** Floating button that re-opens the collapsed sidebar. */
  function ExpandTrigger() {
    const visible = useStore(selectExpandTriggerVisible);
    return /*#__PURE__*/React.createElement("div", {
      id: "expand-trigger",
      className: cx('expand-trigger', visible && 'visible'),
      onClick: toggleCollapse,
      title: "Show Controls"
    }, /*#__PURE__*/React.createElement(ChevronRightIcon, null));
  }

  /**
   * Drives an element's scale from Hydra's audio volume (`window.a.vol`).
   * Updates the DOM directly from requestAnimationFrame to avoid per-frame re-renders.
   */
  function useAudioLevel(ref) {
    React.useEffect(() => {
      let frameId;
      const update = () => {
        const el = ref.current;
        if (el) {
          if (window.a && typeof window.a.vol !== 'undefined') {
            const vol = window.a.vol;
            el.classList.add('active');
            if (vol > 0.01) {
              el.style.transform = `scale(${1 + vol * 0.15})`;
              el.title = `Audio reactive active (Vol: ${vol.toFixed(2)})`;
            } else {
              el.style.transform = 'scale(1)';
            }
          } else {
            el.classList.remove('active');
          }
        }
        frameId = requestAnimationFrame(update);
      };
      update();
      return () => cancelAnimationFrame(frameId);
    }, [ref]);
  }

  const StatusDot = /*#__PURE__*/React.forwardRef(function StatusDot({
    active,
    midiActive,
    title,
    id
  }, ref) {
    return /*#__PURE__*/React.createElement("div", {
      ref: ref,
      id: id,
      className: cx('status-dot', active && 'active', midiActive && 'midi-active'),
      title: title
    });
  });

  function AudioIndicator() {
    const ref = React.useRef(null);
    useAudioLevel(ref);
    return /*#__PURE__*/React.createElement(StatusDot, {
      ref: ref,
      id: "audio-indicator-dot",
      title: "Audio Reactive Ready"
    });
  }
  function PanelHeader() {
    const midiAvailable = useStore(s => s.midiAvailable);
    return /*#__PURE__*/React.createElement("div", {
      className: "panel-header"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "panel-title"
    }, "HYDRALISK"), /*#__PURE__*/React.createElement("div", {
      className: "header-status"
    }, /*#__PURE__*/React.createElement("button", {
      id: "nav-editor-btn",
      className: "nav-editor-btn",
      onClick: openEditorWithCurrentSketch,
      title: "Open Full Editor"
    }, "Editor \u2197"), /*#__PURE__*/React.createElement(AudioIndicator, null), /*#__PURE__*/React.createElement(StatusDot, {
      id: "midi-indicator-dot",
      active: midiAvailable,
      title: "MIDI Access Active"
    }), /*#__PURE__*/React.createElement("button", {
      className: "collapse-btn feedback-toggle",
      onClick: toggleFeedback,
      title: "Report Bug / Send Feedback (Cmd+Shift+F)"
    }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("button", {
      className: "collapse-btn remote-qr-toggle",
      onClick: () => window.hydraliskRemote && window.hydraliskRemote.toggleQR(),
      title: "Phone Remote Pairing (Ctrl+Shift+R)",
      style: {
        fontSize: '13px'
      }
    }, "\uD83D\uDCF1"), /*#__PURE__*/React.createElement("button", {
      className: "collapse-btn",
      onClick: toggleCollapse,
      title: "Hide Sidebar"
    }, /*#__PURE__*/React.createElement(ChevronLeftIcon, null))));
  }

  function PanelTabs() {
    const currentTab = useStore(s => s.currentTab);
    return /*#__PURE__*/React.createElement("div", {
      className: "panel-tabs"
    }, TABS.map(({
      id,
      label
    }) => /*#__PURE__*/React.createElement("button", {
      key: id,
      className: cx('tab-btn', currentTab === id && 'active'),
      "data-tab": id,
      onClick: () => switchTab(id)
    }, label)));
  }

  /** Tab body wrapper; all tabs stay mounted so their state survives switching. */
  function TabPanel({
    id,
    children
  }) {
    const currentTab = useStore(s => s.currentTab);
    return /*#__PURE__*/React.createElement("div", {
      id: `${id}-tab`,
      className: cx('tab-content', currentTab === id && 'active')
    }, children);
  }

  function SearchBar() {
    const query = useStore(s => s.searchQuery);
    return /*#__PURE__*/React.createElement("div", {
      className: "search-wrapper"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      id: "sketch-search-input",
      className: "search-input",
      placeholder: "Search sketches or authors...",
      value: query,
      onChange: e => setSearchQuery(e.target.value)
    }));
  }

  /** Pill-shaped toggle used for tag filters and mode selectors. */
  function FilterTag({
    active,
    onClick,
    title,
    className,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: cx('filter-tag', active && 'active', className),
      onClick: onClick,
      title: title
    }, children);
  }

  function TagFilters() {
    const sketches = useStore(s => s.sketches);
    const activeTags = useStore(s => s.activeTags);
    const tags = React.useMemo(() => selectAllTags({
      sketches
    }), [sketches]);
    return /*#__PURE__*/React.createElement("div", {
      id: "tag-filters-list",
      className: "tag-filters"
    }, sketches.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(FilterTag, {
      active: activeTags.length === 0,
      onClick: clearTags
    }, "All"), tags.map(tag => /*#__PURE__*/React.createElement(FilterTag, {
      key: tag,
      active: activeTags.includes(tag),
      onClick: () => toggleTag(tag)
    }, tag))));
  }

  const SketchItem = /*#__PURE__*/React.memo(function SketchItem({
    sketch,
    index,
    active
  }) {
    const tags = (sketch.metadata?.tags || []).join(', ');
    return /*#__PURE__*/React.createElement("div", {
      className: cx('sketch-item', active && 'active'),
      onClick: () => playSketch(index)
    }, /*#__PURE__*/React.createElement("div", {
      className: "sketch-item-info"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sketch-item-name"
    }, sketch.name), /*#__PURE__*/React.createElement("span", {
      className: "sketch-item-meta"
    }, `by ${sketch.author} ${tags ? `• ${tags}` : ''}`)), /*#__PURE__*/React.createElement("div", {
      className: "sketch-item-indicator"
    }));
  });

  function SketchSection({
    title,
    entries,
    currentIndex
  }) {
    if (entries.length === 0) return null;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "sketches-section-title"
    }, title), entries.map(({
      sketch,
      index
    }) => /*#__PURE__*/React.createElement(SketchItem, {
      key: `${index}-${sketch.name}`,
      sketch: sketch,
      index: index,
      active: index === currentIndex
    })));
  }
  function SketchList() {
    const sketches = useStore(s => s.sketches);
    const query = useStore(s => s.searchQuery);
    const activeTags = useStore(s => s.activeTags);
    const currentIndex = useStore(s => s.currentSketchIndex);
    const {
      locals,
      builtIns,
      total
    } = React.useMemo(() => {
      const visible = new Set(filterSketches(sketches, query, activeTags));
      const entries = sketches.map((sketch, index) => ({
        sketch,
        index
      })).filter(({
        sketch
      }) => visible.has(sketch));
      return {
        locals: entries.filter(({
          sketch
        }) => sketch.isLocal),
        builtIns: entries.filter(({
          sketch
        }) => !sketch.isLocal),
        total: entries.length
      };
    }, [sketches, query, activeTags]);
    return /*#__PURE__*/React.createElement("div", {
      id: "sketches-list-container",
      className: "sketches-list"
    }, /*#__PURE__*/React.createElement(SketchSection, {
      title: "Your Sketches (Local)",
      entries: locals,
      currentIndex: currentIndex
    }), /*#__PURE__*/React.createElement(SketchSection, {
      title: "Built-in Library",
      entries: builtIns,
      currentIndex: currentIndex
    }), sketches.length > 0 && total === 0 && /*#__PURE__*/React.createElement("div", {
      className: "sketches-empty"
    }, "No sketches found"));
  }

  function LibraryTab() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SearchBar, null), /*#__PURE__*/React.createElement(TagFilters, null), /*#__PURE__*/React.createElement(SketchList, null));
  }

  /** Lightweight code view to inspect/modify the running sketch. */
  function EditorTab() {
    const code = useStore(s => s.editorCode);
    return /*#__PURE__*/React.createElement("div", {
      className: "code-container"
    }, /*#__PURE__*/React.createElement("textarea", {
      id: "editor-textarea",
      className: "code-textarea",
      spellCheck: false,
      placeholder: "// Write or modify Hydra synth code here...",
      value: code,
      onChange: e => setEditorCode(e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      className: "code-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "action-btn",
      onClick: resetCustomCode
    }, "Reset"), /*#__PURE__*/React.createElement("button", {
      className: "action-btn accent",
      onClick: runCustomCode
    }, "Run Code")));
  }

  /**
   * Returns true for `durationMs` every time `trigger` changes (ignoring the initial value).
   * Used for short visual flashes (tap tempo button, mutation highlight).
   */
  function usePulse(trigger, durationMs) {
    const [active, setActive] = React.useState(false);
    React.useEffect(() => {
      if (!trigger) return undefined;
      setActive(true);
      const id = setTimeout(() => setActive(false), durationMs);
      return () => clearTimeout(id);
    }, [trigger, durationMs]);
    return active;
  }

  const BEND_RANGE_PERCENT = 15;

  /**
   * BPM number input. Commits on the native `change` event (blur, Enter, spinner)
   * rather than on every keystroke, and mirrors external tempo changes.
   */
  function BpmInput() {
    const bpm = useStore(s => s.bpm);
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) ref.current.value = bpm;
    }, [bpm]);
    React.useEffect(() => {
      const input = ref.current;
      const onChange = e => setBpmFromInput(e.target.value);
      input.addEventListener('change', onChange);
      return () => input.removeEventListener('change', onChange);
    }, []);
    return /*#__PURE__*/React.createElement("input", {
      ref: ref,
      type: "number",
      id: "bpm-number-input",
      className: "search-input bpm-input",
      min: MIN_BPM,
      max: MAX_BPM,
      defaultValue: bpm
    });
  }
  function TapButton() {
    const tapPulse = useStore(s => s.tapPulse);
    const flashing = usePulse(tapPulse, 100);
    return /*#__PURE__*/React.createElement("button", {
      id: "tap-tempo-btn",
      className: cx('filter-tag', 'tap-btn', flashing && 'flash'),
      onClick: () => tapTempo()
    }, "TAP");
  }

  /** Spring-loaded pitch fader: bends tempo while held, snaps back to center on release. */
  function PitchBendFader() {
    const [offset, setOffset] = React.useState(0);
    const onChange = e => {
      const value = parseFloat(e.target.value);
      setOffset(value);
      bendTempo(value);
    };
    const onRelease = () => {
      releaseTempoBend();
      setOffset(0);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "pitch-bend"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pitch-bend-labels"
    }, /*#__PURE__*/React.createElement("span", null, `-${BEND_RANGE_PERCENT}%`), /*#__PURE__*/React.createElement("span", null, "PITCH CORRECTION (FADER)"), /*#__PURE__*/React.createElement("span", null, `+${BEND_RANGE_PERCENT}%`)), /*#__PURE__*/React.createElement("input", {
      type: "range",
      id: "bpm-bend-slider",
      className: "slider-input bend-slider",
      min: -BEND_RANGE_PERCENT,
      max: BEND_RANGE_PERCENT,
      step: "0.1",
      value: offset,
      onChange: onChange,
      onMouseUp: onRelease,
      onTouchEnd: onRelease
    }));
  }
  function TempoControl() {
    return /*#__PURE__*/React.createElement("div", {
      className: "slider-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "slider-header centered"
    }, /*#__PURE__*/React.createElement("span", null, "Tempo (BPM)"), /*#__PURE__*/React.createElement("div", {
      className: "bpm-controls"
    }, /*#__PURE__*/React.createElement(BpmInput, null), /*#__PURE__*/React.createElement(TapButton, null))), /*#__PURE__*/React.createElement(PitchBendFader, null));
  }

  function SpeedControl() {
    const speed = useStore(s => s.speed);
    return /*#__PURE__*/React.createElement("div", {
      className: "slider-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "slider-header"
    }, /*#__PURE__*/React.createElement("span", null, "Visual Speed Rate"), /*#__PURE__*/React.createElement("span", {
      id: "speed-val"
    }, formatSpeed(speed))), /*#__PURE__*/React.createElement("input", {
      type: "range",
      id: "speed-slider",
      className: "slider-input",
      min: MIN_SPEED,
      max: MAX_SPEED,
      step: "0.1",
      value: speed,
      onChange: e => setSpeed(parseFloat(e.target.value))
    }));
  }

  /** Glass card with an optional title row, status slot and description. */
  function InfoCard({
    title,
    status,
    description,
    spaced,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: cx('info-card', spaced && 'spaced')
    }, title && /*#__PURE__*/React.createElement("div", {
      className: "card-header"
    }, /*#__PURE__*/React.createElement("span", {
      className: "info-label card-title"
    }, title), status), description && /*#__PURE__*/React.createElement("p", {
      className: "card-description"
    }, description), children);
  }

  function AutomutateCard() {
    const mode = useStore(s => s.automutateMode);
    const canUndo = useStore(selectCanUndo);
    const canRedo = useStore(selectCanRedo);
    const isOff = mode === 'off';
    const status = /*#__PURE__*/React.createElement("span", {
      id: "mutation-status-label",
      className: cx('sketch-tag', 'status-label', !isOff && 'active')
    }, mode.toUpperCase() + (isOff ? '' : ' ACTIVE'));
    return /*#__PURE__*/React.createElement(InfoCard, {
      spaced: true,
      title: "Automutate / Mutation Modes",
      status: status,
      description: "Automatically modify visual parameters and functions over time."
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-field"
    }, /*#__PURE__*/React.createElement("span", {
      className: "field-label"
    }, "AUTO-MUTATE INTERVAL"), /*#__PURE__*/React.createElement("div", {
      className: "tag-filters compact"
    }, AUTOMUTATE_MODES.map(({
      mode: m,
      label,
      title
    }) => /*#__PURE__*/React.createElement(FilterTag, {
      key: m,
      active: mode === m,
      title: title,
      onClick: () => setAutomutateMode(m)
    }, label)))), /*#__PURE__*/React.createElement("div", {
      className: "code-actions compact"
    }, /*#__PURE__*/React.createElement("button", {
      className: "action-btn compact",
      id: "mutation-undo-btn",
      onClick: undoMutation,
      disabled: !canUndo
    }, "Undo"), /*#__PURE__*/React.createElement("button", {
      className: "action-btn accent compact grow",
      onClick: triggerMutation
    }, "Mutate Now"), /*#__PURE__*/React.createElement("button", {
      className: "action-btn compact",
      id: "mutation-redo-btn",
      onClick: redoMutation,
      disabled: !canRedo
    }, "Redo")));
  }

  function InfoRow({
    label,
    children,
    stacked
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: cx('info-row', stacked && 'stacked')
    }, /*#__PURE__*/React.createElement("span", {
      className: "info-label"
    }, label), children);
  }
  function NowPlayingCard() {
    const nowPlaying = useStore(s => s.nowPlaying);
    const mutationPulse = useStore(s => s.mutationPulse);
    const flashing = usePulse(mutationPulse, 300);
    return /*#__PURE__*/React.createElement("div", {
      className: "info-card"
    }, /*#__PURE__*/React.createElement(InfoRow, {
      label: "Active Sketch"
    }, /*#__PURE__*/React.createElement("span", {
      id: "playing-sketch-name",
      className: cx('info-value', flashing && 'flash')
    }, nowPlaying?.name ?? '—')), /*#__PURE__*/React.createElement(InfoRow, {
      label: "Author"
    }, /*#__PURE__*/React.createElement("span", {
      id: "playing-sketch-author",
      className: "info-value"
    }, nowPlaying?.author ?? '—')), /*#__PURE__*/React.createElement(InfoRow, {
      label: "Base Tempo"
    }, /*#__PURE__*/React.createElement("span", {
      id: "playing-sketch-bpm",
      className: "info-value"
    }, nowPlaying ? `${nowPlaying.bpm} BPM` : '—')), /*#__PURE__*/React.createElement(InfoRow, {
      label: "Tags",
      stacked: true
    }, /*#__PURE__*/React.createElement("div", {
      id: "playing-sketch-tags",
      className: "sketch-tags"
    }, (nowPlaying?.tags || []).map(tag => /*#__PURE__*/React.createElement("span", {
      key: tag,
      className: "sketch-tag"
    }, tag)))));
  }

  function CloudSyncCard() {
    const authenticated = useStore(s => s.cloudAuthenticated);
    return /*#__PURE__*/React.createElement(InfoCard, {
      spaced: true,
      title: "Cloud Synchronization",
      status: /*#__PURE__*/React.createElement(StatusDot, {
        id: "cloud-status-dot",
        active: authenticated,
        title: authenticated ? 'Connected to Cloud' : 'Not connected to Cloud'
      }),
      description: "Access your saved sketches from the cloud database."
    }, /*#__PURE__*/React.createElement("button", {
      id: "cloud-login-btn",
      className: "action-btn",
      onClick: authenticated ? logoutFromCloud : loginToCloud
    }, authenticated ? 'Disconnect' : 'Login to Cloud'));
  }

  function MidiMappingCard() {
    const sketchUsesMidi = useStore(s => Boolean(s.nowPlaying?.midi));
    return /*#__PURE__*/React.createElement(InfoCard, {
      spaced: true,
      title: "MIDI Mapping System",
      status: /*#__PURE__*/React.createElement(StatusDot, {
        id: "midi-status-dot",
        midiActive: sketchUsesMidi,
        title: sketchUsesMidi ? 'Uses MIDI input' : 'No MIDI required'
      }),
      description: "Map physical MIDI dials/keys directly to speed, sketches, or custom LFO parameters."
    }, /*#__PURE__*/React.createElement("button", {
      className: "action-btn",
      onClick: openMidiMapping
    }, "Configure MIDI Keys"));
  }

  function PerformanceTab() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TempoControl, null), /*#__PURE__*/React.createElement(SpeedControl, null), /*#__PURE__*/React.createElement(AutomutateCard, null), /*#__PURE__*/React.createElement(NowPlayingCard, null), /*#__PURE__*/React.createElement(CloudSyncCard, null), /*#__PURE__*/React.createElement(MidiMappingCard, null));
  }

  function PlayPauseButton() {
    const isPlaying = useStore(s => s.isPlaying);
    return /*#__PURE__*/React.createElement("button", {
      id: "play-pause-btn",
      className: "control-icon-btn play-pause",
      onClick: togglePlayPause,
      title: isPlaying ? 'Pause Loop (Space)' : 'Resume Loop (Space)'
    }, isPlaying ? /*#__PURE__*/React.createElement(PauseIcon, null) : /*#__PURE__*/React.createElement(PlayIcon, null));
  }

  /** Sidebar footer: transport controls and touch overlay toggle. */
  function PlaybackControls() {
    const touchActionsEnabled = useStore(s => s.touchActionsEnabled);
    return /*#__PURE__*/React.createElement("div", {
      className: "playback-controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "controls-row"
    }, /*#__PURE__*/React.createElement("button", {
      className: "control-icon-btn",
      onClick: playPrevSketch,
      title: "Previous Sketch (Left Arrow)"
    }, /*#__PURE__*/React.createElement(PrevIcon, null)), /*#__PURE__*/React.createElement(PlayPauseButton, null), /*#__PURE__*/React.createElement("button", {
      className: "control-icon-btn",
      onClick: playNextSketch,
      title: "Next Sketch (Right Arrow)"
    }, /*#__PURE__*/React.createElement(NextIcon, null)), /*#__PURE__*/React.createElement("button", {
      className: "control-icon-btn",
      onClick: playRandomSketch,
      title: "Shuffle/Random Sketch (R)"
    }, /*#__PURE__*/React.createElement(ShuffleIcon, null))), /*#__PURE__*/React.createElement("div", {
      className: "touch-toggle-row"
    }, /*#__PURE__*/React.createElement("button", {
      id: "touch-actions-hud-btn",
      className: cx('action-btn', 'touch-actions-hud-btn', touchActionsEnabled && 'active'),
      onClick: toggleTouchActions
    }, "Touch Actions Overlay")));
  }

  /** Floating control drawer: header, tabs and playback footer. */
  function Sidebar() {
    const collapsed = useStore(s => s.panelCollapsed);
    return /*#__PURE__*/React.createElement("div", {
      id: "sidebar-panel",
      className: cx('sidebar-panel', collapsed && 'collapsed')
    }, /*#__PURE__*/React.createElement(PanelHeader, null), /*#__PURE__*/React.createElement(PanelTabs, null), /*#__PURE__*/React.createElement("div", {
      className: "panel-body"
    }, /*#__PURE__*/React.createElement(TabPanel, {
      id: "library"
    }, /*#__PURE__*/React.createElement(LibraryTab, null)), /*#__PURE__*/React.createElement(TabPanel, {
      id: "editor"
    }, /*#__PURE__*/React.createElement(EditorTab, null)), /*#__PURE__*/React.createElement(TabPanel, {
      id: "performance"
    }, /*#__PURE__*/React.createElement(PerformanceTab, null))), /*#__PURE__*/React.createElement(PlaybackControls, null));
  }

  const SHORTCUTS = [{
    keys: ['Alt+Space'],
    label: 'Tap Tempo'
  }, {
    keys: ['←', '→'],
    label: 'Navigate'
  }, {
    keys: ['Cmd+]'],
    label: 'Next'
  }, {
    keys: ['R'],
    label: 'Shuffle'
  }, {
    keys: ['H'],
    label: 'Toggle HUD'
  }, {
    keys: ['T'],
    label: 'Touch Actions'
  }, {
    keys: ['F'],
    label: 'Fullscreen'
  }, {
    keys: ['⌘⇧F'],
    label: 'Feedback'
  }];

  /** Floating keyboard shortcuts guide (desktop only). */
  function ShortcutsPanel() {
    const hidden = useStore(selectShortcutsHidden);
    return /*#__PURE__*/React.createElement("div", {
      id: "shortcuts-panel",
      className: cx('shortcuts-panel', hidden && 'hidden')
    }, SHORTCUTS.map(({
      keys,
      label
    }) => /*#__PURE__*/React.createElement("span", {
      key: label
    }, keys.map((key, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: key
    }, i > 0 && ' ', /*#__PURE__*/React.createElement("span", {
      className: "shortcut-key"
    }, key))), ` ${label}`)));
  }

  const TEMPO_STEP = 2;
  const SPEED_STEP = 0.1;
  function TouchButton({
    label,
    onClick,
    children,
    id,
    active
  }) {
    return /*#__PURE__*/React.createElement("button", {
      id: id,
      className: cx('touch-action-btn', active && 'active'),
      onClick: onClick,
      "aria-label": label
    }, children);
  }
  function MobileAutomutateToggle() {
    const selectedMode = useStore(s => s.selectedAutomutateMode);
    const active = useStore(s => s.automutateMode !== 'off');
    return /*#__PURE__*/React.createElement(TouchButton, {
      id: "mobile-mutate-toggle",
      label: "Toggle current automutate setting",
      active: active,
      onClick: toggleMobileAutomutate
    }, "~", selectedMode, "b");
  }

  /** Mobile / hidden-HUD bottom sheet with large performance buttons. */
  function TouchActionsOverlay() {
    const visible = useStore(selectTouchOverlayVisible);
    return /*#__PURE__*/React.createElement("div", {
      id: "touch-actions-overlay",
      className: cx('touch-actions-overlay', visible && 'visible'),
      role: "toolbar",
      "aria-label": "Playability controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "touch-actions-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "touch-actions-header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "touch-actions-title"
    }, "PLAYABILITY"), /*#__PURE__*/React.createElement("button", {
      className: "touch-close-btn",
      onClick: toggleTouchActions,
      "aria-label": "Hide playability overlay"
    }, "\xD7")), /*#__PURE__*/React.createElement("div", {
      className: "touch-actions-grid"
    }, /*#__PURE__*/React.createElement(TouchButton, {
      label: "Decrease speed",
      onClick: () => nudgeSpeed(-SPEED_STEP)
    }, "\u2212"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Reset speed",
      onClick: () => resetSpeed()
    }, "0"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Increase speed",
      onClick: () => nudgeSpeed(SPEED_STEP)
    }, "+"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Previous sketch",
      onClick: playPrevSketch
    }, "\u2039"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Random sketch",
      onClick: playRandomSketch
    }, "[~]"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Next sketch",
      onClick: playNextSketch
    }, "\u203A"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Automutate every beat",
      onClick: () => setAutomutateMode('1')
    }, "\u2248"), /*#__PURE__*/React.createElement(MobileAutomutateToggle, null), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Disable automutate",
      onClick: () => setAutomutateMode('off')
    }, "\u2248"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Decrease tempo",
      onClick: () => nudgeTempo(-TEMPO_STEP)
    }, "BPM\u2212"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Play or pause",
      onClick: togglePlayPause
    }, "\u2161/\u25B6"), /*#__PURE__*/React.createElement(TouchButton, {
      label: "Increase tempo",
      onClick: () => nudgeTempo(TEMPO_STEP)
    }, "BPM+"))));
  }

  function App() {
    useViewport();
    useHotkeys();
    useMidiAccess();
    useAutomutateClock();
    useHashSync();
    React.useEffect(() => {
      restoreCloudSession();
      restoreTouchActionsPreference();
      // Skip the splash if the user launched the player before.
      if (shouldAutoLaunch()) startExperience();
    }, []);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SplashScreen, null), /*#__PURE__*/React.createElement(HydraCanvas, null), /*#__PURE__*/React.createElement(IntercomBar, null), /*#__PURE__*/React.createElement(ExpandTrigger, null), /*#__PURE__*/React.createElement(Sidebar, null), /*#__PURE__*/React.createElement(ShortcutsPanel, null), /*#__PURE__*/React.createElement(TouchActionsOverlay, null));
  }

  /**
   * Legacy global API.
   * Keeps the `window.*` functions the vanilla player exposed so that plugins,
   * MIDI mappings and console users keep working.
   */
  function exposeGlobalApi() {
    Object.assign(window, {
      playerSettings,
      startExperience: startExperience,
      showToast: notify,
      intercomNotify: notify,
      showError: notifyError,
      playSketch: playSketch,
      playPrevSketch: playPrevSketch,
      playNextSketch: playNextSketch,
      playRandomSketch: playRandomSketch,
      togglePlayPause: togglePlayPause,
      runCustomCode: runCustomCode,
      resetCustomCode: resetCustomCode,
      updateBPM: setBpm,
      handleTapTempo: tapTempo,
      nudgeTempo: nudgeTempo,
      nudgeSpeed: nudgeSpeed,
      resetSpeed: resetSpeed,
      setAutomutateMode: setAutomutateMode,
      triggerMutation: triggerMutation,
      undoMutation: undoMutation,
      redoMutation: redoMutation,
      toggleMobileAutomutate: toggleMobileAutomutate,
      switchTab: switchTab,
      toggleCollapse: toggleCollapse,
      toggleUI: toggleUI,
      toggleTouchActions: toggleTouchActions,
      toggleFullscreen: toggleFullscreen,
      openEditorWithCurrentSketch: openEditorWithCurrentSketch,
      handleCloudLogin: loginToCloud
    });
  }

  /**
   * Bridges the global `window.xemitter` bus (used by Hydralisk plugins such as
   * hydrakit, midi-mapping and editorActions) to player actions.
   * The SimpleEmitter has no `off`, so this must only be bound once.
   */
  let bound = false;
  function bindEmitterEvents(emitter = window.xemitter) {
    if (bound || !emitter) return;
    bound = true;
    emitter.on('taptempo', data => tapTempo(data));
    emitter.on('bpm:taptempo', data => tapTempo(data));
    emitter.on('gallery:nextSketch', () => playNextSketch());
    emitter.on('gallery:prevSketch', () => playPrevSketch());
    emitter.on('gallery:randomSketch', () => playRandomSketch());
    emitter.on('editor:randomize', () => triggerMutation());
    emitter.on('editor:jumpBack1', () => undoMutation());
    emitter.on('gfx:speedSlower', () => nudgeSpeed(-0.1));
    emitter.on('gfx:speedFaster', () => nudgeSpeed(0.1));
    emitter.on('gfx:speedDefault', () => resetSpeed({
      announce: true
    }));
    emitter.on('gfx:speedReverse', () => reverseSpeed());
    emitter.on('hideAll', () => toggleUI());
    emitter.on('fullscreen', () => toggleFullscreen());
  }

  /**
   * wsConnection.js — Durable WebSocket connection for Hydralisk Remote Relay
   *
   * Features:
   * - Jittered exponential backoff: min(3000, 100 * 1.5^attempt) + rand(0, 100) ms
   * - Instant reconnection on 'online' and 'visibilitychange' (screen unlock)
   * - Throttled 60Hz requestAnimationFrame continuous parameter dispatcher
   * - Type & Action event subscriptions
   */

  class RemoteConnection {
    constructor({
      url,
      role,
      room,
      token,
      onStatusChange
    }) {
      this.baseUrl = url || this.detectDefaultWsUrl();
      this.role = role || 'player';
      this.room = room || '';
      this.token = token || '';
      this.onStatusChange = onStatusChange || (() => {});
      this.ws = null;
      this.status = 'disconnected'; // 'connecting', 'connected', 'disconnected', 'error'
      this.reconnectAttempts = 0;
      this.reconnectTimer = null;
      this.seq = 0;
      this.listeners = new Map(); // eventKey -> Set of callbacks
      this.isDisposed = false;

      // 60Hz continuous frame buffer: channelKey -> envelope
      this.rafPending = false;
      this.continuousQueue = new Map();
      this.setupLifecycleHooks();
    }
    detectDefaultWsUrl() {
      const isHttps = window.location.protocol === 'https:';
      const proto = isHttps ? 'wss:' : 'ws:';
      const port = window.location.port;
      const hostname = window.location.hostname;

      // In local development or LAN testing, the Go relay runs on port 8080
      if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '1984' || port === '3000' || port === '5173' || /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
        return `${proto}//${hostname}:8080/ws`;
      }
      return `${proto}//${window.location.host}/ws`;
    }
    setupLifecycleHooks() {
      this.onOnline = () => {
        if (this.status !== 'connected' && !this.isDisposed) {
          console.log('[RemoteWS] Network online, reconnecting immediately...');
          this.reconnectNow();
        }
      };
      this.onVisibility = () => {
        if (document.visibilityState === 'visible' && this.status !== 'connected' && !this.isDisposed) {
          console.log('[RemoteWS] Tab visible, reconnecting immediately...');
          this.reconnectNow();
        }
      };
      window.addEventListener('online', this.onOnline);
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    connect() {
      if (this.isDisposed || this.ws) return;
      this.setStatus('connecting');

      // Build URL with parameters
      const url = new URL(this.baseUrl, window.location.href);
      url.searchParams.set('role', this.role);
      if (this.room) url.searchParams.set('room', this.room);
      if (this.token) url.searchParams.set('token', this.token);
      try {
        this.ws = new WebSocket(url.toString());
      } catch (err) {
        console.warn('[RemoteWS] WebSocket creation error:', err);
        this.scheduleReconnect();
        return;
      }
      this.ws.onopen = () => {
        console.log(`[RemoteWS] Connected as ${this.role} (room: ${this.room || 'new'})`);
        this.setStatus('connected');
        this.reconnectAttempts = 0;
      };
      this.ws.onmessage = event => {
        try {
          const envelope = JSON.parse(event.data);
          this.dispatch(envelope);
        } catch (err) {
          console.warn('[RemoteWS] Failed to parse message:', err);
        }
      };
      this.ws.onerror = err => {
        console.warn('[RemoteWS] Socket error:', err);
      };
      this.ws.onclose = event => {
        console.log(`[RemoteWS] Disconnected (code: ${event.code})`);
        this.ws = null;
        this.setStatus('disconnected');
        if (!this.isDisposed) {
          this.scheduleReconnect();
        }
      };
    }
    setStatus(status) {
      this.status = status;
      this.onStatusChange(status);
      this.emit('status', status);
    }
    scheduleReconnect() {
      if (this.reconnectTimer || this.isDisposed) return;
      this.reconnectAttempts++;
      // Jittered exponential backoff: min(3000, 100 * 1.5^attempt) + rand(0, 100) ms
      const base = Math.min(3000, 100 * Math.pow(1.5, this.reconnectAttempts));
      const jitter = Math.floor(Math.random() * 100);
      const delay = Math.round(base + jitter);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    }
    reconnectNow() {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {}
        this.ws = null;
      }
      this.reconnectAttempts = 0;
      this.connect();
    }

    /**
     * Send a reliable state intent immediately.
     */
    sendIntent(action, payload = {}) {
      this.seq++;
      const envelope = {
        v: 1,
        seq: this.seq,
        ts: Date.now(),
        type: 'INTENT',
        action,
        payload
      };
      return this.send(envelope);
    }

    /**
     * Queue a continuous stream message (e.g. MIDI_CC) for 60Hz throttled dispatch.
     * Collapses multiple updates for the same key (e.g. "b1") in a single animation frame.
     */
    sendContinuous(action, key, payload) {
      this.continuousQueue.set(`${action}:${key}`, {
        action,
        payload
      });
      if (!this.rafPending) {
        this.rafPending = true;
        requestAnimationFrame(() => this.flushContinuous());
      }
    }
    flushContinuous() {
      this.rafPending = false;
      if (this.status !== 'connected' || !this.ws) return;
      for (const {
        action,
        payload
      } of this.continuousQueue.values()) {
        this.sendIntent(action, payload);
      }
      this.continuousQueue.clear();
    }
    send(data) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return false;
      }
      try {
        this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      } catch (err) {
        console.warn('[RemoteWS] Send error:', err);
        return false;
      }
    }

    /**
     * Dispatch incoming message to registered listeners
     */
    dispatch(envelope) {
      // If HELLO packet, store room and token
      if (envelope.type === 'HELLO' && envelope.payload) {
        if (envelope.payload.room_id) this.room = envelope.payload.room_id;
        if (envelope.payload.controller_token) this.token = envelope.payload.controller_token;
      }

      // Emit by Type (e.g. "INTENT", "SYNC", "HELLO")
      this.emit(envelope.type, envelope);

      // Emit by Action (e.g. "LOAD_SCENE", "MIDI_CC", "FULL_STATE")
      if (envelope.action) {
        this.emit(envelope.action, envelope.payload, envelope);
      }

      // Global message listener
      this.emit('message', envelope);
    }
    on(eventKey, callback) {
      if (!this.listeners.has(eventKey)) {
        this.listeners.set(eventKey, new Set());
      }
      this.listeners.get(eventKey).add(callback);
      return () => this.off(eventKey, callback);
    }
    off(eventKey, callback) {
      const set = this.listeners.get(eventKey);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(eventKey);
      }
    }
    emit(eventKey, ...args) {
      const set = this.listeners.get(eventKey);
      if (set) {
        for (const cb of set) {
          try {
            cb(...args);
          } catch (e) {
            console.error(`[RemoteWS] Error in listener for ${eventKey}:`, e);
          }
        }
      }
    }
    dispose() {
      this.isDisposed = true;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      window.removeEventListener('online', this.onOnline);
      document.removeEventListener('visibilitychange', this.onVisibility);
      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {}
        this.ws = null;
      }
      this.listeners.clear();
      this.continuousQueue.clear();
    }
  }

  /**
   * qrOverlay.js — Pairing Modal & QR Code generator for Hydralisk Player
   *
   * Provides a projector-friendly pairing screen (Ctrl+Shift+R or UI button)
   * displaying a QR code that encodes https://hydralisk.sphynx.cloud/remote.html?room=XYZ&token=...
   * Auto-fades when a mobile controller successfully connects.
   */

  // Minimal self-contained QR Code generator (Mode 8-bit Byte, Version auto 1-10, Low ECC)
  // Based on standard ISO/IEC 18004 QR generation
  function createQRCodeMatrix(text) {
    // Simple table-based QR generator or SVG fallback for canvas/vector rendering
    // We implement a robust mini QR generator supporting URLs up to 128 characters
    return generateQRMatrix(text);
  }

  // Compact QR Code Generator implementation
  function generateQRMatrix(text) {
    // Use a reliable lightweight QR algorithm
    const qr = QRCode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr;
  }

  // Embedded minimal QRCode library (Kazuhiko Arase QR Code Generator in Javascript)
  function QRCode(typeNumber, errorCorrectionLevel) {
    const PAD0 = 0xEC;
    const PAD1 = 0x11;
    let _modules = null;
    let _moduleCount = 0;
    let _dataCache = null;
    const _dataList = [];
    function addData(data) {
      _dataList.push(new QR8bitByte(data));
      _dataCache = null;
    }
    function isDark(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw new Error(row + "," + col);
      }
      return _modules[row][col];
    }
    function getModuleCount() {
      return _moduleCount;
    }
    function make() {
      if (typeNumber < 1) {
        let type = 1;
        for (; type < 40; type++) {
          const rsBlocks = QRRSBlock.getRSBlocks(type, errorCorrectionLevel);
          const buffer = new QRBitBuffer();
          let totalDataCount = 0;
          for (let i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }
          for (let i = 0; i < _dataList.length; i++) {
            const data = _dataList[i];
            buffer.put(data.mode, 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, type));
            data.write(buffer);
          }
          if (buffer.getLengthInBits() <= totalDataCount * 8) break;
        }
        typeNumber = type;
      }
      makeImpl(false, getBestMaskPattern());
    }
    function makeImpl(test, maskPattern) {
      _moduleCount = typeNumber * 4 + 17;
      _modules = new Array(_moduleCount);
      for (let row = 0; row < _moduleCount; row++) {
        _modules[row] = new Array(_moduleCount).fill(null);
      }
      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);
      if (typeNumber >= 7) {
        setupTypeNumber(test);
      }
      if (_dataCache == null) {
        _dataCache = createData(typeNumber, errorCorrectionLevel, _dataList);
      }
      mapData(_dataCache, maskPattern);
    }
    function setupPositionProbePattern(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || _moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || _moduleCount <= col + c) continue;
          if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    }
    function getBestMaskPattern() {
      let minLostPoint = 0;
      let pattern = 0;
      for (let i = 0; i < 8; i++) {
        makeImpl(true, i);
        const lostPoint = QRUtil.getLostPoint({
          getModuleCount,
          isDark
        });
        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }
      return pattern;
    }
    function setupTimingPattern() {
      for (let r = 8; r < _moduleCount - 8; r++) {
        if (_modules[r][6] != null) continue;
        _modules[r][6] = r % 2 == 0;
      }
      for (let c = 8; c < _moduleCount - 8; c++) {
        if (_modules[6][c] != null) continue;
        _modules[6][c] = c % 2 == 0;
      }
    }
    function setupPositionAdjustPattern() {
      const pos = QRUtil.getPatternPosition(typeNumber);
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const row = pos[i];
          const col = pos[j];
          if (_modules[row][col] != null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (Math.abs(r) == 2 || Math.abs(c) == 2 || r == 0 && c == 0) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    }
    function setupTypeNumber(test) {
      const bits = QRUtil.getBCHTypeNumber(typeNumber);
      for (let i = 0; i < 18; i++) {
        const mod = !test && (bits >> i & 1) == 1;
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }
      for (let i = 0; i < 18; i++) {
        const mod = !test && (bits >> i & 1) == 1;
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    }
    function setupTypeInfo(test, maskPattern) {
      const data = QRUtil.getErrorCorrectionLevelBits(errorCorrectionLevel) << 3 | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);
      for (let i = 0; i < 15; i++) {
        const mod = !test && (bits >> i & 1) == 1;
        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }
      for (let i = 0; i < 15; i++) {
        const mod = !test && (bits >> i & 1) == 1;
        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i == 8) {
          _modules[8][15 - i] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }
      _modules[_moduleCount - 8][8] = !test;
    }
    function mapData(data, maskPattern) {
      let inc = -1;
      let row = _moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = _moduleCount - 1; col > 0; col -= 2) {
        if (col == 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (_modules[row][col - c] == null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) == 1;
              }
              const mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              _modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex == -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    function createData(typeNumber, errorCorrectionLevel, dataList) {
      const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
      const buffer = new QRBitBuffer();
      for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
        data.write(buffer);
      }
      let totalDataCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) {
        totalDataCount += rsBlocks[i].dataCount;
      }
      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error("Code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
      }
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }
      while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) break;
        buffer.put(PAD0, 8);
        if (buffer.getLengthInBits() >= totalDataCount * 8) break;
        buffer.put(PAD1, 8);
      }
      return createBytes(buffer, rsBlocks);
    }
    function createBytes(buffer, rsBlocks) {
      let offset = 0;
      let maxDcCount = 0;
      let maxEcCount = 0;
      const dcdata = new Array(rsBlocks.length);
      const ecdata = new Array(rsBlocks.length);
      for (let r = 0; r < rsBlocks.length; r++) {
        const dcCount = rsBlocks[r].dataCount;
        const ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);
        dcdata[r] = new Array(dcCount);
        for (let i = 0; i < dcdata[r].length; i++) {
          dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        }
        offset += dcCount;
        const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        const modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (let i = 0; i < ecdata[r].length; i++) {
          const modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
        }
      }
      let totalCodeCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) {
        totalCodeCount += rsBlocks[i].totalCount;
      }
      const data = new Array(totalCodeCount);
      let index = 0;
      for (let i = 0; i < maxDcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) {
            data[index++] = dcdata[r][i];
          }
        }
      }
      for (let i = 0; i < maxEcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) {
            data[index++] = ecdata[r][i];
          }
        }
      }
      return data;
    }
    return {
      addData,
      make,
      isDark,
      getModuleCount
    };
  }
  function QR8bitByte(data) {
    this.mode = 4; // 8-bit byte mode
    this.data = data;
  }
  QR8bitByte.prototype = {
    getLength: function () {
      return encodeURI(this.data).replace(/%../g, "i").length;
    },
    write: function (buffer) {
      const utf8 = unescape(encodeURIComponent(this.data));
      for (let i = 0; i < utf8.length; i++) {
        buffer.put(utf8.charCodeAt(i), 8);
      }
    }
  };
  const QRUtil = {
    PATTERN_POSITION_TABLE: [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]],
    G15: 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0,
    G18: 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0,
    G15_MASK: 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1,
    getBCHTypeInfo: function (data) {
      let d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
      }
      return (data << 10 | d) ^ QRUtil.G15_MASK;
    },
    getBCHTypeNumber: function (data) {
      let d = data << 12;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
        d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
      }
      return data << 12 | d;
    },
    getBCHDigit: function (data) {
      let digit = 0;
      while (data != 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    },
    getPatternPosition: function (typeNumber) {
      return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
    },
    getMask: function (maskPattern, i, j) {
      switch (maskPattern) {
        case 0:
          return (i + j) % 2 == 0;
        case 1:
          return i % 2 == 0;
        case 2:
          return j % 3 == 0;
        case 3:
          return (i + j) % 3 == 0;
        case 4:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
        case 5:
          return i * j % 2 + i * j % 3 == 0;
        case 6:
          return (i * j % 2 + i * j % 3) % 2 == 0;
        case 7:
          return (i * j % 3 + (i + j) % 2) % 2 == 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    },
    getErrorCorrectPolynomial: function (errorCorrectLength) {
      let a = new QRPolynomial([1], 0);
      for (let i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }
      return a;
    },
    getLengthInBits: function (mode, type) {
      if (1 <= type && type < 10) return 8;
      return 16;
    },
    getErrorCorrectionLevelBits: function (level) {
      switch (level) {
        case 'L':
          return 1;
        case 'M':
          return 0;
        case 'Q':
          return 3;
        case 'H':
          return 2;
        default:
          return 0;
      }
    },
    getLostPoint: function (qrCode) {
      const moduleCount = qrCode.getModuleCount();
      let lostPoint = 0;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          let sameCount = 0;
          const dark = qrCode.isDark(row, col);
          for (let r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c || r == 0 && c == 0) continue;
              if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
            }
          }
          if (sameCount > 5) lostPoint += 3 + sameCount - 5;
        }
      }
      return lostPoint;
    }
  };
  const QRMath = {
    glog: function (n) {
      if (n < 1) throw new Error("glog(" + n + ")");
      return QRMath.LOG_TABLE[n];
    },
    gexp: function (n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };
  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) {
    QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
  function QRPolynomial(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] == 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  QRPolynomial.prototype = {
    get: function (index) {
      return this.num[index];
    },
    getLength: function () {
      return this.num.length;
    },
    multiply: function (e) {
      const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  };
  const QRRSBlock = {
    RS_BLOCK_TABLE: [[1, 26, 16], [1, 44, 28], [1, 70, 44], [1, 100, 64], [1, 134, 86], [2, 86, 52], [2, 98, 54], [2, 121, 69], [2, 146, 80], [2, 86, 43, 2, 87, 44]],
    getRSBlocks: function (typeNumber, errorCorrectionLevel) {
      const list = [];
      const table = QRRSBlock.RS_BLOCK_TABLE[typeNumber - 1] || [1, 26, 16];
      const length = table.length / 3;
      for (let i = 0; i < length; i++) {
        const count = table[i * 3 + 0];
        const totalCount = table[i * 3 + 1];
        const dataCount = table[i * 3 + 2];
        for (let j = 0; j < count; j++) {
          list.push({
            totalCount,
            dataCount
          });
        }
      }
      return list;
    }
  };
  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function (index) {
      const bufIndex = Math.floor(index / 8);
      return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
    },
    put: function (num, length) {
      for (let i = 0; i < length; i++) {
        this.putBit((num >>> length - i - 1 & 1) == 1);
      }
    },
    getLengthInBits: function () {
      return this.length;
    },
    putBit: function (bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
      this.length++;
    }
  };

  /**
   * Generate an inline SVG string for the given URL
   */
  function generateQRSvg(text, size = 260) {
    const qr = createQRCodeMatrix(text);
    const count = qr.getModuleCount();
    const cellSize = size / count;
    let rects = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          const x = (c * cellSize).toFixed(2);
          const y = (r * cellSize).toFixed(2);
          const w = (cellSize + 0.05).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#000"/>`;
        }
      }
    }
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#fff; border-radius:12px; padding:12px; box-sizing:content-box;">
      ${rects}
    </svg>
  `;
  }

  /**
   * Overlay UI Controller for Player
   */
  class QROverlay {
    constructor({
      onToggle
    } = {}) {
      this.visible = false;
      this.overlayEl = null;
      this.onToggle = onToggle || (() => {});
      this.room = '';
      this.token = '';
      this.phoneConnected = false;
      this.setupGlobalShortcut();
    }
    setupGlobalShortcut() {
      window.addEventListener('keydown', e => {
        // Toggle on Ctrl+Shift+R or Cmd+Shift+R
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        }
        if (e.key === 'Escape' && this.visible) {
          this.hide();
        }
      });
    }
    update({
      room,
      token,
      phoneConnected
    }) {
      if (room !== undefined) this.room = room;
      if (token !== undefined) this.token = token;
      if (phoneConnected !== undefined) {
        const wasConnected = this.phoneConnected;
        this.phoneConnected = phoneConnected;
        // Auto-fade when phone connects
        if (!wasConnected && phoneConnected && this.visible) {
          this.autoFadeOut();
        }
      }
      if (this.visible && this.overlayEl) {
        this.renderContent();
      }
    }
    autoFadeOut() {
      if (!this.overlayEl) return;
      this.overlayEl.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      this.overlayEl.style.opacity = '0';
      this.overlayEl.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.hide();
        if (this.overlayEl) {
          this.overlayEl.style.opacity = '';
          this.overlayEl.style.transform = '';
        }
      }, 850);
    }
    toggle() {
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
    }
    show() {
      this.visible = true;
      if (!this.overlayEl) {
        this.createDom();
      }
      this.renderContent();
      this.overlayEl.style.display = 'flex';
      requestAnimationFrame(() => {
        this.overlayEl.style.opacity = '1';
      });
      this.onToggle(true);
    }
    hide() {
      this.visible = false;
      if (this.overlayEl) {
        this.overlayEl.style.opacity = '0';
        setTimeout(() => {
          if (!this.visible && this.overlayEl) {
            this.overlayEl.style.display = 'none';
          }
        }, 300);
      }
      this.onToggle(false);
    }
    getRemoteUrl() {
      const loc = window.location;
      const base = `${loc.protocol}//${loc.host}/remote.html`;
      const url = new URL(base);
      if (this.room) url.searchParams.set('room', this.room);
      if (this.token) url.searchParams.set('token', this.token);
      return url.toString();
    }
    createDom() {
      this.overlayEl = document.createElement('div');
      this.overlayEl.id = 'hydralisk-remote-qr-modal';
      this.overlayEl.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(5, 5, 10, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 999999;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
      this.overlayEl.addEventListener('click', e => {
        if (e.target === this.overlayEl) this.hide();
      });
      document.body.appendChild(this.overlayEl);
    }
    renderContent() {
      if (!this.overlayEl) return;
      const remoteUrl = this.getRemoteUrl();
      const qrSvg = generateQRSvg(remoteUrl, 260);
      const statusBadge = this.phoneConnected ? `<span style="background:#10b981; color:#000; font-size:12px; font-weight:700; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">● CONTROLLER PAIRED</span>` : `<span style="background:rgba(255,255,255,0.12); color:#94a3b8; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;"><span style="animation:pulse 1.5s infinite; color:#38bdf8;">●</span> WAITING FOR SCAN</span>`;
      this.overlayEl.innerHTML = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      </style>
      <div style="background: #11131a; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 36px 40px; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); position: relative;">
        <button id="qr-close-btn" style="position:absolute; top:18px; right:20px; background:transparent; border:none; color:#94a3b8; font-size:24px; cursor:pointer; line-height:1;">&times;</button>
        
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; font-weight: 700; margin-bottom: 8px;">
          HYDRALISK REMOTE RELAY
        </div>
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">Scan to Control Visuals</h2>
        
        <div style="display:inline-block; margin: 10px 0 18px 0; border: 2px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.4);">
          ${qrSvg}
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 4px;">Room Code</div>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f8fafc; font-family: monospace;">${this.room || '----'}</div>
        </div>

        <div style="margin-bottom: 20px;">
          ${statusBadge}
        </div>

        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
          <input type="text" readonly value="${remoteUrl}" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 12px; padding: 8px 12px; border-radius: 8px; width: 70%; font-family: monospace; outline: none;" id="qr-url-input" />
          <button id="qr-copy-btn" style="background: #3b82f6; border: none; color: #fff; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; cursor: pointer;">Copy</button>
        </div>

        <div style="margin-top: 12px;">
          <a href="${remoteUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-size: 13px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">Open Remote in New Tab ↗</a>
        </div>

        <div style="margin-top: 16px; font-size: 12px; color: #64748b;">
          Press <kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-family:monospace;">Ctrl+Shift+R</kbd> or <kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-family:monospace;">Esc</kbd> to toggle
        </div>
      </div>
    `;
      const closeBtn = this.overlayEl.querySelector('#qr-close-btn');
      if (closeBtn) closeBtn.onclick = () => this.hide();
      const copyBtn = this.overlayEl.querySelector('#qr-copy-btn');
      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(remoteUrl).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 2000);
          });
        };
      }
    }
  }

  /**
   * playerClient.js — Player Client Adapter for Hydralisk Remote Relay
   *
   * Runs in the projector / player browser:
   * 1. Establishes a durable WebSocket connection to the Go relay daemon as role=player.
   * 2. Manages room persistence (sessionStorage) across page reloads.
   * 3. Registers local/remote sketch catalog with REGISTER_SCENES so the phone can browse scenes.
   * 4. Translates remote intents (AUTO_MUTATE, MUTATE_NOW, UNDO_5X, SPEED_DIAL, TAP_TEMPO, MIDI_CC, BLACKOUT, LOAD_SCENE)
   *    directly into Hydralisk player actions and virtual MIDI CC bridges without synthetic DOM events.
   * 5. Controls the toggleable QR code pairing overlay (Ctrl+Shift+R).
   */

  const STORAGE_KEY_ROOM = 'hydralisk_remote_room';
  const STORAGE_KEY_TOKEN = 'hydralisk_remote_token';
  class PlayerRemoteClient {
    constructor(options = {}) {
      this.wsUrl = options.wsUrl || null;
      this.connection = null;
      this.qrOverlay = null;
      this.room = sessionStorage.getItem(STORAGE_KEY_ROOM) || '';
      this.token = sessionStorage.getItem(STORAGE_KEY_TOKEN) || '';
      this.originalSpeedBeforeBlackout = 1.0;
      this.isBlackout = false;
      this.init();
    }
    init() {
      this.qrOverlay = new QROverlay();
      this.connection = new RemoteConnection({
        url: this.wsUrl,
        role: 'player',
        room: this.room,
        token: this.token,
        onStatusChange: status => this.handleStatusChange(status)
      });
      this.setupIntentHandlers();
      this.connection.connect();

      // Expose global for dev console and UI triggers
      window.hydraliskRemote = {
        client: this,
        connection: this.connection,
        qrOverlay: this.qrOverlay,
        toggleQR: () => this.qrOverlay.toggle(),
        getRoom: () => this.room,
        getToken: () => this.token
      };
    }
    setupIntentHandlers() {
      // 1. Handshake response (HELLO)
      this.connection.on('HELLO', envelope => {
        const p = envelope.payload || {};
        if (p.room_id) {
          this.room = p.room_id;
          sessionStorage.setItem(STORAGE_KEY_ROOM, this.room);
        }
        if (p.controller_token) {
          this.token = p.controller_token;
          sessionStorage.setItem(STORAGE_KEY_TOKEN, this.token);
        }
        this.qrOverlay.update({
          room: this.room,
          token: this.token,
          phoneConnected: p.controller_count > 0
        });

        // Synchronize available scene deck to relay
        this.syncSceneCatalog();
      });

      // 2. Full State Sync
      this.connection.on('SYNC', envelope => {
        // Sync initial state if desired
        this.syncSceneCatalog();
      });

      // 3. Virtual MIDI CC (ephemeral continuous stream)
      this.connection.on('MIDI_CC', payload => {
        if (!payload || !payload.cc) return;
        if (window.hydraliskMidiBridge && typeof window.hydraliskMidiBridge.setVirtualCC === 'function') {
          window.hydraliskMidiBridge.setVirtualCC(payload.cc, payload.val);
        }
      });

      // 4. Auto-Mutate mode
      this.connection.on('AUTO_MUTATE', payload => {
        if (!payload) return;
        const beats = payload.beats;
        const mode = beats === 0 || beats === '0' || beats === 'off' ? 'off' : beats.toString();
        setAutomutateMode(mode);
      });

      // 5. Immediate single mutation
      this.connection.on('MUTATE_NOW', () => {
        triggerMutation();
      });

      // 6. Undo 5x history
      this.connection.on('UNDO_5X', () => {
        // Step back 5 mutations in history
        for (let i = 0; i < 5; i++) {
          undoMutation();
        }
        notify('Remote: 5x Undo executed');
      });

      // 7. Speed dial & reverse
      this.connection.on('SPEED_DIAL', payload => {
        if (!payload) return;
        if (typeof payload.multiplier === 'number') {
          setSpeed(payload.multiplier);
        }
        if (typeof payload.reverse === 'boolean') {
          const curSpeed = window.speed || 1.0;
          if (payload.reverse && curSpeed > 0) {
            reverseSpeed();
          } else if (!payload.reverse && curSpeed < 0) {
            reverseSpeed();
          }
        }
      });

      // 8. Tap Tempo (computed BPM from mobile)
      this.connection.on('TAP_TEMPO', payload => {
        if (payload && typeof payload.bpm === 'number' && payload.bpm > 0) {
          setBpm(Math.round(payload.bpm));
          notify(`Remote Tempo: ${Math.round(payload.bpm)} BPM`);
        }
      });

      // 9. Load Scene
      this.connection.on('LOAD_SCENE', payload => {
        if (!payload) return;
        if (payload.id) {
          playSketch(payload.id);
        } else if (payload.code) {
          setEditorCode(payload.code);
          runCustomCode();
        }
      });

      // 10. Blackout
      this.connection.on('BLACKOUT', payload => {
        const active = payload ? Boolean(payload.active) : !this.isBlackout;
        this.setBlackout(active);
      });
    }
    setBlackout(active) {
      this.isBlackout = active;
      let blackoutEl = document.getElementById('remote-blackout-curtain');
      if (!blackoutEl) {
        blackoutEl = document.createElement('div');
        blackoutEl.id = 'remote-blackout-curtain';
        blackoutEl.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #000; z-index: 99999; pointer-events: none;
        opacity: 0; transition: opacity 0.25s ease-in-out;
      `;
        document.body.appendChild(blackoutEl);
      }
      if (active) {
        this.originalSpeedBeforeBlackout = window.speed || 1.0;
        window.speed = 0;
        blackoutEl.style.opacity = '1';
        notify('Remote: BLACKOUT ACTIVE');
      } else {
        window.speed = this.originalSpeedBeforeBlackout || 1.0;
        blackoutEl.style.opacity = '0';
        notify('Remote: Blackout lifted');
      }
    }
    syncSceneCatalog() {
      const {
        sketches
      } = getState();
      if (!sketches || sketches.length === 0) return;
      const catalog = sketches.slice(0, 100).map((s, idx) => ({
        id: s.name || `sketch_${idx}`,
        name: s.name || `Sketch ${idx + 1}`,
        author: s.author || '',
        bpm: s.bpm || 120
      }));
      this.connection.sendIntent('REGISTER_SCENES', {
        scenes: catalog
      });
    }
    handleStatusChange(status) {
      if (status === 'connected') {
        notify(`Remote Relay: Connected (Room ${this.room || '...'})`);
      }
    }
  }

  // Auto-start remote client if on player page or in player mode
  function initPlayerRemoteClient(options = {}) {
    if (typeof window === 'undefined') return null;
    return new PlayerRemoteClient(options);
  }

  /**
   * Hydralisk Visual Player — entry point.
   * Bundled by Rollup into ./player.dist.js; React and ReactDOM are provided as
   * globals by ./react.min.js and ./react-dom.min.js.
   */
  exposeGlobalApi();
  function mount() {
    bindEmitterEvents();
    if (shouldAutoLaunch()) setState({
      splash: 'hidden'
    });
    const container = document.getElementById('player-root');
    reactDom.createRoot(container).render(/*#__PURE__*/React.createElement(App, null));
    try {
      initPlayerRemoteClient();
    } catch (err) {
      console.warn('[HydraliskPlayer] Remote client init error:', err);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  exports.getState = getState;
  exports.openEditorWithCurrentSketch = openEditorWithCurrentSketch;
  exports.playSketch = playSketch;
  exports.showToast = notify;
  exports.startExperience = startExperience;
  exports.store = store;
  exports.toggleUI = toggleUI;

  return exports;

})({}, React, ReactDOM);
//# sourceMappingURL=player.dist.js.map
