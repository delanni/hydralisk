/**
 * Impromptu Mutator Service for Hydralisk
 * 
 * Pre-computes mutation states in memory based on a MIDI CC dial (0-1 mapped to 0-10 mutations).
 * Swaps to the pre-calculated to-be state instantly on a MIDI press event.
 * If CC ~= 0 on press, retrieves and restores the pre-mutation state (undo).
 */

import { Parser } from 'acorn';
import { generate } from 'astring';

export const GLSL_TRANSFORMS = {
  src: ['noise', 'voronoi', 'osc', 'shape', 'gradient', 'solid'],
  coord: [
    'rotate', 'scale', 'pixelate', 'repeat', 'repeatX', 'repeatY',
    'modulateRepeat', 'modulateRepeatX', 'modulateRepeatY',
    'modulateRotate', 'modulateScale', 'modulatePixelate',
    'kaleid', 'scroll', 'scrollX', 'scrollY',
    'modulateScrollX', 'modulateScrollY', 'modulate'
  ],
  color: [
    'posterize', 'shift', 'invert', 'contrast', 'brightness',
    'color', 'luma', 'thresh', 'colorama', 'saturate', 'hue'
  ],
  combine: ['add', 'sub', 'layer', 'blend', 'mult', 'diff', 'modulateHue'],
  combineCoord: [
    'modulate', 'modulateRepeat', 'modulateRepeatX', 'modulateRepeatY',
    'modulateRotate', 'modulateScale', 'modulatePixelate',
    'modulateScrollX', 'modulateScrollY'
  ]
};

const MASTER_EFFECTS_REGEX = /\/\*\s*\[master-effects-start:[a-zA-Z0-9_-]+\]\s*\*\/[\s\S]*?\/\*\s*\[master-effects-end\]\s*\*\//g;

function walkAST(node, visitor, parent = null) {
  if (!node || typeof node !== 'object') return;
  visitor(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === 'string') walkAST(item, visitor, node);
      }
    } else if (child && typeof child.type === 'string') {
      walkAST(child, visitor, node);
    }
  }
}

