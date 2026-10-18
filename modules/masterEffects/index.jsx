import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MasterEffectsModal from './masterEffectsModal.jsx';
import { masterEffectsService } from './masterEffectsService.js';

function MasterEffectsHost() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = masterEffectsService.subscribe((state) => {
      setIsOpen(state.isOpen);
    });

    const handleKeyDown = (e) => {
      // Hotkey: Cmd+M or Ctrl+M or Cmd+Shift+M
      if ((e.metaKey || e.ctrlKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        e.stopPropagation();
        masterEffectsService.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <MasterEffectsModal
      isOpen={isOpen}
      onClose={() => masterEffectsService.close()}
    />
  );
}

export default class MasterEffectsManager {
  constructor() {
    this.service = masterEffectsService;
  }

  inject() {
    if (typeof document === 'undefined') return;

    let host = document.getElementById('hydra-master-effects-app');
    if (!host) {
      host = document.createElement('div');
      host.id = 'hydra-master-effects-app';
      document.body.appendChild(host);
    }

    ReactDOM.render(<MasterEffectsHost />, host);
    console.log('[MasterEffectsManager] Injected Master Effects Modal Host');

    // Inject toolbar icon into editor top menu
    this.injectToolbarIcon();

    if (window.xemitter) {
      window.xemitter.on('masterEffects:open', () => this.service.open());
      window.xemitter.on('masterEffects:close', () => this.service.close());
      window.xemitter.on('masterEffects:toggle', () => this.service.toggle());
    }

    window.hydraMasterEffects = this.service;
  }

  injectToolbarIcon() {
    const isPlayerPage = Boolean(
      window.location.pathname.endsWith('player.html') ||
      window.location.pathname.endsWith('/player') ||
      document.getElementById('hydra-player-dashboard')
    );
    if (isPlayerPage) return;

    const tryInject = () => {
      if (document.getElementById('nav-master-effects-icon')) return;

      const navIcon = document.createElement('i');
      navIcon.id = 'nav-master-effects-icon';
      navIcon.className = 'fa fa-magic icon';
      navIcon.title = 'Master Effects & MIDI Binds (Cmd-M)';
      navIcon.onclick = () => this.service.toggle();

      // Find editor toolbar container alongside other white menu icons
      const existingIcon = document.querySelector('i.icon');
      if (existingIcon && existingIcon.parentNode) {
        existingIcon.parentNode.appendChild(navIcon);
      } else {
        setTimeout(tryInject, 500);
      }
    };

    setTimeout(tryInject, 300);
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

// Auto-register with HydraliskPlugins
if (typeof window !== 'undefined' && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: 'master-effects',
    name: 'Master Effects & MIDI Binds',
    init(app) {
      const manager = new MasterEffectsManager();
      setTimeout(() => manager.inject(), 120);
      app.expose('masterEffectsManager', manager);
    }
  });
}
