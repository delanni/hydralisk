// Player.js - Hydra synth visual player dashboard logic

let hydraInstance = null;
let sketchesList = [];
let filteredSketchesList = [];
let currentSketchIndex = 0;
let isPlaying = false;
let currentTab = 'library';
let activeTags = new Set();
let isPanelCollapsed = false;
let touchActionsEnabled = false;

// BPM & Pitch bend state
let baseBpm = 120;

// TAP tempo state
let tapTimes = [];

// Mutation state & history
let automutateIntervalId = null;
let automutateMode = 'off';
let mutationHistory = [];
let mutationHistoryIndex = -1;

// Toast helper
function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  const messageSpan = document.createElement('span');
  messageSpan.textContent = String(message);
  toast.appendChild(messageSpan);
  container.appendChild(toast);

  // Slide out and remove
  setTimeout(() => {
    toast.style.animation = 'slide-out-toast 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// Custom error logging
function showError(error) {
  showToast(error.message || error, true);
}

// Set canvas dimensions and update Hydra resolution
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

// Initialise Hydra and start the experience
async function startExperience() {
  const splash = document.getElementById('splash-screen');
  const canvas = document.getElementById('hydra-canvas');

  try {
    // Force canvas dimensions to fit window/screen resolution exactly
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialise audio context & Hydra
    // The user gesture (click start) is required for audio/midi
    if (typeof Hydra !== 'undefined') {
      hydraInstance = new Hydra({
        canvas: canvas,
        detectAudio: true,
        makeGlobal: true, // This populates window with osc, shape, src, solid etc.
        width: window.innerWidth,
        height: window.innerHeight
      });

      // Listen for window resize to dynamically update resolution
      window.addEventListener('resize', resizeCanvas);

      // Let's hide the canvas visualizer that hydra-synth creates inside document.body by default if any
      const hydraAudioCanvas = document.querySelector('body > canvas:not(#hydra-canvas)');
      if (hydraAudioCanvas) {
        hydraAudioCanvas.id = 'audio-canvas';
      }
    } else {
      throw new Error('Hydra player engine library not loaded. Check CDN link.');
    }

    // Fade out splash
    splash.style.opacity = 0;
    setTimeout(() => {
      splash.style.display = 'none';
      isPlaying = true;
      updatePlayPauseButton();

      // Start checking for volume reactivity
      startVolumeMeter();
    }, 500);

    // Load sketches
    await loadAllSketches();

    // Play default or first sketch
    if (sketchesList.length > 0) {
      playSketch(0);
    } else {
      // Play a simple backup visual if no sketches
      playBackupVisual();
    }

    showToast("Visual engine initialized successfully");
  } catch (err) {
    console.error(err);
    showToast("Failed to initialize engine: " + err.message, true);
  }
}

// Backup visual if sketch fetching fails
function playBackupVisual() {
  hush();
  osc(10, 0.1, 1.2)
    .color(0.2, 0.7, 0.9)
    .rotate(0.1, 0.05)
    .out(o0);

  updateNowPlaying({
    name: "Default Oscillation",
    author: "System",
    bpm: 120,
    code: "osc(10, 0.1, 1.2).color(0.2, 0.7, 0.9).rotate(0.1, 0.05).out(o0);"
  });
}

// Load sketches from sketches.json and local storage
async function loadAllSketches() {
  sketchesList = [];
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

  // 2. Fetch from sketches.json (if not authenticated, or amakit fetch failed/returned empty)
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

  // 3. Load custom sketches from local storage (mySketches)
  let localSketches = [];
  try {
    const localRaw = localStorage.getItem('mySketches');
    if (localRaw) {
      localSketches = JSON.parse(localRaw);
    }
  } catch (e) {
    console.warn("Could not load mySketches from localStorage", e);
  }

  // 4. Merge by name (Local overrides remote/built-in)
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

    // Handle code format
    if (!sketchCopy.code && sketchCopy.fullDraft) {
      try {
        sketchCopy.code = atob(sketchCopy.fullDraft);
      } catch (e) {
        sketchCopy.code = sketchCopy.fullDraft;
      }
    }

    // Local creation overrides remote/built-in
    mergedMap[sketchCopy.name] = sketchCopy;
  });

  sketchesList = Object.values(mergedMap);

  // Fallback if empty
  if (sketchesList.length === 0) {
    sketchesList.push({
      name: "Nebula Glitch",
      author: "Hydra Synth",
      bpm: 120,
      code: "osc(40, 0.05, 1.5).modulate(noise(4), 0.5).colorama(0.4).out(o0);",
      metadata: { tags: ["glitch", "colorful"] }
    });
  }

  filteredSketchesList = [...sketchesList];
  renderSketchesList();
  renderTagFilters();
}

