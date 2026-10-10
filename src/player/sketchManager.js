/**
 * Hydralisk Sketch Manager & Gallery Module
 * Handles loading, search filtering, tag categorization, DOM rendering, code execution, and history tracking.
 */

import { state } from './state.js';
import { showToast, showError } from './intercom.js';
import { updateBPM } from './controls.js';
import { saveMutationToHistory, updateMutationUndoRedoButtons } from './automutate.js';

/**
 * Load all sketches from Cloud drafts, sketches.json, and localStorage
 */
export async function loadAllSketches() {
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
export function renderTagFilters() {
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
export function filterSketches() {
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
export function renderSketchesList() {
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
export function createSketchItemNode(sketch, index) {
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
export function playSketch(index) {
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
export function updateNowPlaying(sketch) {
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
export function runCustomCode() {
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
export function resetCustomCode() {
  if (state.currentSketchIndex >= 0 && state.currentSketchIndex < state.sketchesList.length) {
    const originalCode = state.sketchesList[state.currentSketchIndex].code;
    const codeBox = document.getElementById('editor-textarea');
    if (codeBox) codeBox.value = originalCode;
    playSketch(state.currentSketchIndex);
    showToast("Sketch code reset");
  }
}
