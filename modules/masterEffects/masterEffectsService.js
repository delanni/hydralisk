/**
 * masterEffectsService.js — AST parsing, transformation, and preset registry for Hydra Master Effects
 *
 * Scans sketch code via Acorn AST (with resilient regex fallback):
 * 1. Detects the rendered output buffer (e.g. render(o1) -> "o1", default "o0").
 * 2. Locates the final output chain ending with .out(targetBuffer) or .out().
 * 3. Injects or replaces function chains with MIDI CC bindings before the final .out().
 */

import * as acorn from 'acorn';

export const MASTER_EFFECTS = [
  {
    id: 'hsl_plus',
    name: 'HSL+ & Zoom',
    tag: 'Color & Framing',
    icon: '🎨',
    description: 'Master color grade & zoom framing. Smooth hue rotation, saturation punch, contrast, and scale.',
    chain: `/* [master-effects-start:hsl_plus] */
  .hue(() => midi("b1", { min: -1, max: 1 }))
  .saturate(() => midi("b2", { min: 0, max: 3 }))
  .contrast(() => midi("b3", { min: 0.2, max: 2.5 }))
  .scale(() => midi("b4", { min: 0.5, max: 2.5 }))
/* [master-effects-end] */`,
    controls: [
      { cc: 'b1', label: 'Hue Shift', min: -1, max: 1, default: 0, unit: 'deg' },
      { cc: 'b2', label: 'Saturation', min: 0, max: 3, default: 1, unit: 'x' },
      { cc: 'b3', label: 'Contrast', min: 0.2, max: 2.5, default: 1, unit: 'x' },
      { cc: 'b4', label: 'Zoom (Scale)', min: 0.5, max: 2.5, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'psyche_warp',
    name: 'Psychedelic Warp',
    tag: 'Symmetry & Motion',
    icon: '🌀',
    description: 'Hypnotic radial geometry. Real-time kaleidoscope segments, continuous rotation, and color inversion.',
    chain: `/* [master-effects-start:psyche_warp] */
  .kaleid(() => Math.floor(midi("b5", { min: 1, max: 8 })))
  .rotate(() => midi("b6", { min: -1, max: 1 }))
  .invert(() => midi("b7", { min: 0, max: 1 }))
/* [master-effects-end] */`,
    controls: [
      { cc: 'b5', label: 'Kaleid Segments', min: 1, max: 8, default: 1, unit: 'sides' },
      { cc: 'b6', label: 'Rotation Angle', min: -1, max: 1, default: 0, unit: 'rad' },
      { cc: 'b7', label: 'Invert Flash', min: 0, max: 1, default: 0, unit: 'mix' }
    ]
  },
  {
    id: 'cyber_glitch',
    name: 'Cyber Glitch',
    tag: 'Digital Artifacts',
    icon: '⚡',
    description: 'Post-digital bitcrush. Colorama rainbow prism shifting, pixelation crunch, and posterization.',
    chain: `/* [master-effects-start:cyber_glitch] */
  .colorama(() => midi("b5", { min: 0, max: 0.5 }))
  .pixelate(() => midi("b6", { min: 16, max: 256 }), () => midi("b6", { min: 16, max: 256 }))
  .posterize(() => midi("b7", { min: 2, max: 16 }))
/* [master-effects-end] */`,
    controls: [
      { cc: 'b5', label: 'Prism Colorama', min: 0, max: 0.5, default: 0, unit: 'shift' },
      { cc: 'b6', label: 'Pixel Res', min: 16, max: 256, default: 256, unit: 'px' },
      { cc: 'b7', label: 'Posterize Bins', min: 2, max: 16, default: 16, unit: 'steps' }
    ]
  },
  {
    id: 'luma_echo',
    name: 'Luma Echo & Feedback',
    tag: 'Feedback & Trails',
    icon: '✨',
    description: 'Ethereal trails & threshold glow. Luma keying with modulated screen feedback and chromatic warmth.',
    chain: `/* [master-effects-start:luma_echo] */
  .luma(() => midi("b5", { min: 0.05, max: 0.8 }))
  .color(1.1, 0.95, 1.05)
  .modulate(o0, () => midi("b6", { min: 0, max: 0.2 }))
/* [master-effects-end] */`,
    controls: [
      { cc: 'b5', label: 'Luma Cutoff', min: 0.05, max: 0.8, default: 0.1, unit: 'thresh' },
      { cc: 'b6', label: 'Feedback Warp', min: 0, max: 0.2, default: 0, unit: 'depth' }
    ]
  }
];

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
      activeEffectId: this.activeEffectId
    }));
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
    const effect = MASTER_EFFECTS.find((e) => e.id === effectId);
    if (!effect) return code;

    // 1. Remove any existing master effects block
    const cleanedCode = this.removeMasterEffectFromCode(code);

    // 2. Identify target buffer and insertion point
    const { targetBuffer, outStart } = this.findTargetBufferAndInsertionPoint(cleanedCode);

    if (outStart === -1) {
      // If no .out() found, append as standalone chain or at end
      return `${cleanedCode}\n  ${effect.chain}\n  .out(${targetBuffer})`;
    }

    // Insert effect chain immediately before .out(...)
    const prefix = cleanedCode.slice(0, outStart).trimEnd();
    const suffix = cleanedCode.slice(outStart).trimStart();

    return `${prefix}\n  ${effect.chain}\n  ${suffix}`;
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

    const effect = MASTER_EFFECTS.find((e) => e.id === effectId);
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