// Render the tags in the Library tab
function renderTagFilters() {
  const container = document.getElementById('tag-filters-list');
  if (!container) return;

  // Gather all unique tags
  const tags = new Set();
  sketchesList.forEach(s => {
    if (s.metadata && s.metadata.tags) {
      s.metadata.tags.forEach(t => tags.add(t));
    }
  });

  container.innerHTML = '';

  // Add "All" tag
  const allTagBtn = document.createElement('div');
  allTagBtn.className = `filter-tag ${activeTags.size === 0 ? 'active' : ''}`;
  allTagBtn.innerText = "All";
  allTagBtn.onclick = () => {
    activeTags.clear();
    filterSketches();
    renderTagFilters();
  };
  container.appendChild(allTagBtn);

  // Add individual tags
  tags.forEach(tag => {
    const tagBtn = document.createElement('div');
    tagBtn.className = `filter-tag ${activeTags.has(tag) ? 'active' : ''}`;
    tagBtn.innerText = tag;
    tagBtn.onclick = () => {
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
      } else {
        activeTags.add(tag);
      }
      filterSketches();
      renderTagFilters();
    };
    container.appendChild(tagBtn);
  });
}

// Filter sketches list based on search query and active tags
function filterSketches() {
  const query = document.getElementById('sketch-search-input').value.toLowerCase();

  filteredSketchesList = sketchesList.filter(s => {
    const nameMatch = s.name.toLowerCase().includes(query) || s.author.toLowerCase().includes(query);

    let tagMatch = true;
    if (activeTags.size > 0) {
      tagMatch = s.metadata && s.metadata.tags && s.metadata.tags.some(t => activeTags.has(t));
    }

    return nameMatch && tagMatch;
  });

  renderSketchesList();
}

// Render the filtered sketches in the sidebar scroll area
function renderSketchesList() {
  const container = document.getElementById('sketches-list-container');
  if (!container) return;

  container.innerHTML = '';

  const builtIns = filteredSketchesList.filter(s => !s.isLocal);
  const locals = filteredSketchesList.filter(s => s.isLocal);

  if (locals.length > 0) {
    const title = document.createElement('div');
    title.className = 'sketches-section-title';
    title.innerText = "Your Sketches (Local)";
    container.appendChild(title);

    locals.forEach(s => {
      const idx = sketchesList.indexOf(s);
      container.appendChild(createSketchItemNode(s, idx));
    });
  }

  if (builtIns.length > 0) {
    const title = document.createElement('div');
    title.className = 'sketches-section-title';
    title.innerText = "Built-in Library";
    container.appendChild(title);

    builtIns.forEach(s => {
      const idx = sketchesList.indexOf(s);
      container.appendChild(createSketchItemNode(s, idx));
    });
  }

  if (filteredSketchesList.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">No sketches found</div>';
  }
}

