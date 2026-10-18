/**
 * wsConnection.js — Durable WebSocket connection for Hydralisk Remote Relay
 *
 * Features:
 * - Jittered exponential backoff: min(3000, 100 * 1.5^attempt) + rand(0, 100) ms
 * - Instant reconnection on 'online' and 'visibilitychange' (screen unlock)
 * - Throttled 60Hz requestAnimationFrame continuous parameter dispatcher
 * - Type & Action event subscriptions
 */

export class RemoteConnection {
  constructor({ url, role, room, token, onStatusChange }) {
    this.baseUrl = url || this.detectDefaultWsUrl();
    this.role = role || 'player';
    this.room = room || '';
    this.token = token || '';
    this.onStatusChange = onStatusChange || (() => {});

    this.ws = null;
    this.status = 'disconnected'; // 'connecting', 'connected', 'disconnected', 'error'
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.seq = 0;
    this.listeners = new Map(); // eventKey -> Set of callbacks
    this.isDisposed = false;

    // 60Hz continuous frame buffer: channelKey -> envelope
    this.rafPending = false;
    this.continuousQueue = new Map();

    this.setupLifecycleHooks();
  }

  detectDefaultWsUrl() {
    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    const port = window.location.port;
    const hostname = window.location.hostname;

    // In local development or LAN testing, the Go relay runs on port 8080
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      port === '1984' ||
      port === '3000' ||
      port === '5173' ||
      /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)
    ) {
      return `${proto}//${hostname}:8080/ws`;
    }
    return `${proto}//${window.location.host}/ws`;
  }

  setupLifecycleHooks() {
    this.onOnline = () => {
      if (this.status !== 'connected' && !this.isDisposed) {
        console.log('[RemoteWS] Network online, reconnecting immediately...');
        this.reconnectNow();
      }
    };

    this.onVisibility = () => {
      if (document.visibilityState === 'visible' && this.status !== 'connected' && !this.isDisposed) {
        console.log('[RemoteWS] Tab visible, reconnecting immediately...');
        this.reconnectNow();
      }
    };

    window.addEventListener('online', this.onOnline);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  connect() {
    if (this.isDisposed || this.ws) return;

    this.setStatus('connecting');

    // Build URL with parameters
    const url = new URL(this.baseUrl, window.location.href);
    url.searchParams.set('role', this.role);
    if (this.room) url.searchParams.set('room', this.room);
    if (this.token) url.searchParams.set('token', this.token);

    try {
      this.ws = new WebSocket(url.toString());
    } catch (err) {
      console.warn('[RemoteWS] WebSocket creation error:', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log(`[RemoteWS] Connected as ${this.role} (room: ${this.room || 'new'})`);
      this.setStatus('connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        this.dispatch(envelope);
      } catch (err) {
        console.warn('[RemoteWS] Failed to parse message:', err);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('[RemoteWS] Socket error:', err);
    };

    this.ws.onclose = (event) => {
      console.log(`[RemoteWS] Disconnected (code: ${event.code})`);
      this.ws = null;
      this.setStatus('disconnected');
      if (!this.isDisposed) {
        this.scheduleReconnect();
      }
    };
  }

  setStatus(status) {
    this.status = status;
    this.onStatusChange(status);
    this.emit('status', status);
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.isDisposed) return;
    this.reconnectAttempts++;
    // Jittered exponential backoff: min(3000, 100 * 1.5^attempt) + rand(0, 100) ms
    const base = Math.min(3000, 100 * Math.pow(1.5, this.reconnectAttempts));
    const jitter = Math.floor(Math.random() * 100);
    const delay = Math.round(base + jitter);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  reconnectNow() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Send a reliable state intent immediately.
   */
  sendIntent(action, payload = {}) {
    this.seq++;
    const envelope = {
      v: 1,
      seq: this.seq,
      ts: Date.now(),
      type: 'INTENT',
      action,
      payload
    };
    return this.send(envelope);
  }

  /**
   * Queue a continuous stream message (e.g. MIDI_CC) for 60Hz throttled dispatch.
   * Collapses multiple updates for the same key (e.g. "b1") in a single animation frame.
   */
  sendContinuous(action, key, payload) {
    this.continuousQueue.set(`${action}:${key}`, { action, payload });
    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(() => this.flushContinuous());
    }
  }

  flushContinuous() {
    this.rafPending = false;
    if (this.status !== 'connected' || !this.ws) return;

    for (const { action, payload } of this.continuousQueue.values()) {
      this.sendIntent(action, payload);
    }
    this.continuousQueue.clear();
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } catch (err) {
      console.warn('[RemoteWS] Send error:', err);
      return false;
    }
  }

  /**
   * Dispatch incoming message to registered listeners
   */
  dispatch(envelope) {
    // If HELLO packet, store room and token
    if (envelope.type === 'HELLO' && envelope.payload) {
      if (envelope.payload.room_id) this.room = envelope.payload.room_id;
      if (envelope.payload.controller_token) this.token = envelope.payload.controller_token;
    }

    // Emit by Type (e.g. "INTENT", "SYNC", "HELLO")
    this.emit(envelope.type, envelope);

    // Emit by Action (e.g. "LOAD_SCENE", "MIDI_CC", "FULL_STATE")
    if (envelope.action) {
      this.emit(envelope.action, envelope.payload, envelope);
    }

    // Global message listener
    this.emit('message', envelope);
  }

  on(eventKey, callback) {
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }
    this.listeners.get(eventKey).add(callback);
    return () => this.off(eventKey, callback);
  }

  off(eventKey, callback) {
    const set = this.listeners.get(eventKey);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.listeners.delete(eventKey);
    }
  }

  emit(eventKey, ...args) {
    const set = this.listeners.get(eventKey);
    if (set) {
      for (const cb of set) {
        try { cb(...args); } catch (e) { console.error(`[RemoteWS] Error in listener for ${eventKey}:`, e); }
      }
    }
  }

  dispose() {
    this.isDisposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    window.removeEventListener('online', this.onOnline);
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.listeners.clear();
    this.continuousQueue.clear();
  }
}
