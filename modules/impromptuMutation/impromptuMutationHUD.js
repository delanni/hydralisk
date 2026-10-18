/**
 * Impromptu Mutation HUD & Modal Controller
 * Provides non-intrusive HUD feedback and an interactive modal interface.
 */

export class ImpromptuMutationHUD {
  constructor(service) {
    this.service = service;
    this.hudEl = null;
    this.modalEl = null;
    this.isOpen = false;
    this.fadeTimeout = null;

    this.initDOM();
    this.bindServiceEvents();
  }

  initDOM() {
    if (typeof document === 'undefined') return;

    // 1. Create HUD Pill
    this.hudEl = document.createElement('div');
    this.hudEl.id = 'impromptu-hud';
    this.hudEl.title = 'Impromptu Mutation (Click to open controls, Cmd+I to trigger)';
    this.hudEl.innerHTML = `
      <i class="fa fa-bolt impromptu-hud-icon"></i>
      <span class="impromptu-hud-badge" id="impromptu-hud-text">BURST: 0</span>
      <div class="impromptu-hud-meter" id="impromptu-hud-meter"></div>
    `;
    this.hudEl.onclick = () => this.toggleModal();
    document.body.appendChild(this.hudEl);

    // 2. Create Modal Overlay
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'impromptu-modal-overlay';
    this.modalEl.innerHTML = `
      <div class="impromptu-modal" onclick="event.stopPropagation()">
        <div class="impromptu-modal-header">
          <div class="impromptu-modal-title">
            <i class="fa fa-bolt"></i> Impromptu Mutation Controller
          </div>
          <button class="impromptu-modal-close" id="impromptu-modal-close-btn">&times;</button>
        </div>

        <div class="impromptu-dial-section">
          <div class="impromptu-dial-label-row">
            <span class="impromptu-dial-name">MIDI CC Dial (0.00 → 1.00)</span>
            <span class="impromptu-dial-value" id="impromptu-dial-readout">0.00 (0 mutations)</span>
          </div>

          <input type="range" min="0" max="1" step="0.01" value="0" class="impromptu-range-slider" id="impromptu-slider" />

          <div class="impromptu-quick-buttons">
            <button class="impromptu-quick-btn active" data-val="0">0 (Undo)</button>
            <button class="impromptu-quick-btn" data-val="0.1">1</button>
            <button class="impromptu-quick-btn" data-val="0.2">2</button>
            <button class="impromptu-quick-btn" data-val="0.3">3</button>
            <button class="impromptu-quick-btn" data-val="0.4">4</button>
            <button class="impromptu-quick-btn" data-val="0.5">5</button>
            <button class="impromptu-quick-btn" data-val="0.7">7</button>
            <button class="impromptu-quick-btn" data-val="1.0">10 (Max)</button>
          </div>
        </div>

        <div class="impromptu-status-box undo" id="impromptu-status-box">
          CC~0 armed: Press event fires UNDO to pre-mutation state.
        </div>

        <div class="impromptu-preview-box" id="impromptu-code-preview">// Pre-calculated to-be state preview...</div>

        <div class="impromptu-actions-row">
          <button class="impromptu-action-btn impromptu-btn-burst" id="impromptu-btn-trigger">
            <i class="fa fa-bolt"></i> Trigger Press (Space/Enter)
          </button>
          <button class="impromptu-action-btn impromptu-btn-undo" id="impromptu-btn-undo">
            <i class="fa fa-undo"></i> Undo
          </button>
          <button class="impromptu-action-btn impromptu-btn-reroll" id="impromptu-btn-reroll">
            <i class="fa fa-refresh"></i> Reroll
          </button>
        </div>

        <div class="impromptu-midi-footer">
          <span>Shortcuts: <kbd>Cmd+I</kbd> to Trigger / <kbd>Shift-Ctrl-I</kbd> for Modal</span>
          <span class="impromptu-midi-link" id="impromptu-open-midi-link">Open MIDI Mapping &rarr;</span>
        </div>
      </div>
    `;
    this.modalEl.onclick = () => this.closeModal();
    document.body.appendChild(this.modalEl);

    // Bind Modal Internal Events
    const closeBtn = this.modalEl.querySelector('#impromptu-modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.closeModal();

    const slider = this.modalEl.querySelector('#impromptu-slider');
    if (slider) {
      slider.oninput = (e) => {
        this.service.setCC(parseFloat(e.target.value));
      };
    }

    const quickBtns = this.modalEl.querySelectorAll('.impromptu-quick-btn');
    quickBtns.forEach((btn) => {
      btn.onclick = () => {
        const val = parseFloat(btn.getAttribute('data-val'));
        if (slider) slider.value = val;
        this.service.setCC(val);
      };
    });

    const triggerBtn = this.modalEl.querySelector('#impromptu-btn-trigger');
    if (triggerBtn) {
      triggerBtn.onclick = () => this.service.trigger();
    }

    const undoBtn = this.modalEl.querySelector('#impromptu-btn-undo');
    if (undoBtn) {
      undoBtn.onclick = () => {
        this.service.setCC(0);
        this.service.trigger();
      };
    }

    const rerollBtn = this.modalEl.querySelector('#impromptu-btn-reroll');
    if (rerollBtn) {
      rerollBtn.onclick = () => this.service.reroll();
    }

    const midiLink = this.modalEl.querySelector('#impromptu-open-midi-link');
    if (midiLink) {
      midiLink.onclick = () => {
        this.closeModal();
        if (window.midiMapping && typeof window.midiMapping.open === 'function') {
          window.midiMapping.open();
        } else if (window.xemitter) {
          window.xemitter.emit('midi-mapping:open');
        }
      };
    }

    // Modal keyboard handling (Escape to close, Enter to trigger)
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.closeModal();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.service.trigger();
      }
    });

    this.renderMeter(0);
  }

  bindServiceEvents() {
    this.service.on('change', (state) => this.onStateChange(state));
    this.service.on('applied', (result) => this.onApplied(result));
    this.service.on('undone', (result) => this.onUndone(result));
  }

  onStateChange(state) {
    this.renderMeter(state.mutationCount, state.isUndoMode);

    const badge = document.getElementById('impromptu-hud-text');
    if (badge) {
      if (state.isUndoMode) {
        badge.textContent = 'CC~0: UNDO';
        badge.className = 'impromptu-hud-badge undo-mode';
      } else {
        badge.textContent = `BURST: ${state.mutationCount}`;
        badge.className = 'impromptu-hud-badge';
      }
    }

    // Modal Updates
    const slider = document.getElementById('impromptu-slider');
    if (slider && document.activeElement !== slider) {
      slider.value = state.currentCC;
    }

    const readout = document.getElementById('impromptu-dial-readout');
    if (readout) {
      readout.textContent = `${state.currentCC.toFixed(2)} (${state.mutationCount} mutations)`;
    }

    const quickBtns = document.querySelectorAll('.impromptu-quick-btn');
    quickBtns.forEach((btn) => {
      const val = parseFloat(btn.getAttribute('data-val'));
      const active = Math.abs(val - state.currentCC) < 0.05 || (val === 0 && state.isUndoMode);
      btn.classList.toggle('active', active);
    });

    const statusBox = document.getElementById('impromptu-status-box');
    if (statusBox) {
      if (state.isUndoMode) {
        statusBox.className = 'impromptu-status-box undo';
        statusBox.textContent = 'CC~0 armed: Press event fires UNDO to pre-mutation state.';
      } else {
        statusBox.className = 'impromptu-status-box';
        statusBox.textContent = `${state.mutationCount} mutation${state.mutationCount > 1 ? 's' : ''} pre-calculated & armed in memory. Ready to swap on press!`;
      }
    }

    const preview = document.getElementById('impromptu-code-preview');
    if (preview) {
      preview.textContent = state.toBeCode || '// No code in editor';
    }

    // Show HUD pill and schedule auto-hide
    this.showHUD();
  }

  onApplied(result) {
    this.flashHUD('flash-burst');
    const badge = document.getElementById('impromptu-hud-text');
    if (badge) {
      badge.textContent = `⚡ +${result.count} SWAPPED!`;
      badge.className = 'impromptu-hud-badge';
    }
  }

  onUndone(result) {
    this.flashHUD('flash-undo');
    const badge = document.getElementById('impromptu-hud-text');
    if (badge) {
      badge.textContent = `↩ UNDONE!`;
      badge.className = 'impromptu-hud-badge undo-mode';
    }
  }

  renderMeter(count, isUndoMode) {
    const meter = document.getElementById('impromptu-hud-meter');
    if (!meter) return;

    let pipsHTML = '';
    for (let i = 1; i <= 10; i++) {
      const active = !isUndoMode && i <= count;
      const undo = isUndoMode && i === 1;
      pipsHTML += `<span class="impromptu-pip ${active ? 'active' : ''} ${undo ? 'undo-pip' : ''}"></span>`;
    }
    meter.innerHTML = pipsHTML;
  }

  showHUD() {
    if (!this.hudEl) return;
    this.hudEl.classList.add('visible');

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }

    // If modal is open, keep HUD visible
    if (!this.isOpen) {
      this.fadeTimeout = setTimeout(() => {
        if (!this.isOpen && this.hudEl) {
          this.hudEl.classList.remove('visible');
        }
      }, 2500);
    }
  }

  flashHUD(className) {
    if (!this.hudEl) return;
    this.showHUD();
    this.hudEl.classList.remove('flash-burst', 'flash-undo');
    // Force reflow
    void this.hudEl.offsetWidth;
    this.hudEl.classList.add(className);
    setTimeout(() => {
      if (this.hudEl) this.hudEl.classList.remove(className);
    }, 450);
  }

  toggleModal() {
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  openModal() {
    this.isOpen = true;
    if (this.modalEl) this.modalEl.classList.add('open');
    this.showHUD();
  }

  closeModal() {
    this.isOpen = false;
    if (this.modalEl) this.modalEl.classList.remove('open');
    this.showHUD();
  }
}