// Create a DOM node for a sketch list entry
function createSketchItemNode(sketch, index) {
  const div = document.createElement('div');
  div.className = `sketch-item ${currentSketchIndex === index ? 'active' : ''}`;
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

// Update the active BPM and controls
function updateBPM(newBpm) {
  window.bpm = newBpm;

  const numInput = document.getElementById('bpm-number-input');
  if (numInput) numInput.value = newBpm;

  // Re-adjust automutate interval if it is running
  if (automutateMode !== 'off') {
    setAutomutateMode(automutateMode, true); // Keep quiet
  }
}

// Tap Tempo logic
function handleTapTempo() {
  const now = performance.now();
  tapTimes.push(now);
  if (tapTimes.length > 4) {
    tapTimes.shift();
  }

  if (tapTimes.length >= 2) {
    let sum = 0;
    for (let i = 1; i < tapTimes.length; i++) {
      sum += (tapTimes[i] - tapTimes[i - 1]);
    }
    const avgMs = sum / (tapTimes.length - 1);
    const calculatedBPM = Math.round(60000 / avgMs);
    const clampedBPM = Math.max(20, Math.min(240, calculatedBPM));

    baseBpm = clampedBPM;
    updateBPM(clampedBPM);
  }

  // Flash TAP button
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

// Play a sketch by index
function playSketch(index) {
  if (index < 0 || index >= sketchesList.length) return;

  currentSketchIndex = index;
  const sketch = sketchesList[index];

  // Update selected class in list
  const items = document.querySelectorAll('.sketch-item');
  items.forEach((item, i) => {
    item.classList.remove('active');
  });
  renderSketchesList(); // Redraw selection

  // Set BPM and Speed defaults
  baseBpm = sketch.bpm || 120;
  updateBPM(baseBpm);

  window.speed = 1.0;
  document.getElementById('speed-slider').value = 1.0;
  document.getElementById('speed-val').innerText = '1.0x';

  // Reset mutation history
  mutationHistory = [sketch.code];
  mutationHistoryIndex = 0;
  updateMutationUndoRedoButtons();

  // Clean up and evaluate sketch code
  hush();

  try {
    // Evaluate inside IIFE to isolate scope variables
    // Source URL added for better DevTools experience
    const wrappedCode = `(() => {
      ${sketch.code}
    })()//# sourceURL=hydra-sketch-${sketch.name.replace(/\s+/g, '-').toLowerCase()}.js`;

    eval(wrappedCode);

    // Update dashboard metadata
    updateNowPlaying(sketch);
    showToast(`Loaded: ${sketch.name}`);
  } catch (err) {
    console.error("Evaluation error:", err);
    showError(err);
    // Draw an error pattern
    hush();
    osc(10, 0, 1.5).color(1, 0, 0).diff(noise(2)).out();
  }
}

// Update the metadata card and editor textbox with the active sketch details
function updateNowPlaying(sketch) {
  document.getElementById('playing-sketch-name').innerText = sketch.name;
  document.getElementById('playing-sketch-author').innerText = sketch.author;
  document.getElementById('playing-sketch-bpm').innerText = sketch.bpm + " BPM";

  // Update tags list
  const tagsContainer = document.getElementById('playing-sketch-tags');
  tagsContainer.innerHTML = '';
  if (sketch.metadata && sketch.metadata.tags) {
    sketch.metadata.tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'sketch-tag';
      span.innerText = tag;
      tagsContainer.appendChild(span);
    });
  }

  // Update code textarea
  const codeBox = document.getElementById('editor-textarea');
  if (codeBox) {
    codeBox.value = sketch.code;
  }

  // Check if midi mapping is noted
  const midiDot = document.getElementById('midi-status-dot');
  if (sketch.midi) {
    midiDot.classList.add('midi-active');
    midiDot.title = "Uses MIDI input";
  } else {
    midiDot.classList.remove('midi-active');
    midiDot.title = "No MIDI required";
  }
}

