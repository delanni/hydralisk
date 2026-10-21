import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MidiMappingModal from './midiMappingModal.jsx';
import { midiMappingService } from './midiMappingService.js';

function MidiMappingHost() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = midiMappingService.subscribe((state) => {
      setIsOpen(state.isOpen);
    });
    return unsubscribe;
  }, []);

  return (
    <MidiMappingModal
      isOpen={isOpen}
      onClose={() => midiMappingService.close()}
    />
  );
}

export default class MidiMappingManager {
  constructor() {
    this.service = midiMappingService;
    this.injected = false;
  }

  /**
   * choo mounts by replacing document.body, which can detach our host node.
   * Re-attach (and re-render) it whenever it is missing from the live DOM.
   */
  ensureHost() {
    if (typeof document === 'undefined' || !document.body) return;
    if (this.host && document.body.contains(this.host)) return;

    if (this.host) {
      try { ReactDOM.unmountComponentAtNode(this.host); } catch (e) { /* noop */ }
    }
    const host = document.createElement('div');
    host.id = 'midi-mapping-app';
    document.body.appendChild(host);
    ReactDOM.render(<MidiMappingHost />, host);
    this.host = host;
  }

  inject() {
    if (typeof document === 'undefined') return;
    if (this.injected) return;

    this.ensureHost();
    this.injected = true;
    console.log('[MidiMappingManager] Injected React MIDI Mapping Host');

    // Make sure the host is alive before any open
    const origOpen = this.service.open.bind(this.service);
    this.service.open = () => {
      this.ensureHost();
      origOpen();
    };

    // Setup Web MIDI hardware connection
    this.service.setupMIDIHandler();

    // Hook up xemitter events if available
    if (typeof window !== 'undefined' && window.xemitter) {
      window.xemitter.on('midi-mapping:open', () => this.service.open());
      window.xemitter.on('midi-mapping:close', () => this.service.close());
      window.xemitter.on('midi-mapping:toggle', () => this.service.toggle());
    }

    // Expose global API
    window.midiMapping = {
      open: () => this.service.open(),
      close: () => this.service.close(),
      toggle: () => this.service.toggle(),
      render: () => this.service.notify(),
      getMapping: () => this.service.getFullMapping(),
      registerAction: (id, config) => this.service.registerAction(id, config),
    };
  }

  open() {
    this.service.open();
  }

  close() {
    this.service.close();
  }

  toggle() {
    this.service.toggle();
  }
}

// Global instance & auto-injection
export const midiMappingManager = new MidiMappingManager();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => midiMappingManager.inject());
  } else {
    midiMappingManager.inject();
  }
}

// Auto-register with HydraliskPlugins if present
if (typeof window !== 'undefined' && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: 'midi-mapping',
    name: 'MIDI Mapping UI & Actions',
    init(app) {
      midiMappingManager.inject();
      if (app.emitter) {
        app.emitter.on('midi-mapping:open', () => midiMappingManager.open());
        app.emitter.on('midi-mapping:close', () => midiMappingManager.close());
        app.emitter.on('midi-mapping:toggle', () => midiMappingManager.toggle());
      }
      app.expose('midiMapping', window.midiMapping);
      app.expose('midiMappingManager', midiMappingManager);
    },
  });
}
