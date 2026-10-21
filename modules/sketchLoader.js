/**
 * Canonical Sketch Loader & Metadata Services for Hydralisk
 * Consolidates sketch navigation (next, prev, random), loading, code/preamble formatting,
 * metadata cloning (preventing source object mutation), and persistent state tracking.
 */

export const sGet = (key) => {
  try {
    const variablesStr = localStorage.getItem("variables");
    const variablesObj = JSON.parse(variablesStr || "{}");
    return variablesObj[key];
  } catch (e) {
    return undefined;
  }
};

export const sPut = (key, value) => {
  try {
    const variablesStr = localStorage.getItem("variables") || "{}";
    const o = JSON.parse(variablesStr);
    o[key] = value;
    localStorage.setItem("variables", JSON.stringify(o));
  } catch (e) {
    console.error("[sketchLoader] Error saving variable:", e);
  }
};

export function deduplicateBy(array, field) {
  if (!Array.isArray(array)) return [];
  return Object.values(
    array.reduce((acc, s) => {
      if (s && s[field]) acc[s[field]] = s;
      return acc;
    }, {})
  );
}

export const parseCode = (url) => {
  try {
    return decodeURIComponent(atob(decodeURIComponent(url.split("code=")[1])));
  } catch (e) {
    return url;
  }
};

/** Internal metadata fields stripped when formatting sketch comments */
export const INTERNAL_METADATA_KEYS = ["bpm", "date", "local", "index", "type"];

/**
 * Creates a clean copy of metadata without modifying source sketch objects.
 * Validates quality metadata field to a numeric value between 1 and 5.
 */
export function cleanMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return {};
  const copy = { ...metadata };
  INTERNAL_METADATA_KEYS.forEach((key) => {
    delete copy[key];
  });
  if (copy.quality !== undefined) {
    const q = Number(copy.quality);
    if (copy.quality !== null && copy.quality !== "" && !isNaN(q) && q >= 1 && q <= 5) {
      copy.quality = Math.round(q);
    } else {
      delete copy.quality;
    }
  }
  return copy;
}

/**
 * Formats a sketch object into executable editor text with preamble comment and metadata trailer.
 * Safe from in-place mutation of the source sketch or its metadata object.
 */
export function formatSketchCode(sketch) {
  if (!sketch) return "";
  const name = (sketch.name || "Untitled").trim();
  const rawCode = (sketch.code || "").trim();

  // Combine sketch.metadata with any top-level quality property if present
  let rawMeta = sketch.metadata ? { ...sketch.metadata } : null;
  if (sketch.quality !== undefined && (!rawMeta || rawMeta.quality === undefined)) {
    rawMeta = { ...(rawMeta || {}), quality: sketch.quality };
  }

  let formattedCode = "";
  if (rawMeta) {
    const metaCopy = cleanMetadata(rawMeta);
    const preamble = `/* ${name} */`;
    const hasMetaKeys = Object.keys(metaCopy).length > 0;
    const metadataStr = hasMetaKeys ? `\n/* metadata = ${JSON.stringify(metaCopy)} */` : "";
    formattedCode = `${preamble}\n${rawCode}${metadataStr}`;
  } else {
    const preamble = `/* ${name} */\n`;
    if (rawCode.startsWith(preamble.slice(0, -2))) {
      formattedCode = rawCode;
    } else {
      formattedCode = preamble + rawCode;
    }
  }
  return formattedCode;
}

/**
 * Extracts sketch name and optional metadata JSON from raw editor code comments.
 */