// Update play pause button styling
function updatePlayPauseButton() {
  const btn = document.getElementById('play-pause-btn');
  if (isPlaying) {
    // Show Pause icon
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>
    `;
    btn.title = "Pause Loop (Space)";
  } else {
    // Show Play icon
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
    btn.title = "Resume Loop (Space)";
  }
}

// Toggle play/pause of the global visual loop
function togglePlayPause() {
  if (!hydraInstance) return;
  isPlaying = !isPlaying;

  if (isPlaying) {
    // Resume loop
    window.speed = parseFloat(document.getElementById('speed-slider').value) || 1.0;
    showToast("Visuals resumed");
  } else {
    // Pause loop by setting speed to 0
    window.speed = 0;
    showToast("Visuals paused");
  }
  updatePlayPauseButton();
}

// Play previous sketch
function playPrevSketch() {
  if (sketchesList.length === 0) return;
  let prevIdx = currentSketchIndex - 1;
  if (prevIdx < 0) prevIdx = sketchesList.length - 1;
  playSketch(prevIdx);
}

// Play next sketch
function playNextSketch() {
  if (sketchesList.length === 0) return;
  let nextIdx = (currentSketchIndex + 1) % sketchesList.length;
  playSketch(nextIdx);
}

// Play random sketch
function playRandomSketch() {
  if (sketchesList.length === 0) return;
  const randIdx = Math.floor(Math.random() * sketchesList.length);
  playSketch(randIdx);
}

// Run the custom code that the user modified in the Editor tab
function runCustomCode() {
  const code = document.getElementById('editor-textarea').value;
  hush();

  try {
    const wrappedCode = `(() => {
      ${code}
    })()//# sourceURL=hydra-custom-sketch.js`;

    eval(wrappedCode);
    showToast("Code updated & running");

    // Update current sketch item meta to indicate custom edit
    document.getElementById('playing-sketch-name').innerText = "Custom Edit";
    document.getElementById('playing-sketch-author').innerText = "Developer Session";

    // Save to history
    saveMutationToHistory(code);
  } catch (err) {
    console.error("Evaluation error:", err);
    showError(err);
    hush();
    osc(10, 0, 1.5).color(1, 0, 0).diff(noise(2)).out();
  }
}

// Reset custom code to original sketch code
function resetCustomCode() {
  if (currentSketchIndex >= 0 && currentSketchIndex < sketchesList.length) {
    const originalCode = sketchesList[currentSketchIndex].code;
    document.getElementById('editor-textarea').value = originalCode;
    playSketch(currentSketchIndex);
    showToast("Sketch code reset");
  }
}

// Regex-based code mutator (lightweight AST alternative)
function mutateCode(code, changeTransform) {
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

  // Literal numerical mutation (fallback if transform mutation is disabled/not found)
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
      // Scale number value between 0 and 2x its original size
      newVal = Math.round((Math.random() * oldVal * 2) * 1000) / 1000;
    }

    const before = code.substring(0, index);
    const after = code.substring(index + oldStr.length);
    console.log(`Mutator: changing number ${oldStr} to ${newVal}`);
    return before + String(newVal) + after;
  }

  return code;
}

// Set Auto-Mutate mode and setup intervals
function setAutomutateMode(mode, quiet = false) {
  automutateMode = mode;

  if (automutateIntervalId) {
    clearInterval(automutateIntervalId);
    automutateIntervalId = null;
  }

  // Update buttons state in UI
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
    if (!quiet) showToast("Auto-Mutate disabled");
    return;
  }

  // Calculate timeout based on BPM
  // multiplier corresponds to beats: 1x (1 beat), 2x (2 beats), 4x (4 beats), 8x (8 beats), 16x (16 beats)
  const msPerBeat = 60000 / window.bpm;
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
    showToast(`Auto-Mutate active (every ${multiplier === 1 ? 'beat' : multiplier + ' beats'})`);
  }

  automutateIntervalId = setInterval(() => {
    triggerMutation();
  }, timeoutMs);
}

