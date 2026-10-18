/**
 * controllerApp.js — Mobile Controller Application for Hydralisk Remote Relay
 *
 * Runs on the performer's smartphone:
 * - Connects via WebSocket as role=controller with room and pairing token.
 * - Synchronizes with the server's ShadowState upon connecting.
 * - Emits zero-latency state intents and 60Hz throttled continuous CC parameters.
 */

import { RemoteConnection } from './wsConnection.js';
import { LocalTapTempo, FaderBank, XYPad } from './touchSurface.js';

export class ControllerApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.room = (this.urlParams.get('room') || '').toUpperCase().trim();
    this.token = (this.urlParams.get('token') || '').trim();

    this.connection = null;
    this.tapTempo = null;
    this.faderBank = null;
    this.xyPad1 = null;
    this.xyPad2 = null;

    this.currentMode = 'faders'; // 'faders' | 'xypad'
    this.activeSceneId = '';
    this.scenes = [];
    this.isBlackout = false;
    this.currentBpm = 120;
    this.currentSpeed = 1.0;
    this.isReverse = false;
    this.mutateBeats = 0;

    this.init();
  }

  init() {
    // Initialize Local Tap Tempo engine (4-beat rolling avg)
    this.tapTempo = new LocalTapTempo({
      onBpmCalculated: (bpm) => this.handleLocalTap(bpm)
    });

    this.setupDom();

    if (!this.room) {
      this.showPinEntryModal();
    } else {
      this.startConnection();
    }
  }

  showPinEntryModal() {
    let modal = document.getElementById('remote-pin-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'remote-pin-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.92); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      modal.innerHTML = `
        <div style="background: #11131a; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 32px 28px; width: 88%; max-width: 360px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; font-weight: 700; margin-bottom: 8px;">
            HYDRALISK CONTROLLER
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">Enter Room Code</h2>
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 20px; line-height: 1.4;">
            Look at the Player screen or projector for the 4-letter Room Code.
          </p>
          <form id="pin-form" style="display: flex; flex-direction: column; gap: 12px;">
            <input type="text" id="pin-input" maxlength="4" placeholder="e.g. K9X2" autofocus autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="background: rgba(0,0,0,0.6); border: 2px solid rgba(56,189,248,0.4); border-radius: 12px; color: #fff; font-size: 32px; font-weight: 900; letter-spacing: 8px; text-align: center; text-transform: uppercase; padding: 12px; outline: none; font-family: monospace;" />
            <button type="submit" style="background: #38bdf8; border: none; border-radius: 12px; color: #000; font-size: 14px; font-weight: 800; letter-spacing: 1px; padding: 14px; cursor: pointer;">CONNECT TO PLAYER</button>
          </form>
          <div style="margin-top: 16px; font-size: 11px; color: #64748b;">
            Tip: Scanning the QR code pairs automatically without typing a code.
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const form = modal.querySelector('#pin-form');
      const input = modal.querySelector('#pin-input');
      setTimeout(() => input.focus(), 100);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = (input.value || '').toUpperCase().trim();
        if (code.length >= 2) {
          this.room = code;
          if (this.roomBadge) this.roomBadge.textContent = this.room;
          const url = new URL(window.location);
          url.searchParams.set('room', this.room);
          window.history.replaceState({}, '', url.toString());
          modal.remove();
          this.startConnection();
        }
      });
    }
  }

  startConnection() {
    if (this.connection) this.connection.dispose();
    this.connection = new RemoteConnection({
      role: 'controller',
      room: this.room,
      token: this.token,
      onStatusChange: (status) => this.updateConnectionStatus(status)
    });
    this.setupListeners();
    this.connection.connect();
  }

  setupDom() {
    // Cache UI elements
    this.statusLed = document.getElementById('status-led');
    this.statusText = document.getElementById('status-text');
    this.roomBadge = document.getElementById('room-badge');
    this.bpmDisplay = document.getElementById('bpm-display');
    this.blackoutBtn = document.getElementById('blackout-btn');

    this.tapPad = document.getElementById('tap-tempo-pad');
    this.mutateModeBtns = document.querySelectorAll('.mutate-mode-btn');
    this.mutateNowBtn = document.getElementById('mutate-now-btn');
    this.undo5xBtn = document.getElementById('undo-5x-btn');

    this.speedBtns = document.querySelectorAll('.speed-btn');
    this.revBtn = document.getElementById('speed-rev-btn');

    this.surfaceContainer = document.getElementById('expressive-surface');
    this.toggleSurfaceBtn = document.getElementById('toggle-surface-btn');

    this.sceneDrawer = document.getElementById('scene-drawer');
    this.sceneDrawerBtn = document.getElementById('scene-drawer-toggle');
    this.sceneListContainer = document.getElementById('scene-list-grid');

    if (this.roomBadge) {
      this.roomBadge.textContent = this.room || '----';
    }

    // Initialize Fader Bank
    this.faderBank = new FaderBank({
      containerEl: this.surfaceContainer,
      onChange: (key, val) => {
        this.connection.sendContinuous('MIDI_CC', key, { cc: key, val });
      }
    });

    this.bindDomEvents();
  }

  bindDomEvents() {
    // Tap Tempo Pad
    if (this.tapPad) {
      const handleTap = (e) => {
        e.preventDefault();
        const bpm = this.tapTempo.tap();
        this.bpmDisplay.textContent = `${Math.round(bpm)} BPM`;
        this.tapPad.classList.add('pulse');
        setTimeout(() => this.tapPad.classList.remove('pulse'), 120);
      };
      this.tapPad.addEventListener('touchstart', handleTap, { passive: false });
      this.tapPad.addEventListener('mousedown', handleTap);
    }

    // Blackout Button
    if (this.blackoutBtn) {
      this.blackoutBtn.addEventListener('click', () => {
        this.isBlackout = !this.isBlackout;
        this.blackoutBtn.classList.toggle('active', this.isBlackout);
        this.connection.sendIntent('BLACKOUT', { active: this.isBlackout });
      });
    }

    // Auto-Mutate Mode buttons
    this.mutateModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const beats = parseInt(btn.dataset.beats, 10);
        this.setMutateModeUi(beats);
        this.connection.sendIntent('AUTO_MUTATE', { beats });
      });
    });

    // Mutate Now
    if (this.mutateNowBtn) {
      this.mutateNowBtn.addEventListener('click', () => {
        this.connection.sendIntent('MUTATE_NOW', { seed: Math.floor(Math.random() * 100000) });
        this.mutateNowBtn.classList.add('pulse');
        setTimeout(() => this.mutateNowBtn.classList.remove('pulse'), 150);
      });
    }

    // Undo 5x
    if (this.undo5xBtn) {
      this.undo5xBtn.addEventListener('click', () => {
        this.connection.sendIntent('UNDO_5X', {});
        this.undo5xBtn.classList.add('pulse');
        setTimeout(() => this.undo5xBtn.classList.remove('pulse'), 150);
      });
    }

    // Speed buttons
    this.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        this.setSpeedUi(speed);
        this.connection.sendIntent('SPEED_DIAL', { multiplier: speed, reverse: this.isReverse });
      });
    });

    // Reverse toggle
    if (this.revBtn) {
      this.revBtn.addEventListener('click', () => {
        this.isReverse = !this.isReverse;
        this.revBtn.classList.toggle('active', this.isReverse);
        this.connection.sendIntent('SPEED_DIAL', { multiplier: this.currentSpeed, reverse: this.isReverse });
      });
    }

    // Toggle Expressive Surface (Faders vs XY Pad)
    if (this.toggleSurfaceBtn) {
      this.toggleSurfaceBtn.addEventListener('click', () => {
        this.toggleSurfaceMode();
      });
    }

    // Scene Drawer toggle
    if (this.sceneDrawerBtn && this.sceneDrawer) {
      this.sceneDrawerBtn.addEventListener('click', () => {
        this.sceneDrawer.classList.toggle('open');
      });
    }
  }

  handleLocalTap(bpm) {
    this.currentBpm = bpm;
    this.bpmDisplay.textContent = `${Math.round(bpm)} BPM`;
    this.connection.sendIntent('TAP_TEMPO', { bpm, ts: Date.now() });
  }

  toggleSurfaceMode() {
    if (this.currentMode === 'faders') {
      this.currentMode = 'xypad';
      this.toggleSurfaceBtn.textContent = 'SWITCH TO FADERS';
      this.surfaceContainer.innerHTML = '';
      this.surfaceContainer.className = 'xy-pad-grid';

      const pad1El = document.createElement('div');
      const pad2El = document.createElement('div');
      this.surfaceContainer.appendChild(pad1El);
      this.surfaceContainer.appendChild(pad2El);

      this.xyPad1 = new XYPad({
        containerEl: pad1El,
        xKey: 'b1',
        yKey: 'b2',
        onChange: (xk, xv, yk, yv) => {
          this.connection.sendContinuous('MIDI_CC', xk, { cc: xk, val: xv });
          this.connection.sendContinuous('MIDI_CC', yk, { cc: yk, val: yv });
        }
      });

      this.xyPad2 = new XYPad({
        containerEl: pad2El,
        xKey: 'b3',
        yKey: 'b4',
        onChange: (xk, xv, yk, yv) => {
          this.connection.sendContinuous('MIDI_CC', xk, { cc: xk, val: xv });
          this.connection.sendContinuous('MIDI_CC', yk, { cc: yk, val: yv });
        }
      });
    } else {
      this.currentMode = 'faders';
      this.toggleSurfaceBtn.textContent = 'SWITCH TO XY PAD';
      this.faderBank.render();
      this.faderBank.bindEvents();
    }
  }

  setupListeners() {
    // 1. Sync full state
    this.connection.on('SYNC', (envelope) => {
      const state = envelope.payload || {};
      this.applyShadowState(state);
    });

    // 2. Incoming state updates from player or other controllers
    this.connection.on('AUTO_MUTATE', (payload) => {
      if (payload && payload.beats !== undefined) {
        this.setMutateModeUi(payload.beats);
      }
    });

    this.connection.on('TAP_TEMPO', (payload) => {
      if (payload && payload.bpm) {
        this.currentBpm = payload.bpm;
        this.bpmDisplay.textContent = `${Math.round(payload.bpm)} BPM`;
      }
    });

    this.connection.on('SPEED_DIAL', (payload) => {
      if (payload) {
        if (payload.multiplier) this.setSpeedUi(payload.multiplier);
        if (payload.reverse !== undefined) {
          this.isReverse = payload.reverse;
          if (this.revBtn) this.revBtn.classList.toggle('active', this.isReverse);
        }
      }
    });

    this.connection.on('BLACKOUT', (payload) => {
      if (payload && payload.active !== undefined) {
        this.isBlackout = payload.active;
        if (this.blackoutBtn) this.blackoutBtn.classList.toggle('active', this.isBlackout);
      }
    });

    this.connection.on('REGISTER_SCENES', (payload) => {
      if (payload && payload.scenes) {
        this.renderSceneCatalog(payload.scenes);
      }
    });

    this.connection.on('LOAD_SCENE', (payload) => {
      if (payload && payload.id) {
        this.highlightActiveScene(payload.id);
      }
    });
  }

  applyShadowState(state) {
    if (!state) return;
    if (state.bpm) {
      this.currentBpm = state.bpm;
      this.bpmDisplay.textContent = `${Math.round(state.bpm)} BPM`;
    }
    if (state.mutate_beats !== undefined) {
      this.setMutateModeUi(state.mutate_beats);
    }
    if (state.speed) {
      this.setSpeedUi(state.speed);
    }
    if (state.reverse !== undefined) {
      this.isReverse = state.reverse;
      if (this.revBtn) this.revBtn.classList.toggle('active', this.isReverse);
    }
    if (state.blackout !== undefined) {
      this.isBlackout = state.blackout;
      if (this.blackoutBtn) this.blackoutBtn.classList.toggle('active', this.isBlackout);
    }
    if (state.cc_values && this.faderBank) {
      this.faderBank.setValuesFromMap(state.cc_values);
    }
    if (state.scene_list && state.scene_list.length > 0) {
      this.renderSceneCatalog(state.scene_list);
    }
    if (state.scene_id) {
      this.highlightActiveScene(state.scene_id);
    }
  }

  setMutateModeUi(beats) {
    this.mutateBeats = beats;
    this.mutateModeBtns.forEach((btn) => {
      const b = parseInt(btn.dataset.beats, 10);
      btn.classList.toggle('active', b === beats);
    });
  }

  setSpeedUi(speed) {
    this.currentSpeed = speed;
    this.speedBtns.forEach((btn) => {
      const s = parseFloat(btn.dataset.speed);
      btn.classList.toggle('active', Math.abs(s - speed) < 0.05);
    });
  }

  renderSceneCatalog(scenes) {
    this.scenes = scenes || [];
    if (!this.sceneListContainer) return;
    this.sceneListContainer.innerHTML = '';

    scenes.forEach((scene) => {
      const card = document.createElement('button');
      card.className = `scene-card ${scene.id === this.activeSceneId ? 'active' : ''}`;
      card.dataset.sceneId = scene.id;
      card.innerHTML = `
        <div class="scene-name">${scene.name || scene.id}</div>
        <div class="scene-meta">${scene.author ? scene.author + ' · ' : ''}${scene.bpm || 120} BPM</div>
      `;
      card.addEventListener('click', () => {
        this.highlightActiveScene(scene.id);
        this.connection.sendIntent('LOAD_SCENE', { id: scene.id, name: scene.name, code: scene.code });
        if (this.sceneDrawer) this.sceneDrawer.classList.remove('open');
      });
      this.sceneListContainer.appendChild(card);
    });
  }

  highlightActiveScene(sceneId) {
    this.activeSceneId = sceneId;
    const cards = this.sceneListContainer ? this.sceneListContainer.querySelectorAll('.scene-card') : [];
    cards.forEach((c) => {
      c.classList.toggle('active', c.dataset.sceneId === sceneId);
    });
  }

  updateConnectionStatus(status) {
    if (!this.statusLed || !this.statusText) return;
    this.statusLed.className = 'status-led';
    if (status === 'connected') {
      this.statusLed.classList.add('status-connected');
      this.statusText.textContent = 'ONLINE';
    } else if (status === 'connecting') {
      this.statusLed.classList.add('status-connecting');
      this.statusText.textContent = 'CONNECTING...';
    } else {
      this.statusLed.classList.add('status-disconnected');
      this.statusText.textContent = 'OFFLINE';
    }
  }
}

// Auto-launch when page DOM loads
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.hydraliskController = new ControllerApp();
  });
}
