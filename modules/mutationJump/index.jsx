/**
 * Mutation Jump Plugin for Hydralisk
 * 
 * Silent background engine pre-computing 0-10 mutations based on a MIDI CC dial.
 * Swaps to the pre-calculated to-be state instantly on a MIDI press event without
 * any on-screen visual clues (no charging indicator, no firing flash).
 * If CC ~= 0 on press, retrieves and restores the pre-mutation state (undo).
 * Triggered strictly via MIDI combo bindings.
 */

import { MutationJumpService } from './mutationJumpService.js';

export class MutationJumpManager {
  constructor() {
    this.service = new MutationJumpService();
    this.isInitialized = false;
  }

  init(app) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Attach Editor
    const getEditor = () => {
      return (app && app.state && app.state.editor && app.state.editor.editor) || window.cm || null;
    };

    const initialEditor = getEditor();
    if (initialEditor) {
      this.service.setEditor(initialEditor);
    }

    // Register with Plugin System and Global Scope
    window.mutationJump = this.service;
    window.impromptuMutator = this.service; // Backward compatibility alias
    if (app && typeof app.expose === 'function') {
      app.expose('mutationJump', this.service);
      app.expose('impromptuMutator', this.service);
    }

    // Connect Events with xemitter and app emitter (for MIDI actions)
    const emitter = (app && app.emitter) || window.xemitter;
    if (emitter) {
      emitter.on('mutationJump:setCC', (val) => this.service.setCC(val));
      emitter.on('mutationJump:trigger', () => this.service.trigger());
      emitter.on('mutationJump:reroll', () => this.service.reroll());

      // Compatibility event aliases
      emitter.on('impromptu:setCC', (val) => this.service.setCC(val));
      emitter.on('impromptu:trigger', () => this.service.trigger());
      emitter.on('impromptu:reroll', () => this.service.reroll());
    }

    // Register with MIDI Mapping Module
    this.registerMidiActions();

    // Listen to sketch changes or editor focus to sync base code
    if (emitter) {
      emitter.on('gallery:loadSketch', () => {
        setTimeout(() => this.service.syncFromEditor(), 100);
      });
      emitter.on('editor:ready', () => {
        const ed = getEditor();
        if (ed) this.service.setEditor(ed);
      });
    }

    // Direct CodeMirror change listener if window.cm is present
    if (window.cm && typeof window.cm.on === 'function') {
      window.cm.on('change', () => {
        this.service.syncFromEditor();
      });
    }

    console.log('[MutationJump] Silent background engine initialized (MIDI-controlled only)');
  }

  registerMidiActions() {
    const register = (id, config) => {
      if (window.midiMapping && typeof window.midiMapping.registerAction === 'function') {
        window.midiMapping.registerAction(id, config);
      }
    };

    register('mutationJump:cc', {
      callback: (value) => {
        this.service.setCC(value);
      },
      label: 'Mutation Jump (CC Dial: 0-10)'
    });

    register('mutationJump:trigger', {
      action: 'mutationJump:trigger',
      label: 'Mutation Jump Trigger (Press)'
    });
  }
}

export const ImpromptuMutatorManager = MutationJumpManager;
export default MutationJumpManager;