export function extractSketchMetadata(code) {
  if (typeof code !== "string") return { name: "", metadata: {}, code: "" };
  const lines = code.split("\n");

  let firstLine = lines[0] || "";
  while (firstLine.trim() === "" && lines.length > 0) {
    lines.shift();
    firstLine = lines[0] || "";
  }

  const nameMatch = firstLine.match(/\/\*\s*(.*?)\s*\*\//);
  const name = nameMatch ? nameMatch[1].trim() : "";
  if (nameMatch) {
    lines.shift();
  }

  let metadata = {};
  let lastLine = lines[lines.length - 1] || "";
  while (lastLine.trim() === "" && lines.length > 0) {
    lines.pop();
    lastLine = lines[lines.length - 1] || "";
  }

  const metaMatch = lastLine.match(/\/\*\s*(.*?)\s*\*\//);
  if (metaMatch) {
    let metadataLine = metaMatch[1].trim();
    if (metadataLine.startsWith("metadata = ")) {
      metadataLine = metadataLine.replace("metadata = ", "").trim();
    }
    try {
      metadata = JSON.parse(metadataLine);
      lines.pop();
    } catch (e) {
      // not JSON metadata, leave line in place
    }
  }

  return {
    name,
    metadata,
    code: lines.join("\n"),
  };
}

/**
 * Calculate next or previous index with wrapping.
 */
export function getNextIndex(currentIndex, total, backwards = false) {
  if (typeof total !== "number" || total <= 0) return 0;
  const current = Number(currentIndex) || 0;
  return (current + (backwards ? -1 : 1) + total) % total;
}

/**
 * Calculate a random sketch index, preferably different from current if total > 1.
 */
export function getRandomIndex(currentIndex, total) {
  if (typeof total !== "number" || total <= 0) return 0;
  if (total === 1) return 0;
  const current = Number(currentIndex) || 0;
  let next = Math.floor(Math.random() * total);
  if (next === current && total > 1) {
    next = (current + 1 + Math.floor(Math.random() * (total - 1))) % total;
  }
  return next;
}

/**
 * Resolves a target sketch and its index within the playlist.
 */
export function resolveSketchIndex(target, sketches = [], fallbackIndex = 0) {
  if (!Array.isArray(sketches) || sketches.length === 0) {
    return { index: -1, sketch: null };
  }

  // 1. By direct numeric index
  if (typeof target === "number") {
    const safeIdx = Math.max(0, Math.min(sketches.length - 1, target));
    return { index: safeIdx, sketch: sketches[safeIdx] };
  }

  // 2. By string (name or id)
  if (typeof target === "string") {
    const targetLower = target.trim().toLowerCase();
    const idx = sketches.findIndex(
      (s) =>
        (s.name && s.name.toLowerCase() === targetLower) ||
        (s.id && String(s.id).toLowerCase() === targetLower) ||
        (s.sketch_id && String(s.sketch_id).toLowerCase() === targetLower)
    );
    if (idx >= 0) {
      return { index: idx, sketch: sketches[idx] };
    }
    const safeFallback = Math.max(0, Math.min(sketches.length - 1, Number(fallbackIndex) || 0));
    return { index: safeFallback, sketch: sketches[safeFallback] };
  }

  // 3. By object
  if (target && typeof target === "object") {
    const idx = sketches.findIndex(
      (s) =>
        (target.name && s.name === target.name) ||
        (target.id && s.id === target.id) ||
        (target.sketch_id && s.sketch_id === target.sketch_id) ||
        s === target
    );
    if (idx >= 0) {
      return { index: idx, sketch: sketches[idx] };
    }
    // Object not found in current playlist, use the provided object directly
    return { index: typeof target.index === "number" ? target.index : fallbackIndex, sketch: target };
  }

  return { index: -1, sketch: null };
}

/**
 * Access editor instance from application state or global window.
 */
export function getEditor(app) {
  return (
    (app?.state?.editor?.editor) ||
    window.cm ||
    (typeof window !== "undefined" && window.editor) ||
    null
  );
}

/**
 * Reads current text from the active editor.
 */
export function getEditorCode(app) {
  const editor = getEditor(app);
  if (editor && typeof editor.getValue === "function") {
    return editor.getValue();
  }
  return "";
}

/**
 * Sets text in the active editor.
 */
export function setEditorCode(app, code) {
  const editor = getEditor(app);
  if (editor && typeof editor.setValue === "function") {
    editor.setValue(code);
  }
}

/**
 * Executes/evaluates code in the Hydra sandbox.
 */
export function evalEditorCode(app, code, cb) {
  const editor = getEditor(app);
  if (typeof window !== "undefined" && typeof window.evalCode === "function") {
    window.evalCode(code, cb);
  } else if (editor && typeof editor.eval === "function") {
    editor.eval(code, cb);
  }
}

/**
 * Canonical sketch loader: formats code, updates editor, evals, syncs title & url,
 * manages autosaves (reducing undo history to previous scene), and persists playlist index.
 */
export function loadSketch(app, targetSketchOrIndex, options = {}) {
  const sketches = options.sketches || app?.mySketches || window.mySketches || [];
  if (!Array.isArray(sketches) || sketches.length === 0) return null;

  const currentIdx = typeof options.currentIndex === "number" ? options.currentIndex : app?.sketchIdx ?? 0;
  const { index, sketch } = resolveSketchIndex(targetSketchOrIndex, sketches, currentIdx);

  if (!sketch) return null;

  // 1. Capture current code before loading so we can preserve previous scene for undo
  const previousCode = getEditorCode(app);

  // 2. Format sketch code safely without mutating source metadata
  const formattedCode = formatSketchCode(sketch);

  // 3. Extract and sync BPM if defined in sketch or code
  const bpmMatch = formattedCode.match(/bpm\s*=\s*(\d+(\.\d+)?)/);
  const sketchBpm = Number(sketch.bpm) || Number(sketch.metadata?.bpm) || (bpmMatch ? Number(bpmMatch[1]) : null);
  if (sketchBpm && !isNaN(sketchBpm) && sketchBpm > 0 && app?.emitter) {
    app.emitter.emit("bpm:change", sketchBpm);
  }

  // 4. Update editor and evaluate
  setEditorCode(app, formattedCode);
  evalEditorCode(app, formattedCode);

  // 5. Update window title
  if (typeof document !== "undefined") {
    document.title = sketch.name || "Hydralisk";
  }

  // 6. Update persistent index and protocol
  const targetIdx = index >= 0 ? index : (typeof sketch.index === "number" ? sketch.index : 0);
  const safeIdx = isNaN(targetIdx) ? 0 : targetIdx;
  sPut("sketchIdx", safeIdx);
  if (app) {
    app.sketchIdx = safeIdx;
    if (typeof app.expose === "function") {
      app.expose("sketchIdx", safeIdx);
    }
  }

  // 7. Store sketch name in localStorage and URL querystring
  if (sketch.name && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("lastSelectedSketchName", sketch.name);
      if (options.syncUrl !== false && typeof window !== "undefined" && window.history?.replaceState) {
        const url = new URL(window.location);
        url.searchParams.set("sketch", sketch.name);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {}
  }

  // 8. Autosave & Undo history: reduce undo history to 1 (the previous scene)
  if (app?.memory) {
    if (typeof app.memory.reduceToPreviousScene === "function") {
      app.memory.reduceToPreviousScene(previousCode);
    } else if (typeof app.memory.resetAutosaves === "function") {
      app.memory.resetAutosaves();
    }
    if (typeof app.memory.autoSave === "function") {
      app.memory.autoSave(formattedCode, true);
    }
  }

  // 9. Notify app bus
  if (app?.emit) {
    app.emit("gallery:sketchLoaded", { sketch, index: safeIdx });
  }

  return { sketch, index: safeIdx, formattedCode };
}