// Mutate current active sketch code and run it
function triggerMutation() {
  const textarea = document.getElementById('editor-textarea');
  if (!textarea) return;
  const currentCode = textarea.value;

  // 50% chance to mutate transform vs literal
  const changeTransform = Math.random() > 0.5;
  const newCode = mutateCode(currentCode, changeTransform);

  if (newCode !== currentCode) {
    try {
      hush();
      const wrappedCode = `(() => {
        ${newCode}
      })()//# sourceURL=hydra-mutated-sketch.js`;
      eval(wrappedCode);

      textarea.value = newCode;
      saveMutationToHistory(newCode);

      // Visual feedback in HUD sketch card
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

// History Management for Mutations
function saveMutationToHistory(code) {
  // Truncate undone future
  if (mutationHistoryIndex < mutationHistory.length - 1) {
    mutationHistory = mutationHistory.slice(0, mutationHistoryIndex + 1);
  }
  mutationHistory.push(code);
  if (mutationHistory.length > 50) {
    mutationHistory.shift();
  }
  mutationHistoryIndex = mutationHistory.length - 1;
  updateMutationUndoRedoButtons();
}

function undoMutation() {
  if (mutationHistoryIndex > 0) {
    mutationHistoryIndex--;
    const code = mutationHistory[mutationHistoryIndex];
    hush();
    eval(`(() => { ${code} })()`);
    document.getElementById('editor-textarea').value = code;
    showToast("Mutation undone");
    updateMutationUndoRedoButtons();
  }
}

function redoMutation() {
  if (mutationHistoryIndex < mutationHistory.length - 1) {
    mutationHistoryIndex++;
    const code = mutationHistory[mutationHistoryIndex];
    hush();
    eval(`(() => { ${code} })()`);
    document.getElementById('editor-textarea').value = code;
    showToast("Mutation redone");
    updateMutationUndoRedoButtons();
  }
}

function updateMutationUndoRedoButtons() {
  const undoBtn = document.getElementById('mutation-undo-btn');
  const redoBtn = document.getElementById('mutation-redo-btn');
  if (undoBtn) undoBtn.disabled = mutationHistoryIndex <= 0;
  if (redoBtn) redoBtn.disabled = mutationHistoryIndex >= mutationHistory.length - 1;
}

// Tab switcher
function switchTab(tabId) {
  currentTab = tabId;

  // Toggle buttons
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle contents
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Sidebar toggle collapse
function toggleCollapse() {
  isPanelCollapsed = !isPanelCollapsed;
  const panel = document.getElementById('sidebar-panel');
  const trigger = document.getElementById('expand-trigger');

  if (isPanelCollapsed) {
    panel.classList.add('collapsed');
    trigger.classList.add('visible');
  } else {
    panel.classList.remove('collapsed');
    trigger.classList.remove('visible');
  }

  updateTouchActionsUI();
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
  const hidden = isUIHidden();

  if (floatingActions) {
    floatingActions.classList.toggle('visible', hidden);
  }
  if (overlay) {
    overlay.classList.toggle('visible', hidden && touchActionsEnabled);
  }
  if (hudBtn) {
    hudBtn.classList.toggle('active', touchActionsEnabled);
  }
  if (floatingBtn) {
    floatingBtn.classList.toggle('active', touchActionsEnabled);
  }
}

function toggleTouchActions() {
  touchActionsEnabled = !touchActionsEnabled;
  updateTouchActionsUI();
  showToast(touchActionsEnabled ? "Touch actions enabled" : "Touch actions disabled");
}

function nudgeTempo(delta) {
  const bpmInput = document.getElementById('bpm-number-input');
  const current = parseInt(bpmInput?.value || baseBpm || 120, 10) || 120;
  const next = Math.max(20, Math.min(240, current + delta));
  baseBpm = next;
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
  if (isPlaying) {
    window.speed = rounded;
  }
  speedVal.innerText = `${rounded.toFixed(1)}x`;
}

// Toggle entire UI (hide all control bars for clean installation viewing)
function toggleUI() {
  const panel = document.getElementById('sidebar-panel');
  const shortcuts = document.getElementById('shortcuts-panel');
  const trigger = document.getElementById('expand-trigger');

  // Check if hidden (collapsed and shortcuts hidden)
  const isHidden = panel.classList.contains('collapsed') && shortcuts.classList.contains('hidden');

  if (isHidden) {
    // Show back
    panel.classList.remove('collapsed');
    shortcuts.classList.remove('hidden');
    trigger.classList.remove('visible');
    isPanelCollapsed = false;
    showToast("Interface shown");
  } else {
    // Hide all
    panel.classList.add('collapsed');
    shortcuts.classList.add('hidden');
    trigger.classList.remove('visible');
    isPanelCollapsed = true;
    showToast("Interface hidden. Press 'H' to show again.");
  }

  updateTouchActionsUI();
}

// Fullscreen toggle helper
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      showToast(`Error enabling fullscreen: ${err.message}`, true);
    });
  } else {
    document.exitFullscreen();
  }
}

