/**
 * masterEffectsService.js — AST parsing, transformation, and preset registry for Hydra Master Effects
 *
 * Scans sketch code via Acorn AST (with resilient regex fallback):
 * 1. Detects the rendered output buffer (e.g. render(o1) -> "o1", default "o0").
 * 2. Locates the final output chain ending with .out(targetBuffer) or .out().
 * 3. Injects or replaces function chains with MIDI CC bindings before the final .out().
 */

import * as acorn from 'acorn';

/**
 * Built-in presets. `chain` holds only the function-chain body; the
 * `/* [master-effects-start:id] *\/ ... /* [master-effects-end] *\/` markers are
 * added at apply time (see buildEffectChain), so user-edited presets can't break them.
 *
 * All controls use midix() on the A-D virtual CC slots, eased over two beats
 * (duration re-evaluated every frame so it follows tap tempo).
 */
export const DEFAULT_MASTER_EFFECTS = [
  {
    id: 'hsl_plus',
    name: 'HSL+ & Zoom',
    tag: 'Color & Framing',
    icon: '🎨',
    description: 'Master color grade & zoom framing. Smooth hue rotation, saturation punch, contrast, and scale.',
    chain: `.hue(midix("A", { min: -1, max: 1, default: 0, ease: "sine", duration: () => beatMs(2) }))
  .saturate(midix("B", { min: 0, max: 3, default: 1, ease: "cubic", duration: () => beatMs(2) }))
  .contrast(midix("C", { min: 0.2, max: 2.5, default: 1, ease: "quad", duration: () => beatMs(2) }))
  .scale(midix("D", { min: 0.5, max: 2.5, default: 1, ease: "outCubic", duration: () => beatMs(2) }))`,
    controls: [
      { cc: 'A', label: 'Hue Shift', min: -1, max: 1, default: 0, unit: 'deg' },
      { cc: 'B', label: 'Saturation', min: 0, max: 3, default: 1, unit: 'x' },
      { cc: 'C', label: 'Contrast', min: 0.2, max: 2.5, default: 1, unit: 'x' },
      { cc: 'D', label: 'Zoom (Scale)', min: 0.5, max: 2.5, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'psyche_warp',
    name: 'Psychedelic Warp',
    tag: 'Symmetry & Motion',
    icon: '🌀',
    description: 'Hypnotic radial geometry. Real-time kaleidoscope segments, continuous rotation, and color inversion.',
    chain: `.kaleid(midix("A", { min: 1, max: 8, default: 1, ease: "linear", duration: () => beatMs(2), transform: Math.floor }))
  .rotate(midix("B", { min: -1, max: 1, default: 0, ease: "sine", duration: () => beatMs(2) }))
  .invert(midix("C", { min: 0, max: 1, default: 0, ease: "expo", duration: () => beatMs(2) }))
  .scale(midix("D", { min: 0.6, max: 1.8, default: 1, ease: "cubic", duration: () => beatMs(2) }))`,
    controls: [
      { cc: 'A', label: 'Kaleid Segments', min: 1, max: 8, default: 1, unit: 'sides' },
      { cc: 'B', label: 'Rotation Angle', min: -1, max: 1, default: 0, unit: 'rad' },
      { cc: 'C', label: 'Invert Flash', min: 0, max: 1, default: 0, unit: 'mix' },
      { cc: 'D', label: 'Scale Zoom', min: 0.6, max: 1.8, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'cyber_glitch',
    name: 'Cyber Glitch',
    tag: 'Digital Artifacts',
    icon: '⚡',
    description: 'Post-digital bitcrush. Colorama rainbow prism shifting, pixelation crunch, and posterization.',
    chain: `.colorama(midix("A", { min: 0, max: 0.5, default: 0, ease: "expo", duration: () => beatMs(2) }))
  .pixelate(midix("B", { min: 16, max: 256, default: 256, ease: "quad", duration: () => beatMs(2), transform: Math.round }), midix("B", { min: 16, max: 256, default: 256, ease: "quad", duration: () => beatMs(2), transform: Math.round }))
  .posterize(midix("C", { min: 2, max: 16, default: 16, ease: "linear", duration: () => beatMs(2), transform: Math.floor }))
  .contrast(midix("D", { min: 0.8, max: 2.5, default: 1, ease: "outCubic", duration: () => beatMs(2) }))`,
    controls: [
      { cc: 'A', label: 'Prism Colorama', min: 0, max: 0.5, default: 0, unit: 'shift' },
      { cc: 'B', label: 'Pixel Res', min: 16, max: 256, default: 256, unit: 'px' },
      { cc: 'C', label: 'Posterize Bins', min: 2, max: 16, default: 16, unit: 'steps' },
      { cc: 'D', label: 'Contrast', min: 0.8, max: 2.5, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'luma_echo',
    name: 'Luma Echo & Feedback',
    tag: 'Feedback & Trails',
    icon: '✨',
    description: 'Ethereal trails & threshold glow. Luma keying with modulated screen feedback and chromatic warmth.',
    chain: `.luma(midix("A", { min: 0.05, max: 0.8, default: 0.1, ease: "cubic", duration: () => beatMs(2) }))
  .color(1.1, 0.95, 1.05)
  .modulate(o0, midix("B", { min: 0, max: 0.25, default: 0, ease: "sine", duration: () => beatMs(2) }))
  .scale(midix("C", { min: 0.9, max: 1.2, default: 1.01, ease: "quad", duration: () => beatMs(2) }))`,
    controls: [
      { cc: 'A', label: 'Luma Cutoff', min: 0.05, max: 0.8, default: 0.1, unit: 'thresh' },
      { cc: 'B', label: 'Feedback Warp', min: 0, max: 0.25, default: 0, unit: 'depth' },
      { cc: 'C', label: 'Echo Scale', min: 0.9, max: 1.2, default: 1.01, unit: 'x' }
    ]
  }
];

export const MASTER_EFFECTS_STORAGE_KEY = 'hydralisk.masterEffects';

const MARKER_START_RE = /\/\*\s*\[master-effects-start:[a-zA-Z0-9_-]+\]\s*\*\/\s*/g;
const MARKER_END_RE = /\s*\/\*\s*\[master-effects-end\]\s*\*\//g;

/** Strip any marker comments from a chain body (handles legacy chains that embedded them). */
export function stripEffectMarkers(chain = '') {
  return String(chain).replace(MARKER_START_RE, '').replace(MARKER_END_RE, '').trim();
}

/** Wrap a preset's chain body with the start/end markers used for idempotent replacement. */
export function buildEffectChain(effect) {
  return `/* [master-effects-start:${effect.id}] */\n  ${stripEffectMarkers(effect.chain)}\n/* [master-effects-end] */`;
}

const readNum = (opts, key) => {
  const m = new RegExp(`\\b${key}\\s*:\\s*(-?\\d*\\.?\\d+(?:e-?\\d+)?)`).exec(opts || '');
  return m ? parseFloat(m[1]) : undefined;
};

/**
 * Derive the control list from midi()/midix() calls in a chain body.
 * Keeps label/unit from previous controls with the same cc; otherwise labels
 * the control after the hydra method it's an argument of (e.g. ".hue(" -> "hue").
 */
export function deriveControls(chain, previous = []) {
  const body = stripEffectMarkers(chain);
  const re = /\bmidix?\(\s*["']([A-Za-z0-9]+)["']/g;
  const controls = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(body)) !== null) {
    const cc = m[1];
    if (seen.has(cc)) continue;
    seen.add(cc);
    let opts = '';
    const afterCC = body.slice(m.index + m[0].length);
    const commaIdx = afterCC.indexOf(',');
    const closeParenIdx = afterCC.indexOf(')');
    if (commaIdx !== -1 && (closeParenIdx === -1 || commaIdx < closeParenIdx)) {
      const braceStart = afterCC.indexOf('{', commaIdx);
      if (braceStart !== -1 && (closeParenIdx === -1 || braceStart < closeParenIdx)) {
        let depth = 0;
        let braceEnd = -1;
        for (let i = braceStart; i < afterCC.length; i++) {
          if (afterCC[i] === '{') depth++;
          else if (afterCC[i] === '}') {
            depth--;
            if (depth === 0) {
              braceEnd = i;
              break;
            }
          }
        }
        if (braceEnd !== -1) {
          opts = afterCC.slice(braceStart + 1, braceEnd);
        }
      }
    }
    const min = readNum(opts, 'min') ?? 0;
    const max = readNum(opts, 'max') ?? 1;
    const def = readNum(opts, 'default') ?? (min + max) / 2;
    const prev = previous.find((c) => c.cc === cc);
    const methods = [...body.slice(0, m.index).matchAll(/\.(\w+)\s*\(/g)];
    const method = methods.length ? methods[methods.length - 1][1] : cc;
    controls.push({
      cc,
      label: prev?.label || method,
      min,
      max,
      default: def,
      unit: prev?.unit || ''
    });
  }
  return controls;
}

const clonePresets = (list) => list.map((e) => ({ ...e, controls: e.controls.map((c) => ({ ...c })) }));

const getStorage = () => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch (e) {
    return null;
  }
};

function loadStoredEffects() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(MASTER_EFFECTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const base = clonePresets(DEFAULT_MASTER_EFFECTS);
    const result = [...base];
    for (const item of parsed) {
      if (!item || !item.id || typeof item.chain !== 'string') continue;
      const normalized = {
        icon: '🎛️',
        tag: 'Custom',
        description: '',
        ...item,
        chain: stripEffectMarkers(item.chain),
        controls: Array.isArray(item.controls) ? item.controls : deriveControls(item.chain)
      };
      const idx = result.findIndex((e) => e.id === normalized.id);
      if (idx !== -1) {
        result[idx] = normalized;
      } else {
        result.push(normalized);
      }
    }
    return result;
  } catch (e) {
    console.warn('[MasterEffects] Failed to read stored effects, using defaults', e);
    return null;
  }
}

/**
 * Live preset list. Mutated in place (never reassigned) so existing importers
 * always see the current, localStorage-backed set.
 */
export const MASTER_EFFECTS = loadStoredEffects() || clonePresets(DEFAULT_MASTER_EFFECTS);

export const EFFECT_MARKER_REGEX = /\/\*\s*\[master-effects-start:([a-zA-Z0-9_-]+)\]\s*\*\/[\s\S]*?\/\*\s*\[master-effects-end\]\s*\*\/\s*/g;

/**
 * Service managing Master Effects state, parsing, and editor interaction
 */
export class MasterEffectsService {
  constructor() {
    this.subscribers = new Set();
    this.isOpen = false;
    this.activeEffectId = null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach((cb) => cb({
      isOpen: this.isOpen,
      activeEffectId: this.activeEffectId,
      effects: MASTER_EFFECTS
    }));
  }

  // --- Preset registry (localStorage-backed) ---

  getEffects() {
    return MASTER_EFFECTS;
  }

  getEffect(id) {
    return MASTER_EFFECTS.find((e) => e.id === id) || null;
  }

  persist() {
    const storage = getStorage();
    if (!storage) return;
    try {
      const overrides = MASTER_EFFECTS.filter((e) => {
        const def = DEFAULT_MASTER_EFFECTS.find((d) => d.id === e.id);
        if (!def) return true; // custom preset
        return (
          e.name !== def.name ||
          stripEffectMarkers(e.chain) !== stripEffectMarkers(def.chain) ||
          e.tag !== def.tag ||
          e.icon !== def.icon ||
          e.description !== def.description
        );
      });
      storage.setItem(MASTER_EFFECTS_STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.warn('[MasterEffects] Failed to persist effects', e);
    }
  }

  /** Generate a unique, marker-safe id from a name. */
  makeId(name = 'effect') {
    const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'effect';
    let id = base;
    let i = 2;
    while (this.getEffect(id)) id = `${base}_${i++}`;
    return id;
  }

  /**
   * Insert or update a preset. Controls are re-derived from the chain's
   * midi()/midix() calls, keeping existing labels/units by cc.
   */
  saveEffect(effect) {
    const existing = effect.id ? this.getEffect(effect.id) : null;
    const chain = stripEffectMarkers(effect.chain);
    const next = {
      icon: '🎛️',
      tag: 'Custom',
      description: '',
      ...existing,
      ...effect,
      id: existing ? existing.id : this.makeId(effect.name),
      chain,
      controls: deriveControls(chain, effect.controls || existing?.controls || [])
    };
    if (existing) {
      MASTER_EFFECTS.splice(MASTER_EFFECTS.indexOf(existing), 1, next);
    } else {
      MASTER_EFFECTS.push(next);
    }
    this.persist();
    this.notify();
    return next;
  }

  deleteEffect(id) {
    const idx = MASTER_EFFECTS.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    MASTER_EFFECTS.splice(idx, 1);
    this.persist();
    this.notify();
    return true;
  }

  resetEffects() {
    MASTER_EFFECTS.splice(0, MASTER_EFFECTS.length, ...clonePresets(DEFAULT_MASTER_EFFECTS));
    const storage = getStorage();
    if (storage) storage.removeItem(MASTER_EFFECTS_STORAGE_KEY);
    this.notify();
  }

  open() {
    this.isOpen = true;
    this.activeEffectId = this.getActiveEffectFromEditor();
    this.notify();
  }

  close() {
    this.isOpen = false;
    this.notify();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  getEditor() {
    if (typeof window === 'undefined') return null;
    return (window.app && window.app.state && window.app.state.editor && window.app.state.editor.editor)
      || window.cm
      || null;
  }

  getEditorCode() {
    const editor = this.getEditor();
    return editor && typeof editor.getValue === 'function' ? editor.getValue() : '';
  }

  setEditorCode(code, evaluate = true) {
    const editor = this.getEditor();
    if (!editor) return false;

    if (typeof editor.setValue === 'function') {
      editor.setValue(code);
    }

    if (evaluate) {
      if (typeof window.evalCode === 'function') {
        window.evalCode(code);
      } else if (typeof editor.eval === 'function') {
        editor.eval(code);
      }
    }
    return true;
  }

  getActiveEffectFromCode(code) {
    if (!code) return null;
    const match = /\/\*\s*\[master-effects-start:([a-zA-Z0-9_-]+)\]\s*\*\//.exec(code);
    return match ? match[1] : null;
  }

  getActiveEffectFromEditor() {
    return this.getActiveEffectFromCode(this.getEditorCode());
  }

  /**
   * AST Parser: Locates the target rendered buffer and the insertion point right before .out(...)
   */
  findTargetBufferAndInsertionPoint(code) {
    let targetBuffer = 'o0';
    let outStart = -1;
    let ast = null;

    // 1. Try parsing with Acorn
    try {
      ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'module', locations: true });
    } catch (e1) {
      try {
        ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script', locations: true });
      } catch (e2) {
        // Syntax error in code (e.g. user currently typing) -> fallback to regex
      }
    }

    if (ast) {
      // Find render(buffer)
      this.walkAst(ast, (node) => {
        if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'render') {
          if (node.arguments.length > 0 && node.arguments[0].type === 'Identifier') {
            targetBuffer = node.arguments[0].name;
          }
        }
      });

      // Find CallExpression ending in .out(targetBuffer) or .out()
      this.walkAst(ast, (node) => {
        if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
          const prop = node.callee.property;
          if (prop && prop.type === 'Identifier' && prop.name === 'out') {
            let buf = 'o0';
            if (node.arguments.length > 0 && node.arguments[0].type === 'Identifier') {
              buf = node.arguments[0].name;
            }
            if (buf === targetBuffer && outStart === -1) {
              // Position right before '.' of .out(...)
              outStart = prop.start - 1;
            }
          }
        }
      });
    }

    // 2. Resilient Regex Fallback if AST did not resolve out position
    if (outStart === -1) {
      // Check render(o0..o3)
      const renderMatch = /render\s*\(\s*(o[0-3])?\s*\)/.exec(code);
      if (renderMatch && renderMatch[1]) {
        targetBuffer = renderMatch[1];
      }

      // Find .out(targetBuffer) or .out()
      const outRegex = new RegExp(`\\.out\\s*\\(\\s*(${targetBuffer})?\\s*\\)`, 'g');
      let m;
      let lastMatch = null;
      while ((m = outRegex.exec(code)) !== null) {
        lastMatch = m;
      }
      if (lastMatch) {
        outStart = lastMatch.index;
      } else {
        // Fallback to any .out(...)
        const genericOut = /\.out\s*\([^)]*\)/.exec(code);
        if (genericOut) {
          outStart = genericOut.index;
        }
      }
    }

    return { targetBuffer, outStart };
  }

  walkAst(node, visitor) {
    if (!node || typeof node !== 'object') return;
    visitor(node);
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) this.walkAst(c, visitor);
      } else if (child && typeof child.type === 'string') {
        this.walkAst(child, visitor);
      }
    }
  }

  /**
   * Cleanly strips any existing master effect block from code
   */
  removeMasterEffectFromCode(code) {
    if (!code) return '';
    return code.replace(/\n?\s*\/\*\s*\[master-effects-start:([a-zA-Z0-9_-]+)\]\s*\*\/[\s\S]*?\/\*\s*\[master-effects-end\]\s*\*\/\s*/g, '').trimEnd();
  }

  /**
   * Applies a master effect to code by inserting function chain before .out(...)
   */
  applyEffectToCode(code, effectId) {
    const effect = this.getEffect(effectId);
    if (!effect) return code;
    const chain = buildEffectChain(effect);

    // 1. Remove any existing master effects block
    const cleanedCode = this.removeMasterEffectFromCode(code);

    // 2. Identify target buffer and insertion point
    const { targetBuffer, outStart } = this.findTargetBufferAndInsertionPoint(cleanedCode);

    if (outStart === -1) {
      // If no .out() found, append as standalone chain or at end
      return `${cleanedCode}\n  ${chain}\n  .out(${targetBuffer})`;
    }

    // Insert effect chain immediately before .out(...)
    const prefix = cleanedCode.slice(0, outStart).trimEnd();
    const suffix = cleanedCode.slice(outStart).trimStart();

    return `${prefix}\n  ${chain}\n  ${suffix}`;
  }

  /**
   * Apply an effect directly to the active editor
   */
  applyToEditor(effectId) {
    const currentCode = this.getEditorCode();
    if (!currentCode) return false;

    const newCode = this.applyEffectToCode(currentCode, effectId);
    this.setEditorCode(newCode, true);
    this.activeEffectId = effectId;
    this.notify();

    const effect = this.getEffect(effectId);
    if (window.showToast) {
      window.showToast(`Master Effect Applied: ${effect ? effect.name : effectId}`);
    } else {
      console.log(`[MasterEffects] Applied: ${effect ? effect.name : effectId}`);
    }
    return true;
  }

  /**
   * Remove master effects from active editor
   */
  removeFromEditor() {
    const currentCode = this.getEditorCode();
    if (!currentCode) return false;

    const cleaned = this.removeMasterEffectFromCode(currentCode);
    this.setEditorCode(cleaned, true);
    this.activeEffectId = null;
    this.notify();

    if (window.showToast) {
      window.showToast('Master Effects Removed');
    }
    return true;
  }
}

export const masterEffectsService = new MasterEffectsService();
