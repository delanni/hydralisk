/**
 * Impromptu Mutation Plugin for Hydralisk
 * 
 * Pre-computes 0-10 mutations based on MIDI CC dial.
 * Swaps to the pre-calculated to-be state instantly on MIDI press.
 * If CC ~= 0 on press, retrieves and restores the pre-mutation state (undo).
 */

import './impromptuMutation.css';
import { ImpromptuMutatorService } from './impromptuMutatorService.js';
import { ImpromptuMutationHUD } from './impromptuMutationHUD.js';

export class ImpromptuMutatorManager {
  constructor() {
    this.service = new ImpromptuMutatorService();
    this.hud = null;
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

    // Attach HUD and Modal
    if (typeof document !== 'undefined') {
      this.hud = new ImpromptuMutationHUD(this.service);
      this.injectToolbarIcon();
    }

    // Register with Plugin System and Global Scope
    window.impromptuMutator = this.service;
    if (app && typeof app.expose === 'function') {
      app.expose('impromptuMutator', this.service);
    }

    // Connect Events with xemitter and app emitter
    const emitter = (app && app.emitter) || window.xemitter;
    if (emitter) {
      emitter.on('impromptu:setCC', (val) => this.service.setCC(val));
      emitter.on('impromptu:trigger', () => this.service.trigger());
      emitter.on('impromptu:toggleModal', () => this.hud && this.hud.toggleModal());
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
        // Sync if not currently executing a burst
        this.service.syncFromEditor();
      });
    }

    console.log('[ImpromptuMutator] Plugin initialized successfully ⚡');
  }

  registerMidiActions() {
    const register = (id, config) => {
      if (window.midiMapping && typeof window.midiMapping.registerAction === 'function') {
        window.midiMapping.registerAction(id, config);
      }
    };

    register('impromptu:mutationCC', {
      callback: (value) => {
        this.service.setCC(value);
      },
      label: 'Impromptu Mutation (CC Dial: 0-10)'
    });

    register('impromptu:trigger', {
      action: 'impromptu:trigger',
      label: 'Impromptu Mutation Trigger (Press)'
    });
  }

  injectToolbarIcon() {
    const existing = document.getElementById('nav-impromptu-mutation-icon');
    if (existing) return;

    // Look for top menu bar
    const topBar = document.querySelector('.top-menu') ||
      document.querySelector('#nav-icons') ||
      document.querySelector('.nav-icons') ||
      document.querySelector('.menu') ||
      document.body;

    const icon = document.createElement('i');
    icon.className = 'fa fa-bolt icon';
    icon.id = 'nav-impromptu-mutation-icon';
    icon.title = 'Impromptu Mutation (Cmd+I to trigger, Shift-Ctrl-I for controls)';
    icon.style.cursor = 'pointer';
    icon.style.marginLeft = '8px';
    icon.style.color = '#00f0ff';
    icon.onclick = () => {
      if (this.hud) this.hud.toggleModal();
    };

    const magicIcon = document.getElementById('nav-master-effects-icon');
    if (magicIcon && magicIcon.parentNode) {
      magicIcon.parentNode.insertBefore(icon, magicIcon.nextSibling);
    } else {
      topBar.appendChild(icon);
    }
  }
}

export default ImpromptuMutatorManager;