// Cloud Synchronization Login Handler
function handleCloudLogin() {
  if (!window.amakit) {
    showToast("Amakit module not loaded", true);
    return;
  }

  window.amakit.login(true)
    .then(() => {
      showToast("Successfully authenticated with Cloud!");
      updateAuthUI(true);
      loadAllSketches();
    })
    .catch((err) => {
      showError(err || "Login failed");
      updateAuthUI(false);
    });
}

// Update Cloud Authentication UI Status
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
        showToast("Disconnected from Cloud");
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

// Hook up Event Emitter for midi-mapping.js integration
if (window.xemitter) {
  window.xemitter.on("gallery:nextSketch", () => playNextSketch());
  window.xemitter.on("gallery:prevSketch", (payload) => {
    if (payload && payload.backwards) {
      playPrevSketch();
    } else {
      playNextSketch();
    }
  });
  window.xemitter.on("gallery:randomSketch", () => playRandomSketch());
  window.xemitter.on("hideAll", () => toggleUI());
  window.xemitter.on("fullscreen", () => toggleFullscreen());
}

// Listen to keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // If editing code, don't trigger playback shortcuts
  if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
    return;
  }

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlayPause();
      break;
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

// Sound intensity tracking loop
function startVolumeMeter() {
  const audioIndicator = document.getElementById('audio-indicator-dot');

  function updateMeter() {
    if (window.a && typeof window.a.vol !== 'undefined') {
      audioIndicator.classList.add('active');
      const vol = window.a.vol;

      if (vol > 0.01) {
        audioIndicator.style.transform = `scale(${1 + vol * 0.15})`;
        audioIndicator.title = `Audio reactive active (Vol: ${vol.toFixed(2)})`;
      } else {
        audioIndicator.style.transform = 'scale(1)';
      }
    } else {
      audioIndicator.classList.remove('active');
    }
    requestAnimationFrame(updateMeter);
  }

  updateMeter();
}

// Initialise inputs on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
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
      baseBpm = val;
      updateBPM(val);
    };
  }

  // Wire Pitch Bend Fader
  const bendSlider = document.getElementById('bpm-bend-slider');
  if (bendSlider) {
    bendSlider.oninput = (e) => {
      const offsetPercent = parseFloat(e.target.value);
      const bentBpm = Math.round(baseBpm * (1 + offsetPercent / 100));
      updateBPM(bentBpm);
    };

    const resetBend = () => {
      baseBpm = window.bpm;
      bendSlider.value = 0;
    };
    bendSlider.onmouseup = resetBend;
    bendSlider.ontouchend = resetBend;
  }

  // Wire Speed Slider
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-val');
  speedSlider.oninput = (e) => {
    const speed = parseFloat(e.target.value);
    if (isPlaying) {
      window.speed = speed;
    }
    speedVal.innerText = speed.toFixed(1) + 'x';
  };

  // Wire sketch search and tags
  const searchInput = document.getElementById('sketch-search-input');
  searchInput.oninput = () => filterSketches();

  // Show loaded notifications for midi
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(() => {
      const midiDot = document.getElementById('midi-indicator-dot');
      if (midiDot) midiDot.classList.add('active');
    }).catch(() => { });
  }

  // Try quiet login on startup if credentials exist
  if (window.amakit) {
    const creds = window.amakit.getCredentials();
    if (creds) {
      window.amakit.login(false)
        .then(() => {
          updateAuthUI(true);
        })
        .catch(() => {
          updateAuthUI(false);
        });
    } else {
      updateAuthUI(false);
    }
  }

  updateTouchActionsUI();
});
