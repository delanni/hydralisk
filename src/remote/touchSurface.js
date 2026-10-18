/**
 * touchSurface.js — Multi-touch Faders, XY Pad, and Jitter-Free Tap Tempo Engine
 *
 * Designed for low-latency live performance on mobile capacitive touchscreens.
 */

export class LocalTapTempo {
  constructor({ onBpmCalculated }) {
    this.taps = [];
    this.idleTimeoutMs = 3000;
    this.resetTimer = null;
    this.currentBpm = 120;
    this.onBpmCalculated = onBpmCalculated || (() => {});
  }

  tap() {
    const now = performance.now();

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => this.reset(), this.idleTimeoutMs);

    // If last tap was older than timeout, start fresh
    if (this.taps.length > 0 && (now - this.taps[this.taps.length - 1]) > this.idleTimeoutMs) {
      this.taps = [];
    }

    this.taps.push(now);
    if (this.taps.length > 16) {
      this.taps.shift();
    }

    // Calculate rolling average BPM once we have at least 3 intervals (4 taps)
    if (this.taps.length >= 4) {
      const intervals = [];
      for (let i = 1; i < this.taps.length; i++) {
        intervals.push(this.taps[i] - this.taps[i - 1]);
      }
      const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgIntervalMs > 0) {
        const rawBpm = 60000 / avgIntervalMs;
        // Clamp reasonable performance BPM range [30, 300]
        const clampedBpm = Math.max(30, Math.min(300, Math.round(rawBpm * 10) / 10));
        this.currentBpm = clampedBpm;
        this.onBpmCalculated(this.currentBpm);
      }
    }

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(12); } catch (e) {}
    }

    return this.currentBpm;
  }

  reset() {
    this.taps = [];
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}

/**
 * Multi-touch Fader Bank Controller
 * Supports 8 simultaneous faders (b1..b8) without multi-touch cross-talk.
 */
export class FaderBank {
  constructor({ containerEl, onChange }) {
    this.container = containerEl;
    this.onChange = onChange || (() => {});
    this.faders = {}; // "b1".."b8" -> { value: 0.0..1.0, el, trackEl, fillEl, thumbEl }
    this.activeTouches = new Map(); // identifier -> faderKey

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'fader-bank-grid';

    for (let i = 1; i <= 8; i++) {
      const key = `b${i}`;
      const faderEl = document.createElement('div');
      faderEl.className = 'fader-track-container';
      faderEl.dataset.fader = key;

      faderEl.innerHTML = `
        <div class="fader-label">${key.toUpperCase()}</div>
        <div class="fader-track">
          <div class="fader-fill" style="height: 50%;"></div>
          <div class="fader-thumb" style="bottom: 50%;"></div>
        </div>
        <div class="fader-val">.50</div>
      `;

      this.container.appendChild(faderEl);

      this.faders[key] = {
        value: 0.5,
        containerEl: faderEl,
        trackEl: faderEl.querySelector('.fader-track'),
        fillEl: faderEl.querySelector('.fader-fill'),
        thumbEl: faderEl.querySelector('.fader-thumb'),
        valEl: faderEl.querySelector('.fader-val')
      };
    }
  }

