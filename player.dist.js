var HydraliskPlayer = (function (exports) {
  'use strict';

  /**
   * Hydralisk Player State Store
   * Centralized state object for live performance player context.
   */

  const state = {
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

  /**
   * Hydralisk Player Intercom Notification System
   * Single-pass marquee ticker queue system for live performance feedback.
   */

  const intercomQueue = [];
  let isIntercomBusy = false;
  let intercomActiveTimeout = null;

  /**
   * Dispatch a message to the Intercom Marquee Queue System
   * @param {string} message 
   * @param {boolean} isError 
   */
  function showToast(message, isError = false) {
    intercomNotify(message, isError);
  }

  function intercomNotify(message, isError = false) {
    if (!message) return;
    intercomQueue.push({ message: String(message), isError: Boolean(isError) });
    if (!isIntercomBusy) {
      processIntercomQueue();
    }
  }

  function processIntercomQueue() {
    if (intercomQueue.length === 0) {
      isIntercomBusy = false;
      const badge = document.getElementById('intercom-badge');
      const track = document.getElementById('intercom-track');
      if (badge) {
        badge.classList.remove('error');
        badge.textContent = "HYDRA // SYS";
      }
      if (track) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        track.textContent = '';
      }
      return;
    }

    isIntercomBusy = true;
    const current = intercomQueue.shift();

    const badge = document.getElementById('intercom-badge');
    const viewport = document.getElementById('intercom-viewport');
    const track = document.getElementById('intercom-track');

    if (!viewport || !track) {
      isIntercomBusy = false;
      return;
    }

    if (badge) {
      badge.textContent = current.isError ? "HYDRA // ERR" : "HYDRA // SYS";
      if (current.isError) {
        badge.classList.add('error');
      } else {
        badge.classList.remove('error');
      }
    }

    if (current.isError) {
      track.classList.add('error');
    } else {
      track.classList.remove('error');
    }

    track.textContent = current.message;

    // Calculate scroll distance and timing for single-pass left marquee scroll
    const viewportWidth = viewport.offsetWidth || window.innerWidth;
    const textWidth = track.offsetWidth || (current.message.length * 8);

    const startX = viewportWidth;
    const endX = -textWidth - 20;
    const totalDistance = startX - endX;

    // 140px per second speed ensures smooth, crisp readability across all screen sizes
    const speedPxPerSec = 140;
    const durationSec = Math.max(2.2, totalDistance / speedPxPerSec);

    // Position track at right boundary
    track.style.transition = 'none';
    track.style.transform = `translateX(${startX}px)`;

    // Force layout reflow
    void track.offsetWidth;

    // Start smooth left marquee scroll
    track.style.transition = `transform ${durationSec}s linear`;
    track.style.transform = `translateX(${endX}px)`;

    let hasEnded = false;
    const onEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (intercomActiveTimeout) clearTimeout(intercomActiveTimeout);
      track.removeEventListener('transitionend', onEnd);
      setTimeout(() => {
        processIntercomQueue();
      }, 150);
    };

    track.addEventListener('transitionend', onEnd);
    intercomActiveTimeout = setTimeout(onEnd, (durationSec * 1000) + 200);
  }

  /**
   * Log error to intercom system
   * @param {Error|string} error 
   */
  function showError(error) {
    showToast((error && error.message) || error, true);
  }

  // src/player/automutate.js - Auto-Mutate AST & regex engine and mutation history stack

  function mutateCode(code, changeTransform = false) {
    if (changeTransform) {
      const categories = {
        sources: ["osc", "shape", "noise", "voronoi", "gradient", "solid"],
        geometry: ["rotate", "scale", "pixelate", "repeat", "repeatX", "repeatY", "kaleid", "scroll", "scrollX", "scrollY"],
        color: ["posterize", "shift", "invert", "contrast", "luma", "thresh", "color", "saturate", "hue", "colorama"],
        blends: ["add", "sub", "mult", "diff", "blend", "mask"],
        modulators: ["modulate", "modulateScale", "modulatePixelate", "modulateRotate", "modulateKaleid", "modulateScrollX", "modulateScrollY", "modulateHue"]
      };

      const foundFuncs = [];
      for (const catName in categories) {
        categories[catName].forEach(func => {
          const regex = new RegExp(`\\b${func}\\b`, 'g');
          let match;
          while ((match = regex.exec(code)) !== null) {
            foundFuncs.push({
              name: func,
              index: match.index,
              category: catName
            });
          }
        });
      }

      if (foundFuncs.length > 0) {
        const selected = foundFuncs[Math.floor(Math.random() * foundFuncs.length)];
        const others = categories[selected.category].filter(f => f !== selected.name);
        if (others.length > 0) {
          const become = others[Math.floor(Math.random() * others.length)];
          const before = code.substring(0, selected.index);
          const after = code.substring(selected.index + selected.name.length);
          console.log(`Mutator: changing function ${selected.name} to ${become}`);
          return before + become + after;
        }
      }
    }

    // Literal numerical mutation fallback
    const numRegex = /(?<![\w'"`])(?:\b-?\d+(?:\.\d+)?\b)/g;
    const matches = [...code.matchAll(numRegex)];

    if (matches.length > 0) {
      const selected = matches[Math.floor(Math.random() * matches.length)];
      const index = selected.index;
      const oldStr = selected[0];
      const oldVal = parseFloat(oldStr);

      let newVal;
      if (oldVal === 0) {
        newVal = Math.random() > 0.5 ? 0.5 : -0.5;
      } else {
        newVal = Math.round((Math.random() * oldVal * 2) * 1000) / 1000;
      }

      const before = code.substring(0, index);
      const after = code.substring(index + oldStr.length);
      console.log(`Mutator: changing number ${oldStr} to ${newVal}`);
      return before + String(newVal) + after;
    }

    return code;
  }

  function setAutomutateMode(mode, quiet = false) {
    state.automutateMode = mode;

    if (state.automutateIntervalId) {
      clearInterval(state.automutateIntervalId);
      state.automutateIntervalId = null;
    }

    // Update mode buttons UI
    const buttons = document.querySelectorAll('[data-mutate-mode]');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-mutate-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const statusLabel = document.getElementById('mutation-status-label');
    if (statusLabel) {
      statusLabel.innerText = mode.toUpperCase() + (mode === 'off' ? '' : ' ACTIVE');
      statusLabel.style.color = mode === 'off' ? 'var(--text-muted)' : 'var(--color-accent)';
    }

    if (mode === 'off') {
      if (!quiet) intercomNotify("Auto-Mutate disabled");
      return;
    }

    const msPerBeat = 60000 / (window.bpm || state.baseBpm || 120);
    let multiplier = 1;
    switch (mode) {
      case '1': multiplier = 1; break;
      case '2': multiplier = 2; break;
      case '4': multiplier = 4; break;
      case '8': multiplier = 8; break;
      case '16': multiplier = 16; break;
    }

    const timeoutMs = msPerBeat * multiplier;
    if (!quiet) {
      intercomNotify(`Auto-Mutate active (every ${multiplier === 1 ? 'beat' : multiplier + ' beats'})`);
    }

    state.automutateIntervalId = setInterval(() => {
      triggerMutation();
    }, timeoutMs);

    syncPerformanceSettingsToHash();
  }

  function triggerMutation() {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;
    const currentCode = textarea.value;

    const changeTransform = Math.random() > 0.5;
    const newCode = mutateCode(currentCode, changeTransform);

    if (newCode !== currentCode) {
      try {
        if (typeof hush === 'function') hush();
        const wrappedCode = `(() => {
        ${newCode}
      })()
//# sourceURL=hydra-mutated-sketch.js\n`;
        eval(wrappedCode);

        textarea.value = newCode;
        saveMutationToHistory(newCode);

        const nameEl = document.getElementById('playing-sketch-name');
        if (nameEl) {
          nameEl.style.color = 'var(--color-accent)';
          nameEl.style.textShadow = '0 0 10px var(--color-accent-glowing)';
          setTimeout(() => {
            nameEl.style.color = '';
            nameEl.style.textShadow = '';
          }, 300);
        }
      } catch (err) {
        console.error("Mutation evaluation failed:", err);
      }
    }
  }

  function saveMutationToHistory(code) {
    if (state.mutationHistoryIndex < state.mutationHistory.length - 1) {
      state.mutationHistory = state.mutationHistory.slice(0, state.mutationHistoryIndex + 1);
    }
    state.mutationHistory.push(code);
    if (state.mutationHistory.length > 50) {
      state.mutationHistory.shift();
    }
    state.mutationHistoryIndex = state.mutationHistory.length - 1;
    updateMutationUndoRedoButtons();
  }

  function undoMutation() {
    if (state.mutationHistoryIndex > 0) {
      state.mutationHistoryIndex--;
      const code = state.mutationHistory[state.mutationHistoryIndex];
      if (typeof hush === 'function') hush();
      eval(`(() => { ${code} })()`);
      const textarea = document.getElementById('editor-textarea');
      if (textarea) textarea.value = code;
      intercomNotify("Mutation undone");
      updateMutationUndoRedoButtons();
    }
  }

  function redoMutation() {
    if (state.mutationHistoryIndex < state.mutationHistory.length - 1) {
      state.mutationHistoryIndex++;
      const code = state.mutationHistory[state.mutationHistoryIndex];
      if (typeof hush === 'function') hush();
      eval(`(() => { ${code} })()`);
      const textarea = document.getElementById('editor-textarea');
      if (textarea) textarea.value = code;
      intercomNotify("Mutation redone");
      updateMutationUndoRedoButtons();
    }
  }

  function updateMutationUndoRedoButtons() {
    const undoBtn = document.getElementById('mutation-undo-btn');
    const redoBtn = document.getElementById('mutation-redo-btn');
    if (undoBtn) undoBtn.disabled = state.mutationHistoryIndex <= 0;
    if (redoBtn) redoBtn.disabled = state.mutationHistoryIndex >= state.mutationHistory.length - 1;
  }

  // src/player/controls.js - Playback, tempo, and fader controls for Hydralisk Player

  function updateBPM(newBpm) {
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

  function handleTapTempo(evt = {}) {
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

  function updatePlayPauseButton() {
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

  function togglePlayPause() {
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

  function playPrevSketch() {
    if (state.sketchesList.length === 0) return;
    let prevIdx = state.currentSketchIndex - 1;
    if (prevIdx < 0) prevIdx = state.sketchesList.length - 1;
    playSketch(prevIdx);
  }

  function playNextSketch() {
    if (state.sketchesList.length === 0) return;
    let nextIdx = (state.currentSketchIndex + 1) % state.sketchesList.length;
    playSketch(nextIdx);
  }

  function playRandomSketch() {
    if (state.sketchesList.length === 0) return;
    const randIdx = Math.floor(Math.random() * state.sketchesList.length);
    playSketch(randIdx);
  }

  function nudgeTempo(delta) {
    const bpmInput = document.getElementById('bpm-number-input');
    const current = parseInt(bpmInput?.value || state.baseBpm || 120, 10) || 120;
    const next = Math.max(20, Math.min(240, current + delta));
    state.baseBpm = next;
    updateBPM(next);
    if (bpmInput) bpmInput.value = next;
  }

  function nudgeSpeed(delta) {
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

  /**
   * Hydralisk Sketch Manager & Gallery Module
   * Handles loading, search filtering, tag categorization, DOM rendering, code execution, and history tracking.
   */


  /**
   * Load all sketches from Cloud drafts, sketches.json, and localStorage
   */
  async function loadAllSketches() {
    state.sketchesList = [];
    let sourceSketches = [];

    // 1. Fetch from Amakit (if authenticated)
    if (window.amakit && window.amakit.isAuthenticated) {
      try {
        showToast("Syncing sketches from Cloud...");
        await window.amakit.loadDrafts();
        sourceSketches = window.amakit.draftCache || [];
        showToast(`Loaded ${sourceSketches.length} remote sketches`);
      } catch (e) {
        console.error("Failed to load drafts from Amakit", e);
        showToast("Cloud sync failed. Loading backup.", true);
      }
    }

    // 2. Fetch from sketches.json
    if (sourceSketches.length === 0) {
      try {
        const response = await fetch('sketches.json');
        if (response.ok) {
          sourceSketches = await response.json();
        }
      } catch (e) {
        console.warn("Could not fetch sketches.json", e);
      }
    }

    // 3. Load custom sketches from local storage
    let localSketches = [];
    try {
      const localRaw = localStorage.getItem('mySketches');
      if (localRaw) {
        localSketches = JSON.parse(localRaw);
      }
    } catch (e) {
      console.warn("Could not load mySketches from localStorage", e);
    }

    // 4. Merge by name
    const mergedMap = {};

    sourceSketches.forEach(s => {
      s.isLocal = false;
      s.author = s.author || "Hydralisk Team";
      s.bpm = s.bpm || 120;
      s.metadata = s.metadata || { tags: [] };
      s.metadata.tags = s.metadata.tags || [];
      mergedMap[s.name] = s;
    });

    localSketches.forEach(s => {
      const sketchCopy = { ...s };
      sketchCopy.isLocal = true;
      sketchCopy.author = sketchCopy.author || "You (Local)";
      sketchCopy.bpm = sketchCopy.bpm || 120;
      sketchCopy.metadata = sketchCopy.metadata || { tags: ["local"] };
      sketchCopy.metadata.tags = sketchCopy.metadata.tags || ["local"];

      if (!sketchCopy.code && sketchCopy.fullDraft) {
        try {
          sketchCopy.code = atob(sketchCopy.fullDraft);
        } catch (e) {
          sketchCopy.code = sketchCopy.fullDraft;
        }
      }

      mergedMap[sketchCopy.name] = sketchCopy;
    });

    state.sketchesList = Object.values(mergedMap);

    if (state.sketchesList.length === 0) {
      state.sketchesList.push({
        name: "Nebula Glitch",
        author: "Hydra Synth",
        bpm: 120,
        code: "osc(40, 0.05, 1.5).modulate(noise(4), 0.5).colorama(0.4).out(o0);",
        metadata: { tags: ["glitch", "colorful"] }
      });
    }

    state.filteredSketchesList = [...state.sketchesList];
    renderSketchesList();
    renderTagFilters();
  }

  /**
   * Render tag pills in the Library tab
   */
  function renderTagFilters() {
    const container = document.getElementById('tag-filters-list');
    if (!container) return;

    const tags = new Set();
    state.sketchesList.forEach(s => {
      if (s.metadata && s.metadata.tags) {
        s.metadata.tags.forEach(t => tags.add(t));
      }
    });

    container.innerHTML = '';

    const allTagBtn = document.createElement('div');
    allTagBtn.className = `filter-tag ${state.activeTags.size === 0 ? 'active' : ''}`;
    allTagBtn.innerText = "All";
    allTagBtn.onclick = () => {
      state.activeTags.clear();
      filterSketches();
      renderTagFilters();
    };
    container.appendChild(allTagBtn);

    tags.forEach(tag => {
      const tagBtn = document.createElement('div');
      tagBtn.className = `filter-tag ${state.activeTags.has(tag) ? 'active' : ''}`;
      tagBtn.innerText = tag;
      tagBtn.onclick = () => {
        if (state.activeTags.has(tag)) {
          state.activeTags.delete(tag);
        } else {
          state.activeTags.add(tag);
        }
        filterSketches();
        renderTagFilters();
      };
      container.appendChild(tagBtn);
    });
  }

  /**
   * Filter sketches list based on search query and active tags
   */
  function filterSketches() {
    const searchInput = document.getElementById('sketch-search-input');
    const query = (searchInput?.value || '').toLowerCase();

    state.filteredSketchesList = state.sketchesList.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(query) || s.author.toLowerCase().includes(query);

      let tagMatch = true;
      if (state.activeTags.size > 0) {
        tagMatch = s.metadata && s.metadata.tags && s.metadata.tags.some(t => state.activeTags.has(t));
      }

      return nameMatch && tagMatch;
    });

    renderSketchesList();
  }

  /**
   * Render the filtered sketches into sidebar list container
   */
  function renderSketchesList() {
    const container = document.getElementById('sketches-list-container');
    if (!container) return;

    container.innerHTML = '';

    const builtIns = state.filteredSketchesList.filter(s => !s.isLocal);
    const locals = state.filteredSketchesList.filter(s => s.isLocal);

    if (locals.length > 0) {
      const title = document.createElement('div');
      title.className = 'sketches-section-title';
      title.innerText = "Your Sketches (Local)";
      container.appendChild(title);

      locals.forEach(s => {
        const idx = state.sketchesList.indexOf(s);
        container.appendChild(createSketchItemNode(s, idx));
      });
    }

    if (builtIns.length > 0) {
      const title = document.createElement('div');
      title.className = 'sketches-section-title';
      title.innerText = "Built-in Library";
      container.appendChild(title);

      builtIns.forEach(s => {
        const idx = state.sketchesList.indexOf(s);
        container.appendChild(createSketchItemNode(s, idx));
      });
    }

    if (state.filteredSketchesList.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">No sketches found</div>';
    }
  }

  /**
   * Create DOM node for sketch item in library list
   */
  function createSketchItemNode(sketch, index) {
    const div = document.createElement('div');
    div.className = `sketch-item ${state.currentSketchIndex === index ? 'active' : ''}`;
    div.onclick = () => playSketch(index);

    const tagsStr = (sketch.metadata && sketch.metadata.tags) ? sketch.metadata.tags.join(', ') : '';

    div.innerHTML = `
    <div class="sketch-item-info">
      <span class="sketch-item-name">${sketch.name}</span>
      <span class="sketch-item-meta">by ${sketch.author} ${tagsStr ? '• ' + tagsStr : ''}</span>
    </div>
    <div class="sketch-item-indicator"></div>
  `;
    return div;
  }

  /**
   * Play sketch by index
   * @param {number} index 
   */
  function playSketch(index) {
    if (typeof index === 'string') {
      const foundIdx = state.sketchesList.findIndex(s => s.name && s.name.toLowerCase() === index.toLowerCase());
      if (foundIdx >= 0) {
        index = foundIdx;
      } else {
        console.warn(`Sketch not found: ${index}`);
        return;
      }
    }

    if (typeof index !== 'number' || index < 0 || index >= state.sketchesList.length) return;

    state.currentSketchIndex = index;
    const sketch = state.sketchesList[index];

    if (sketch && sketch.name) {
      try {
        localStorage.setItem('lastSelectedSketchName', sketch.name);
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location);
          url.searchParams.set('sketch', sketch.name);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (e) {}
    }

    renderSketchesList();

    state.baseBpm = sketch.bpm || 120;
    updateBPM(state.baseBpm);

    window.speed = 1.0;
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    if (speedSlider) speedSlider.value = "1.0";
    if (speedVal) speedVal.innerText = '1.0x';

    state.mutationHistory = [sketch.code];
    state.mutationHistoryIndex = 0;
    updateMutationUndoRedoButtons();

    if (typeof hush === 'function') hush();

    try {
      const wrappedCode = `(() => {
      ${sketch.code}
    })()
//# sourceURL=hydra-sketch-${sketch.name.replace(/\s+/g, '-').toLowerCase()}.js\n`;

      eval(wrappedCode);
      updateNowPlaying(sketch);
      showToast(`Loaded: ${sketch.name}`);
    } catch (err) {
      console.error("Evaluation error:", err);
      showError(err);
      if (typeof hush === 'function') hush();
      if (typeof osc === 'function') osc(10, 0, 1.5).color(1, 0, 0).diff(noise(2)).out();
    }
  }

  /**
   * Update HUD metadata card and code textarea
   */
  function updateNowPlaying(sketch) {
    const nameEl = document.getElementById('playing-sketch-name');
    const authorEl = document.getElementById('playing-sketch-author');
    const bpmEl = document.getElementById('playing-sketch-bpm');
    const tagsContainer = document.getElementById('playing-sketch-tags');
    const codeBox = document.getElementById('editor-textarea');
    const midiDot = document.getElementById('midi-status-dot');

    if (nameEl) nameEl.innerText = sketch.name;
    if (authorEl) authorEl.innerText = sketch.author;
    if (bpmEl) bpmEl.innerText = (sketch.bpm || 120) + " BPM";

    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      if (sketch.metadata && sketch.metadata.tags) {
        sketch.metadata.tags.forEach(tag => {
          const span = document.createElement('span');
          span.className = 'sketch-tag';
          span.innerText = tag;
          tagsContainer.appendChild(span);
        });
      }
    }

    if (codeBox) {
      codeBox.value = sketch.code || '';
    }

    if (midiDot) {
      if (sketch.midi) {
        midiDot.classList.add('midi-active');
        midiDot.title = "Uses MIDI input";
      } else {
        midiDot.classList.remove('midi-active');
        midiDot.title = "No MIDI required";
      }
    }
  }

  /**
   * Run modified custom code from editor tab
   */
  function runCustomCode() {
    const codeBox = document.getElementById('editor-textarea');
    if (!codeBox) return;
    const code = codeBox.value;
    if (typeof hush === 'function') hush();

    try {
      const wrappedCode = `(() => {
      ${code}
    })()
//# sourceURL=hydra-custom-sketch.js\n`;

      eval(wrappedCode);
      showToast("Code updated & running");

      const nameEl = document.getElementById('playing-sketch-name');
      const authorEl = document.getElementById('playing-sketch-author');
      if (nameEl) nameEl.innerText = "Custom Edit";
      if (authorEl) authorEl.innerText = "Developer Session";

      saveMutationToHistory(code);
    } catch (err) {
      console.error("Evaluation error:", err);
      showError(err);
      if (typeof hush === 'function') hush();
      if (typeof osc === 'function') osc(10, 0, 1.5).color(1, 0, 0).diff(noise(2)).out();
    }
  }

  /**
   * Reset custom code back to original active sketch code
   */
  function resetCustomCode() {
    if (state.currentSketchIndex >= 0 && state.currentSketchIndex < state.sketchesList.length) {
      const originalCode = state.sketchesList[state.currentSketchIndex].code;
      const codeBox = document.getElementById('editor-textarea');
      if (codeBox) codeBox.value = originalCode;
      playSketch(state.currentSketchIndex);
      showToast("Sketch code reset");
    }
  }

  // src/player/ui.js - Tab switching, collapse panels, mobile HUD detection, Cloud auth UI

  function switchTab(tabId) {
    state.currentTab = tabId;

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.id === `${tabId}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  function isMobileDevice() {
    return window.matchMedia('(max-width: 768px)').matches ||
           ('ontouchstart' in window && window.innerWidth <= 1024) ||
           /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isUIHidden() {
    const panel = document.getElementById('sidebar-panel');
    const shortcuts = document.getElementById('shortcuts-panel');
    if (!panel || !shortcuts) return false;
    return panel.classList.contains('collapsed') && shortcuts.classList.contains('hidden');
  }

  function updateTouchActionsUI() {
    const overlay = document.getElementById('touch-actions-overlay');
    const floatingActions = document.getElementById('floating-hud-actions');
    const hudBtn = document.getElementById('touch-actions-hud-btn');
    const floatingBtn = document.getElementById('touch-actions-floating-btn');
    const shortcuts = document.getElementById('shortcuts-panel');
    const intercomBar = document.getElementById('intercom-bar');
    const isMobile = isMobileDevice();
    const hidden = isUIHidden();

    // If HUD is closed / hidden, hide the intercom bar as part of the HUD
    if (intercomBar) {
      intercomBar.classList.toggle('hidden', hidden);
    }

    // On mobile screens, hide QWERTY keyboard shortcuts guide and auto-enable touch mode
    if (isMobile) {
      if (shortcuts) {
        shortcuts.classList.add('hidden');
      }
    }

    if (floatingActions) {
      floatingActions.classList.toggle('visible', hidden || isMobile);
    }
    if (overlay) {
      overlay.classList.toggle('visible', (isMobile || hidden) && state.touchActionsEnabled);
    }
    if (hudBtn) {
      hudBtn.classList.toggle('active', state.touchActionsEnabled);
    }
    if (floatingBtn) {
      floatingBtn.classList.toggle('active', state.touchActionsEnabled);
    }
  }

  function toggleCollapse() {
    state.isPanelCollapsed = !state.isPanelCollapsed;
    const panel = document.getElementById('sidebar-panel');
    const trigger = document.getElementById('expand-trigger');

    if (state.isPanelCollapsed) {
      panel.classList.add('collapsed');
      trigger.classList.add('visible');
    } else {
      panel.classList.remove('collapsed');
      trigger.classList.remove('visible');
    }

    updateTouchActionsUI();
    syncPerformanceSettingsToHash();
  }

  function toggleTouchActions() {
    state.touchActionsEnabled = !state.touchActionsEnabled;
    updateTouchActionsUI();
    intercomNotify(state.touchActionsEnabled ? "Touch actions enabled" : "Touch actions disabled");
  }

  function toggleUI() {
    const panel = document.getElementById('sidebar-panel');
    const shortcuts = document.getElementById('shortcuts-panel');
    const trigger = document.getElementById('expand-trigger');

    const hidden = isUIHidden();

    if (hidden) {
      panel.classList.remove('collapsed');
      shortcuts.classList.remove('hidden');
      trigger.classList.remove('visible');
      state.isPanelCollapsed = false;
      intercomNotify("Interface shown");
    } else {
      panel.classList.add('collapsed');
      shortcuts.classList.add('hidden');
      trigger.classList.remove('visible');
      state.isPanelCollapsed = true;
      intercomNotify("Interface hidden. Press 'H' to show again.");
    }

    updateTouchActionsUI();
    syncPerformanceSettingsToHash();
  }

  function openEditorWithCurrentSketch() {
    let sketchName = '';
    if (state.sketchesList && state.sketchesList[state.currentSketchIndex]) {
      sketchName = state.sketchesList[state.currentSketchIndex].name;
    }
    if (!sketchName) {
      try {
        sketchName = localStorage.getItem('lastSelectedSketchName') || '';
      } catch (e) {}
    }
    const targetUrl = sketchName ? `index.html?sketch=${encodeURIComponent(sketchName)}` : 'index.html';
    window.location.href = targetUrl;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        showError(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  function handleCloudLogin() {
    if (!window.amakit) {
      showError("Amakit module not loaded");
      return;
    }

    window.amakit.login(true)
      .then(() => {
        intercomNotify("Successfully authenticated with Cloud!");
        updateAuthUI(true);
        loadAllSketches();
      })
      .catch((err) => {
        showError(err || "Login failed");
        updateAuthUI(false);
      });
  }

  function updateAuthUI(isAuthenticated) {
    const dot = document.getElementById('cloud-status-dot');
    const btn = document.getElementById('cloud-login-btn');
    if (dot && btn) {
      if (isAuthenticated) {
        dot.classList.add('active');
        dot.title = "Connected to Cloud";
        btn.innerText = "Disconnect";
        btn.onclick = () => {
          localStorage.removeItem("awsCredentials");
          if (window.amakit) window.amakit.isAuthenticated = false;
          updateAuthUI(false);
          intercomNotify("Disconnected from Cloud");
          loadAllSketches();
        };
      } else {
        dot.classList.remove('active');
        dot.title = "Not connected to Cloud";
        btn.innerText = "Login to Cloud";
        btn.onclick = () => handleCloudLogin();
      }
    }
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
   * Hydralisk Performance Settings Hash Sync & Protocol Handler
   * Manages encoding and decoding performance state in URL hash fragments.
   */


  /**
   * Sync current live performance state to URL location.hash fragment according to protocol: #b120|h1|m4|s10
   */
  function syncPerformanceSettingsToHash() {
    if (window.playerSettings && typeof window.playerSettings.syncToHash === 'function') {
      window.playerSettings.syncToHash({
        bpm: window.bpm || state.baseBpm || 120,
        hud: isUIHidden() ? 0 : 1,
        automutate: state.automutateMode || 'off',
        speed: window.speed || 1.0
      });
    }
  }

  /**
   * Decode performance state from location.hash fragment and apply to player state
   */
  function applySettingsFromHash() {
    if (!window.playerSettings || typeof window.playerSettings.decode !== 'function') return;
    const settings = window.playerSettings.decode(window.location.hash);

    if (typeof settings.bpm === 'number') {
      state.baseBpm = settings.bpm;
      updateBPM(settings.bpm);
    }

    if (typeof settings.hud === 'number') {
      const isHidden = isUIHidden();
      if (settings.hud === 0 && !isHidden) {
        toggleUI();
      } else if (settings.hud === 1 && isHidden) {
        toggleUI();
      }
    }

    if (settings.automutate) {
      setAutomutateMode(settings.automutate, true);
    }

    if (typeof settings.speed === 'number') {
      window.speed = settings.speed;
      const speedSlider = document.getElementById('speed-slider');
      const speedVal = document.getElementById('speed-val');
      if (speedSlider) speedSlider.value = settings.speed.toFixed(1);
      if (speedVal) speedVal.innerText = `${settings.speed.toFixed(1)}x`;
    }
  }

  /**
   * Hydralisk Engine & Canvas Lifecycle Module
   * Handles Hydra engine initialization, audio context startup, resolution updates, and backup pattern fallback.
   */


  /**
   * Resize Hydra canvas to fit current viewport resolution
   */
  function resizeCanvas() {
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
  async function startExperience() {
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
  function playBackupVisual() {
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

  // src/player/hotkeys.js - Keybindings and xemitter event listener setup for Hydralisk Player

  function setupHotkeysAndEvents() {
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

  // src/player/main.js - Entry point for modular Hydralisk Visual Player

  // Attach player settings to window
  window.playerSettings = playerSettings;

  // Bind all global functions to window for backward compatibility and inline HTML onclick handlers
  window.startExperience = startExperience;
  window.showToast = showToast;
  window.intercomNotify = intercomNotify;
  window.showError = showError;

  window.playSketch = playSketch;
  window.playPrevSketch = playPrevSketch;
  window.playNextSketch = playNextSketch;
  window.playRandomSketch = playRandomSketch;
  window.togglePlayPause = togglePlayPause;
  window.updatePlayPauseButton = updatePlayPauseButton;
  window.runCustomCode = runCustomCode;
  window.resetCustomCode = resetCustomCode;

  window.updateBPM = updateBPM;
  window.handleTapTempo = handleTapTempo;
  window.nudgeTempo = nudgeTempo;
  window.nudgeSpeed = nudgeSpeed;

  window.setAutomutateMode = setAutomutateMode;
  window.triggerMutation = triggerMutation;
  window.undoMutation = undoMutation;
  window.redoMutation = redoMutation;

  window.switchTab = switchTab;
  window.toggleCollapse = toggleCollapse;
  window.toggleUI = toggleUI;
  window.toggleTouchActions = toggleTouchActions;
  window.toggleFullscreen = toggleFullscreen;
  window.openEditorWithCurrentSketch = openEditorWithCurrentSketch;
  window.handleCloudLogin = handleCloudLogin;

  // Initialize event handlers & DOM hooks on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    setupHotkeysAndEvents();

    // Wire tab buttons
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      btn.onclick = () => switchTab(btn.getAttribute('data-tab'));
    });

    // Wire BPM Number Input
    const bpmInput = document.getElementById('bpm-number-input');
    if (bpmInput) {
      bpmInput.onchange = (e) => {
        const val = Math.max(20, Math.min(240, parseInt(e.target.value) || 120));
        state.baseBpm = val;
        updateBPM(val);
      };
    }

    // Wire Pitch Bend Fader
    const bendSlider = document.getElementById('bpm-bend-slider');
    if (bendSlider) {
      bendSlider.oninput = (e) => {
        const offsetPercent = parseFloat(e.target.value);
        const bentBpm = Math.round(state.baseBpm * (1 + offsetPercent / 100));
        updateBPM(bentBpm);
      };

      const resetBend = () => {
        state.baseBpm = window.bpm || 120;
        bendSlider.value = 0;
      };
      bendSlider.onmouseup = resetBend;
      bendSlider.ontouchend = resetBend;
    }

    // Wire Speed Slider
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    if (speedSlider && speedVal) {
      speedSlider.oninput = (e) => {
        const speed = parseFloat(e.target.value);
        if (state.isPlaying) {
          window.speed = speed;
        }
        speedVal.innerText = speed.toFixed(1) + 'x';
      };
    }

    // Wire sketch search input
    const searchInput = document.getElementById('sketch-search-input');
    if (searchInput) {
      searchInput.oninput = () => filterSketches();
    }

    // Request MIDI Access if supported
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(() => {
        const midiDot = document.getElementById('midi-indicator-dot');
        if (midiDot) midiDot.classList.add('active');
      }).catch(() => { });
    }

    // Check Amakit cloud credentials
    if (window.amakit) {
      const creds = window.amakit.getCredentials();
      if (creds) {
        window.amakit.login(false)
          .then(() => updateAuthUI(true))
          .catch(() => updateAuthUI(false));
      } else {
        updateAuthUI(false);
      }
    }

    if (isMobileDevice()) {
      state.touchActionsEnabled = true;
    }
    updateTouchActionsUI();
    window.addEventListener('resize', updateTouchActionsUI);

    // Auto-launch player experience if welcome screen was previously closed
    try {
      if (localStorage.getItem('welcomeScreenClosed') === 'true') {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';
        startExperience();
      }
    } catch (e) {}
  });

  exports.openEditorWithCurrentSketch = openEditorWithCurrentSketch;
  exports.playSketch = playSketch;
  exports.showToast = showToast;
  exports.startExperience = startExperience;
  exports.state = state;
  exports.toggleUI = toggleUI;

  return exports;

})({});
//# sourceMappingURL=player.dist.js.map
