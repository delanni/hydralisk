/**
 * MIDI Mapping Module for Hydra
 * Allows assigning Hydra actions to MIDI controls (CC and Note On).
 * Mappings are stored in localStorage and loaded on init.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "hydra-midi-mapping";
  const CC_TRIGGER_THRESHOLD = 0.5;
  const WAITING_TIMEOUT_MS = 15000;

  // Mappable actions: action ID -> config
  // Trigger: { action, payload?, label? } - emits event when CC > threshold or on note
  // Bind: { callback: (value) => {}, label? } - calls callback with CC value (0-1) on every change
  const MAPPABLE_ACTIONS = {
    "gallery:nextSketch": {
      action: "gallery:nextSketch",
      label: "Next sketch",
    },
    "gallery:prevSketch": {
      action: "gallery:nextSketch",
      payload: { backwards: true },
      label: "Prev sketch",
    },
    "editor:randomize": {
      action: "editor:randomize",
      label: "Randomize",
    },
    "editor:jumpBack1": {
      action: "editor:jumpBack1",
      label: "Jump back 1",
    },
    "editor:jumpBack2": {
      action: "editor:jumpBack2",
      label: "Jump back 2",
    },
    "gfx:speedReverse": {
      action: "gfx:speedReverse",
      label: "Speed reverse",
    },
    "editor:quickSave": {
      action: "editor:quickSave",
      label: "Quick save",
    },
    "editor:quickLoad": {
      action: "editor:quickLoad",
      label: "Quick load",
    },
    "editor:toggleAutomutate|off": {
      action: "editor:toggleAutomutate",
      payload: { lastCombo: "Shift-Ctrl-0" },
      label: "Automutate off",
    },
    "editor:toggleAutomutate|1x": {
      action: "editor:toggleAutomutate",
      payload: { lastCombo: "Shift-Ctrl-1" },
      label: "Automutate 1x",
    },
    "editor:toggleAutomutate|2x": {
      action: "editor:toggleAutomutate",
      payload: { lastCombo: "Shift-Ctrl-2" },
      label: "Automutate 2x",
    },
    "editor:toggleAutomutate|4x": {
      action: "editor:toggleAutomutate",
      payload: { lastCombo: "Shift-Ctrl-3" },
      label: "Automutate 4x",
    },
    "editor:toggleAutomutate|8x": {
      action: "editor:toggleAutomutate",
      payload: { lastCombo: "Shift-Ctrl-4" },
      label: "Automutate 8x",
    },
    "editor:toggleAutomutate|16x": {
      action: "editor:toggleAutomutate",
      payload: { lastCombo: "Shift-Ctrl-5" },
      label: "Automutate 16x",
    },
    // Example CC bind - callback receives normalized value (0-1)
    speed: {
      callback: (value) => {
        // value is between 0 and 1, it should be mapped to speed between
        // This is a logarithmic scale, so we need to use a logarithmic function to map the value to the speed.
        // value: 0 => 0
        // value: 0.5 => 1
        // value: 1 => 8
        const speed = Math.pow(2, value * 2) - 1;
        if (window.speed !== undefined) window.speed = speed;
      },
      label: "Speed (CC bind)",
    },
  };

  let mapping = {};
  let waitingForAction = null;
  let waitingTimeoutId = null;

  function loadMapping() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      mapping = stored ? JSON.parse(stored) : {};
      return mapping;
    } catch (e) {
      console.warn("MIDI Mapping: failed to load from localStorage", e);
      return {};
    }
  }

  function saveMapping() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
    } catch (e) {
      console.warn("MIDI Mapping: failed to save to localStorage", e);
    }
  }

  function getFullMapping() {
    return mapping;
  }

  function formatMappingDesc(m) {
    if (!m) return "—";
    if (m.type === "cc") return `CC ${m.control} (ch ${m.channel})`;
    if (m.type === "note") return `Note ${m.note} (ch ${m.channel})`;
    return "—";
  }

  function findActionForMessage(channel, type, controlOrNote) {
    const full = getFullMapping();
    for (const [action, m] of Object.entries(full)) {
      if (!m) continue;
      if (m.type === type && m.channel === channel) {
        if (type === "cc" && m.control === controlOrNote) return action;
        if (type === "note" && m.note === controlOrNote) return action;
      }
    }
    return null;
  }

  function createMIDIHandler() {
    return function handleMIDIMessage(midiMessage) {
      const data = midiMessage.data;
      if (!data || data.length < 3) return;

      const kind = data[0];
      const channel = kind & 0x0f;
      const byte1 = data[1];
      const byte2 = data[2];
      const valNormalized = (byte2 > 64 ? byte2 + 1 : byte2) / 128.0;

      // Update cc/ccc arrays (for CC messages)
      if ((kind & 0xf0) === 0xb0 && window.cc && window.ccc) {
        window.cc[byte1] = valNormalized;
        window.ccc[channel][byte1] = valNormalized;
        if (window.ccbind && !window.ccbind.includes(byte1)) {
          window.ccbind.push(byte1);
        }
      }

      // Check if we're in assignment waiting mode
      if (waitingForAction) {
        const config = MAPPABLE_ACTIONS[waitingForAction];
        const isBind = config && typeof config.callback === "function";
        let assignment = null;
        if ((kind & 0xf0) === 0xb0) {
          assignment = { type: "cc", channel, control: byte1 };
        } else if (!isBind && (kind & 0xf0) === 0x90 && byte2 > 0) {
          assignment = { type: "note", channel, note: byte1 };
        }
        if (assignment) {
          mapping[waitingForAction] = assignment;
          saveMapping();
          waitingForAction = null;
          if (waitingTimeoutId) {
            clearTimeout(waitingTimeoutId);
            waitingTimeoutId = null;
          }
          if (window.midiMapping && window.midiMapping.render) {
            window.midiMapping.render();
          }
        }
        return;
      }

      // Check mapping for action trigger or CC bind
      const status = kind & 0xf0;
      if (status === 0xb0) {
        const actionId = findActionForMessage(channel, "cc", byte1);
        if (actionId) {
          const config = MAPPABLE_ACTIONS[actionId];
          if (config) {
            if (typeof config.callback === "function") {
              config.callback(valNormalized);
            } else if (
              config.action &&
              valNormalized > CC_TRIGGER_THRESHOLD &&
              window.xemitter
            ) {
              window.xemitter.emit(config.action, config.payload || {});
            }
          }
        }
      } else if (status === 0x90 && byte2 > 0) {
        const actionId = findActionForMessage(channel, "note", byte1);
        if (actionId) {
          const config = MAPPABLE_ACTIONS[actionId];
          if (config && window.xemitter) {
            window.xemitter.emit(config.action, config.payload || {});
          }
        }
      }
    };
  }

  function setupMIDIHandler() {
    if (!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess().then(
      function (midiAccess) {
        const handler = createMIDIHandler();
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = handler;
        }
        console.log("MIDI Mapping: handler installed");
      },
      function () {
        console.warn("MIDI Mapping: could not access MIDI devices");
      },
    );
  }

  // --- Modal UI (vanilla DOM) ---
  let modalContainer = null;

  function createModal() {
    const container = document.createElement("div");
    container.id = "midi-mapping-app";
    document.body.appendChild(container);
    modalContainer = container;
    renderModal();
  }

  function renderModal() {
    if (!modalContainer) return;

    if (!document.body.contains(modalContainer)) {
      document.body.appendChild(modalContainer);
    }

    const fullMapping = getFullMapping();
    const isVisible = modalContainer.getAttribute("data-visible") === "true";

    modalContainer.innerHTML = "";
    if (!isVisible) return;

    const overlay = document.createElement("div");
    overlay.className = "midi-mapping-overlay";
    overlay.onclick = function (e) {
      if (e.target === overlay) toggleModal();
    };

    const modal = document.createElement("div");
    modal.className = "midi-mapping-modal";
    modal.onclick = function (e) {
      e.stopPropagation();
    };

    const header = document.createElement("div");
    header.className = "midi-mapping-header";
    header.innerHTML =
      '<h5>MIDI Mapping</h5><span class="midi-mapping-close">&times;</span>';
    header.querySelector(".midi-mapping-close").onclick = toggleModal;

    const body = document.createElement("div");
    body.className = "midi-mapping-body";

    const list = document.createElement("ul");
    list.className = "midi-mapping-list";

    for (const [actionId, config] of Object.entries(MAPPABLE_ACTIONS)) {
      const actionLabel = config.label || actionId;
      const li = document.createElement("li");
      li.className = "midi-mapping-row";
      const current = fullMapping[actionId];
      const isWaiting = waitingForAction === actionId;

      const label = document.createElement("span");
      label.className = "midi-mapping-action";
      label.textContent = actionLabel;

      const mappingSpan = document.createElement("span");
      mappingSpan.className = "midi-mapping-value";
      mappingSpan.textContent = isWaiting
        ? "Listening..."
        : formatMappingDesc(current);

      const assignBtn = document.createElement("button");
      assignBtn.className = "midi-mapping-btn";
      assignBtn.textContent = isWaiting ? "Cancel" : "Assign";
      assignBtn.disabled = isWaiting;
      assignBtn.onclick = function () {
        if (isWaiting) {
          waitingForAction = null;
          if (waitingTimeoutId) {
            clearTimeout(waitingTimeoutId);
            waitingTimeoutId = null;
          }
        } else {
          waitingForAction = actionId;
          if (waitingTimeoutId) clearTimeout(waitingTimeoutId);
          waitingTimeoutId = setTimeout(function () {
            waitingForAction = null;
            waitingTimeoutId = null;
            renderModal();
          }, WAITING_TIMEOUT_MS);
        }
        renderModal();
      };

      const clearBtn = document.createElement("button");
      clearBtn.className = "midi-mapping-btn midi-mapping-clear";
      clearBtn.textContent = "Clear";
      clearBtn.style.display =
        current && mapping[actionId] ? "inline-block" : "none";
      clearBtn.onclick = function () {
        delete mapping[actionId];
        saveMapping();
        renderModal();
      };

      li.appendChild(label);
      li.appendChild(mappingSpan);
      li.appendChild(assignBtn);
      li.appendChild(clearBtn);
      list.appendChild(li);
    }

    body.appendChild(list);
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    modalContainer.appendChild(overlay);
  }

  function toggleModal() {
    if (!modalContainer) return;
    const isVisible = modalContainer.getAttribute("data-visible") === "true";
    modalContainer.setAttribute("data-visible", !isVisible);
    renderModal();
  }

  function openModal() {
    if (!modalContainer) {
      createModal();
    }
    modalContainer.setAttribute("data-visible", "true");
    renderModal();
  }

  function init() {
    loadMapping();
    setupMIDIHandler();
    createModal();

    if (window.xemitter) {
      window.xemitter.on("midi-mapping:open", openModal);
    }

    window.midiMapping = {
      open: openModal,
      toggle: toggleModal,
      render: renderModal,
      getMapping: getFullMapping,
    };

    console.log("MIDI Mapping module loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