export class ImpromptuMutatorService {
  constructor(options = {}) {
    this.editor = options.editor || null;
    this.currentCC = 0;
    this.mutationCount = 0;
    this.baseCode = '';
    this.preMutationState = null;
    this.precalculatedStates = [];
    this.listeners = new Map();

    if (options.initialCode) {
      this.setBaseCode(options.initialCode);
    }
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[ImpromptuMutator] Error in '${event}' listener:`, err);
        }
      }
    }
  }

  setEditor(editor) {
    this.editor = editor;
    this.syncFromEditor();
  }

  getEditorCode() {
    if (!this.editor) return '';
    if (typeof this.editor.getValue === 'function') {
      return this.editor.getValue();
    }
    if (typeof this.editor === 'string') {
      return this.editor;
    }
    return '';
  }

  syncFromEditor() {
    const editorCode = this.getEditorCode();
    if (editorCode && editorCode !== this.baseCode) {
      this.setBaseCode(editorCode);
    }
  }

  setBaseCode(code) {
    this.baseCode = code || '';
    this.recalculateStates();
  }

  /**
   * Set MIDI CC value (0.0 -> 1.0 mapped to 0 -> 10 mutations).
   */
  setCC(val) {
    const normalized = Math.max(0, Math.min(1, Number(val) || 0));
    this.currentCC = normalized;
    this.mutationCount = Math.round(normalized * 10);

    // Sync base code if editor has changed
    const currentEditorCode = this.getEditorCode();
    if (currentEditorCode && currentEditorCode !== this.baseCode) {
      this.baseCode = currentEditorCode;
      this.recalculateStates();
    } else if (this.precalculatedStates.length < 11) {
      this.recalculateStates();
    }

    const state = this.getStateInfo();
    this.emit('change', state);
    return state;
  }

  getToBeState() {
    if (this.mutationCount === 0 || this.currentCC < 0.05) {
      return this.baseCode;
    }
    return this.precalculatedStates[this.mutationCount] || this.baseCode;
  }

  getStateInfo() {
    return {
      currentCC: this.currentCC,
      mutationCount: this.mutationCount,
      isUndoMode: this.mutationCount === 0 || this.currentCC < 0.05,
      toBeCode: this.getToBeState(),
      baseCode: this.baseCode,
      preMutationState: this.preMutationState,
      hasPreMutationState: Boolean(this.preMutationState),
      chainLength: this.precalculatedStates.length
    };
  }

  /**
   * Pre-calculates states 0 through 10 in memory.
   * State 0 is the base code, and each state i is a mutation of state i-1.
   */
  recalculateStates() {
    if (!this.baseCode) {
      this.precalculatedStates = [];
      return;
    }

    const states = [this.baseCode];
    let currentState = this.baseCode;

    for (let i = 1; i <= 10; i++) {
      currentState = this.mutateCode(currentState);
      states.push(currentState);
    }

    this.precalculatedStates = states;
  }

  /**
   * Force re-rolls all pre-computed states from the current base state.
   */
  reroll() {
    this.recalculateStates();
    const state = this.getStateInfo();
    this.emit('reroll', state);
    this.emit('change', state);
    return state;
  }

  /**
   * Trigger the action on MIDI press (Note or CC button).
   * - If CC ~= 0 (mutationCount == 0): fires undo, restoring preMutationState.
   * - If CC > 0: swaps editor directly to pre-calculated to-be state.
   */
  trigger() {
    // Check if editor has drifted
    const currentCode = this.getEditorCode();
    if (currentCode && currentCode !== this.baseCode && !this.precalculatedStates.includes(currentCode)) {
      this.baseCode = currentCode;
      this.recalculateStates();
    }

    const isUndo = this.mutationCount === 0 || this.currentCC < 0.05;

    if (isUndo) {
      return this.executeUndo();
    } else {
      return this.executeBurst();
    }
  }

  executeUndo() {
    if (this.preMutationState) {
      const restored = this.preMutationState;
      this.applyCode(restored);
      this.baseCode = restored;
      this.recalculateStates();
      const result = { action: 'undo', count: 0, code: restored, restored: true };
      this.emit('undone', result);
      this.emit('change', this.getStateInfo());
      return result;
    }

    // Fallback to editor's mutator undo if available
    if (this.editor && this.editor.mutator && typeof this.editor.mutator.doUndo === 'function') {
      this.editor.mutator.doUndo();
      this.baseCode = this.getEditorCode();
      this.recalculateStates();
      const result = { action: 'undo', count: 0, code: this.baseCode, restored: true };
      this.emit('undone', result);
      this.emit('change', this.getStateInfo());
      return result;
    }

    if (typeof window !== 'undefined' && window.xemitter) {
      window.xemitter.emit('editor:jumpBack1');
      const result = { action: 'undo', count: 0, code: this.baseCode, fallback: true };
      this.emit('undone', result);
      return result;
    }

    const result = { action: 'undo', count: 0, code: this.baseCode, restored: false };
    this.emit('undone', result);
    return result;
  }

  executeBurst() {
    const count = this.mutationCount;
    const toBeCode = this.getToBeState();

    if (!toBeCode) {
      return { action: 'burst', count: 0, code: this.baseCode };
    }

    // Save pre-mutation state for subsequent undo
    this.preMutationState = this.baseCode;

    // Apply the pre-calculated code
    this.applyCode(toBeCode);

    // Update base code to the new sketch
    this.baseCode = toBeCode;

    // Immediately pre-calculate the next 10 mutations from the new sketch state
    this.recalculateStates();

    const result = { action: 'burst', count, code: toBeCode };
    this.emit('applied', result);
    this.emit('change', this.getStateInfo());
    return result;
  }

  applyCode(code) {
    if (this.editor && typeof this.editor.setValue === 'function') {
      this.editor.setValue(code);
    }

    if (typeof window !== 'undefined') {
      if (typeof window.evalCode === 'function') {
        window.evalCode(code);
      } else if (this.editor && typeof this.editor.eval === 'function') {
        this.editor.eval(code);
      }

      if (window.xemitter) {
        window.xemitter.emit('editor:formatCode');
        window.xemitter.emit('gallery:saveLocally', code);
      }
    }
  }

  /**
   * Pure AST mutation of a single sketch code string.
   */
  mutateCode(code, { changeTransform = null } = {}) {
    if (!code || typeof code !== 'string') return code;

    // Preserve master-effects block safely if present
    const meMatch = code.match(MASTER_EFFECTS_REGEX);
    let meBlock = null;
    let workingCode = code;

    if (meMatch) {
      meBlock = meMatch[0];
      const startIdx = code.indexOf(meBlock);
      workingCode = code.slice(0, startIdx) + code.slice(startIdx + meBlock.length);
    }

    let ast;
    try {
      ast = Parser.parse(workingCode, {
        ecmaVersion: 'latest',
        sourceType: 'module'
      });
    } catch (e) {
      const glitched = this.fallbackRegexGlitch(workingCode);
      return this.reinsertMasterEffect(glitched, meBlock);
    }

    const literals = [];
    const calls = [];

    walkAST(ast, (node, parent) => {
      // Do not mutate literals inside arrow functions or function expressions (e.g. MIDI callbacks () => b1(0))
      if (parent && (parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression')) {
        return;
      }
      if (node.type === 'Literal' && typeof node.value === 'number') {
        literals.push(node);
      } else if (node.type === 'CallExpression') {
        if (node.callee.type === 'MemberExpression' && node.callee.property.name !== 'out') {
          calls.push({ node, name: node.callee.property.name, isMember: true });
        } else if (node.callee.type === 'Identifier' && node.callee.name !== 'render') {
          calls.push({ node, name: node.callee.name, isMember: false });
        }
      }
    });

    if (literals.length === 0 && calls.length === 0) {
      return code;
    }

    const shouldSwapTransform = changeTransform !== null ? changeTransform : (Math.random() < 0.25);

    if (shouldSwapTransform && calls.length > 0) {
      const targetCall = calls[Math.floor(Math.random() * calls.length)];
      const currentFunc = targetCall.name;
      const category = Object.keys(GLSL_TRANSFORMS).find(cat => GLSL_TRANSFORMS[cat].includes(currentFunc));
      if (category && GLSL_TRANSFORMS[category]) {
        const candidates = GLSL_TRANSFORMS[category].filter(f => f !== currentFunc);
        if (candidates.length > 0) {
          const newFunc = candidates[Math.floor(Math.random() * candidates.length)];
          if (targetCall.isMember) {
            targetCall.node.callee.property.name = newFunc;
          } else {
            targetCall.node.callee.name = newFunc;
          }
        }
      }
    } else if (literals.length > 0) {
      const targetLit = literals[Math.floor(Math.random() * literals.length)];
      const origVal = targetLit.value;
      let newVal;
      if (origVal === 0) {
        newVal = Math.random() < 0.5 ? 0.5 : 0.05;
      } else {
        // Multiplicative glitch between 0.2x and 2.2x
        const factor = (Math.random() * 2.0) + 0.2;
        newVal = Number((origVal * factor).toFixed(3));
      }
      targetLit.value = newVal;
      targetLit.raw = String(newVal);
    }

    let mutated;
    try {
      mutated = generate(ast);
    } catch (e) {
      return code;
    }

    return this.reinsertMasterEffect(mutated, meBlock);
  }

  reinsertMasterEffect(coreCode, meBlock) {
    if (!meBlock) return coreCode;
    const outIdx = coreCode.lastIndexOf('.out(');
    if (outIdx !== -1) {
      return coreCode.slice(0, outIdx) + meBlock + coreCode.slice(outIdx);
    }
    return coreCode + meBlock;
  }

  fallbackRegexGlitch(code) {
    return code.replace(/\b(\d+(?:\.\d+)?)\b/, (match) => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      if (num === 0) return '0.5';
      const factor = (Math.random() * 1.8) + 0.2;
      return (num * factor).toFixed(2);
    });
  }
}
