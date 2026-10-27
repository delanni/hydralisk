/**
 * playerClient.js — Player Client Adapter for Hydralisk Remote Relay
 *
 * Runs in the projector / player browser:
 * 1. Establishes a durable WebSocket connection to the Go relay daemon as role=player.
 * 2. Manages room persistence (sessionStorage) across page reloads.
 * 3. Registers local/remote sketch catalog with REGISTER_SCENES so the phone can browse scenes.
 * 4. Translates remote intents (AUTO_MUTATE, MUTATE_NOW, UNDO_5X, SPEED_DIAL, TAP_TEMPO, MIDI_CC, BLACKOUT, LOAD_SCENE)
 *    directly into Hydralisk player actions and virtual MIDI CC bridges without synthetic DOM events.
 * 5. Controls the toggleable QR code pairing overlay (Ctrl+Shift+R).
 */

import { RemoteConnection } from './wsConnection.js';
import { QROverlay } from './qrOverlay.js';
import * as actions from '../player/actions/index.js';
import { getState } from '../player/store/playerStore.js';
import { notify } from '../player/services/intercom.js';

const STORAGE_KEY_ROOM = 'hydralisk_remote_room';
const STORAGE_KEY_TOKEN = 'hydralisk_remote_token';

export class PlayerRemoteClient {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || null;
    this.connection = null;
    this.qrOverlay = null;
    this.room = sessionStorage.getItem(STORAGE_KEY_ROOM) || '';
    this.token = sessionStorage.getItem(STORAGE_KEY_TOKEN) || '';
    this.originalSpeedBeforeBlackout = 1.0;
    this.isBlackout = false;

    this.init();
  }

  init() {
    this.qrOverlay = new QROverlay();

    this.connection = new RemoteConnection({
      url: this.wsUrl,
      role: 'player',
      room: this.room,
      token: this.token,
      onStatusChange: (status) => this.handleStatusChange(status)
    });

    this.setupIntentHandlers();
    this.connection.connect();

    // Expose global for dev console and UI triggers
    window.hydraliskRemote = {
      client: this,
      connection: this.connection,
      qrOverlay: this.qrOverlay,
      toggleQR: () => this.qrOverlay.toggle(),
      getRoom: () => this.room,
      getToken: () => this.token
    };
  }

  setupIntentHandlers() {
    // 1. Handshake response (HELLO)
    this.connection.on('HELLO', (envelope) => {
      const p = envelope.payload || {};
      if (p.room_id) {
        this.room = p.room_id;
        sessionStorage.setItem(STORAGE_KEY_ROOM, this.room);
      }
      if (p.controller_token) {
        this.token = p.controller_token;
        sessionStorage.setItem(STORAGE_KEY_TOKEN, this.token);
      }

      this.qrOverlay.update({
        room: this.room,
        token: this.token,
        phoneConnected: p.controller_count > 0
      });

      // Synchronize available scene deck to relay
      this.syncSceneCatalog();
    });

    // 2. Full State Sync
    this.connection.on('SYNC', (envelope) => {
      // Sync initial state if desired
      this.syncSceneCatalog();
    });

    // 3. Virtual MIDI CC (ephemeral continuous stream)
    this.connection.on('MIDI_CC', (payload) => {
      if (!payload || !payload.cc) return;
      if (window.hydraliskMidiBridge && typeof window.hydraliskMidiBridge.setVirtualCC === 'function') {
        window.hydraliskMidiBridge.setVirtualCC(payload.cc, payload.val);
      }
    });

    // 4. Auto-Mutate mode
    this.connection.on('AUTO_MUTATE', (payload) => {
      if (!payload) return;
      const beats = payload.beats;
      const mode = beats === 0 || beats === '0' || beats === 'off' ? 'off' : beats.toString();
      actions.setAutomutateMode(mode);
    });

    // 5. Immediate single mutation
    this.connection.on('MUTATE_NOW', () => {
      actions.triggerMutation();
    });

    // 6. Undo 5x history
    this.connection.on('UNDO_5X', () => {
      // Step back 5 mutations in history
      for (let i = 0; i < 5; i++) {
        actions.undoMutation();
      }
      notify('Remote: 5x Undo executed');
    });

    // 7. Speed dial & reverse
    this.connection.on('SPEED_DIAL', (payload) => {
      if (!payload) return;
      if (typeof payload.multiplier === 'number') {
        actions.setSpeed(payload.multiplier);
      }
      if (typeof payload.reverse === 'boolean') {
        const curSpeed = window.speed || 1.0;
        if (payload.reverse && curSpeed > 0) {
          actions.reverseSpeed();
        } else if (!payload.reverse && curSpeed < 0) {
          actions.reverseSpeed();
        }
      }
    });

    // 8. Tap Tempo (computed BPM from mobile)
    this.connection.on('TAP_TEMPO', (payload) => {
      if (payload && typeof payload.bpm === 'number' && payload.bpm > 0) {
        actions.setBpm(Math.round(payload.bpm));
        notify(`Remote Tempo: ${Math.round(payload.bpm)} BPM`);
      }
    });

    // 9. Load Scene
    this.connection.on('LOAD_SCENE', (payload) => {
      if (!payload) return;
      if (payload.id) {
        actions.playSketch(payload.id);
      } else if (payload.code) {
        actions.setEditorCode(payload.code);
        actions.runCustomCode();
      }
    });

    // 10. Blackout
    this.connection.on('BLACKOUT', (payload) => {
      const active = payload ? Boolean(payload.active) : !this.isBlackout;
      this.setBlackout(active);
    });
  }

  setBlackout(active) {
    this.isBlackout = active;
    let blackoutEl = document.getElementById('remote-blackout-curtain');
    if (!blackoutEl) {
      blackoutEl = document.createElement('div');
      blackoutEl.id = 'remote-blackout-curtain';
      blackoutEl.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #000; z-index: 99999; pointer-events: none;
        opacity: 0; transition: opacity 0.25s ease-in-out;
      `;
      document.body.appendChild(blackoutEl);
    }

    if (active) {
      this.originalSpeedBeforeBlackout = window.speed || 1.0;
      window.speed = 0;
      blackoutEl.style.opacity = '1';
      notify('Remote: BLACKOUT ACTIVE');
    } else {
      window.speed = this.originalSpeedBeforeBlackout || 1.0;
      blackoutEl.style.opacity = '0';
      notify('Remote: Blackout lifted');
    }
  }

  syncSceneCatalog() {
    const { sketches } = getState();
    if (!sketches || sketches.length === 0) return;

    const catalog = sketches.slice(0, 100).map((s, idx) => ({
      id: s.name || `sketch_${idx}`,
      name: s.name || `Sketch ${idx + 1}`,
      author: s.author || '',
      bpm: s.bpm || 120
    }));

    this.connection.sendIntent('REGISTER_SCENES', { scenes: catalog });
  }

  handleStatusChange(status) {
    if (status === 'connected') {
      notify(`Remote Relay: Connected (Room ${this.room || '...'})`);
    }
  }
}

// Auto-start remote client if on player page or in player mode
export function initPlayerRemoteClient(options = {}) {
  if (typeof window === 'undefined') return null;
  return new PlayerRemoteClient(options);
}