  bindEvents() {
    const handleTouch = (touch) => {
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const faderTrack = target ? target.closest('.fader-track-container') : null;
      if (!faderTrack) return;
      const key = faderTrack.dataset.fader;
      if (!key || !this.faders[key]) return;

      const fader = this.faders[key];
      const rect = fader.trackEl.getBoundingClientRect();
      const relativeY = touch.clientY - rect.top;
      // Invert: top is 1.0, bottom is 0.0
      const norm = Math.max(0, Math.min(1, 1 - (relativeY / rect.height)));
      this.setValue(key, norm, true);
    };

    this.container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const faderTrack = target ? target.closest('.fader-track-container') : null;
        if (faderTrack && faderTrack.dataset.fader) {
          this.activeTouches.set(touch.identifier, faderTrack.dataset.fader);
          handleTouch(touch);
        }
      }
    }, { passive: false });

    this.container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const key = this.activeTouches.get(touch.identifier);
        if (key && this.faders[key]) {
          const fader = this.faders[key];
          const rect = fader.trackEl.getBoundingClientRect();
          const relativeY = touch.clientY - rect.top;
          const norm = Math.max(0, Math.min(1, 1 - (relativeY / rect.height)));
          this.setValue(key, norm, true);
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.activeTouches.delete(e.changedTouches[i].identifier);
      }
    };

    this.container.addEventListener('touchend', endTouch);
    this.container.addEventListener('touchcancel', endTouch);

    // Mouse fallback for desktop testing
    let isMouseDown = false;
    let activeMouseFader = null;

    this.container.addEventListener('mousedown', (e) => {
      const faderTrack = e.target.closest('.fader-track-container');
      if (faderTrack && faderTrack.dataset.fader) {
        isMouseDown = true;
        activeMouseFader = faderTrack.dataset.fader;
        const fader = this.faders[activeMouseFader];
        const rect = fader.trackEl.getBoundingClientRect();
        const norm = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height)));
        this.setValue(activeMouseFader, norm, true);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown && activeMouseFader && this.faders[activeMouseFader]) {
        const fader = this.faders[activeMouseFader];
        const rect = fader.trackEl.getBoundingClientRect();
        const norm = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height)));
        this.setValue(activeMouseFader, norm, true);
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
      activeMouseFader = null;
    });
  }

  setValue(key, value, triggerCallback = false) {
    const fader = this.faders[key];
    if (!fader) return;
    const norm = Math.max(0, Math.min(1, value));
    fader.value = norm;
    const percent = (norm * 100).toFixed(1);

    fader.fillEl.style.height = `${percent}%`;
    fader.thumbEl.style.bottom = `${percent}%`;
    fader.valEl.textContent = norm.toFixed(2);

    if (triggerCallback) {
      this.onChange(key, norm);
    }
  }

  setValuesFromMap(map) {
    if (!map) return;
    for (const [key, val] of Object.entries(map)) {
      if (this.faders[key]) {
        this.setValue(key, val, false);
      }
    }
  }
}

/**
 * 2D XY Touchpad Controller
 * Mapped to b1/b2 (Pad 1) or b3/b4 (Pad 2)
 */
export class XYPad {
  constructor({ containerEl, xKey = 'b1', yKey = 'b2', onChange }) {
    this.container = containerEl;
    this.xKey = xKey;
    this.yKey = yKey;
    this.onChange = onChange || (() => {});
    this.x = 0.5;
    this.y = 0.5;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.className = 'xy-pad-container';
    this.container.innerHTML = `
      <div class="xy-grid-lines"></div>
      <div class="xy-crosshair-h"></div>
      <div class="xy-crosshair-v"></div>
      <div class="xy-puck" style="left: 50%; top: 50%;"></div>
      <div class="xy-readout">${this.xKey.toUpperCase()}: .50  ${this.yKey.toUpperCase()}: .50</div>
    `;

    this.puckEl = this.container.querySelector('.xy-puck');
    this.crosshairH = this.container.querySelector('.xy-crosshair-h');
    this.crosshairV = this.container.querySelector('.xy-crosshair-v');
    this.readoutEl = this.container.querySelector('.xy-readout');
  }

  bindEvents() {
    const updateFromCoord = (clientX, clientY) => {
      const rect = this.container.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, 1 - ((clientY - rect.top) / rect.height)));
      this.setPosition(nx, ny, true);
    };

    this.container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.targetTouches.length > 0) {
        updateFromCoord(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      }
    }, { passive: false });

    this.container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.targetTouches.length > 0) {
        updateFromCoord(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      }
    }, { passive: false });

    // Mouse fallback
    let isMouseDown = false;
    this.container.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      updateFromCoord(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) updateFromCoord(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => { isMouseDown = false; });
  }

  setPosition(x, y, triggerCallback = false) {
    this.x = Math.max(0, Math.min(1, x));
    this.y = Math.max(0, Math.min(1, y));

    const leftPct = (this.x * 100).toFixed(1);
    const topPct = ((1 - this.y) * 100).toFixed(1);

    this.puckEl.style.left = `${leftPct}%`;
    this.puckEl.style.top = `${topPct}%`;
    this.crosshairV.style.left = `${leftPct}%`;
    this.crosshairH.style.top = `${topPct}%`;

    this.readoutEl.textContent = `${this.xKey.toUpperCase()}: ${this.x.toFixed(2)}  ${this.yKey.toUpperCase()}: ${this.y.toFixed(2)}`;

    if (triggerCallback) {
      this.onChange(this.xKey, this.x, this.yKey, this.y);
    }
  }
}
