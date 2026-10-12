// src/player/automutate.js - Auto-Mutate AST & regex engine and mutation history stack
import { state } from './state.js';
import { intercomNotify } from './intercom.js';
import { syncPerformanceSettingsToHash } from './settingsSync.js';

export function mutateCode(code, changeTransform = false) {
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

export function setAutomutateMode(mode, quiet = false) {
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

export function triggerMutation() {
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

export function saveMutationToHistory(code) {
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

export function undoMutation() {
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

export function redoMutation() {
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

export function updateMutationUndoRedoButtons() {
  const undoBtn = document.getElementById('mutation-undo-btn');
  const redoBtn = document.getElementById('mutation-redo-btn');
  if (undoBtn) undoBtn.disabled = state.mutationHistoryIndex <= 0;
  if (redoBtn) redoBtn.disabled = state.mutationHistoryIndex >= state.mutationHistory.length - 1;
}
