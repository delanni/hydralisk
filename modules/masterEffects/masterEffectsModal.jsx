import React, { useState, useEffect } from 'react';
import './masterEffects.css';
import { masterEffectsService, MASTER_EFFECTS, buildEffectChain, deriveControls } from './masterEffectsService.js';

const NEW_EFFECT_TEMPLATE = {
  name: 'New Effect',
  icon: '🎛️',
  tag: 'Custom',
  description: '',
  chain: `.hue(midix("A", { min: -1, max: 1, default: 0, ease: "sine", duration: () => beatMs(2) }))
  .scale(midix("B", { min: 0.5, max: 2, default: 1, ease: "cubic", duration: () => beatMs(2) }))`
};

export default function MasterEffectsModal({ isOpen, onClose }) {
  const [selectedEffectId, setSelectedEffectId] = useState('hsl_plus');
  const [activeEffectId, setActiveEffectId] = useState(null);
  const [targetBuffer, setTargetBuffer] = useState('o0');
  const [sliderValues, setSliderValues] = useState({});
  const [, setRevision] = useState(0);
  // Edit draft: null when not editing; { id?, name, icon, tag, description, chain, controls? } otherwise
  const [draft, setDraft] = useState(null);

  // Re-render when the preset registry changes (save/delete/reset)
  useEffect(() => masterEffectsService.subscribe(() => setRevision((r) => r + 1)), []);

  useEffect(() => {
    if (isOpen) {
      setDraft(null);
      const code = masterEffectsService.getEditorCode();
      const active = masterEffectsService.getActiveEffectFromCode(code);
      setActiveEffectId(active);
      if (active) {
        setSelectedEffectId(active);
      }

      const { targetBuffer: buf } = masterEffectsService.findTargetBufferAndInsertionPoint(code);
      setTargetBuffer(buf);

      // Prepopulate slider values with default normalized positions (0.5)
      const initial = {};
      const sel = MASTER_EFFECTS.find((e) => e.id === (active || selectedEffectId)) || MASTER_EFFECTS[0];
      if (sel && sel.controls) {
        sel.controls.forEach((c) => {
          const cur = (typeof window !== 'undefined' && window.cc && window.cc[c.cc] !== undefined)
            ? window.cc[c.cc]
            : (typeof window !== 'undefined' && window.virtualCC && window.virtualCC[c.cc] !== undefined)
              ? window.virtualCC[c.cc]
              : (c.default - c.min) / (c.max - c.min);
          initial[c.cc] = Math.max(0, Math.min(1, cur));
        });
      }
      setSliderValues(initial);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (draft) setDraft(null);
        else onClose();
      } else if (draft) {
        // While editing, Cmd/Ctrl+Enter saves; plain Enter types newlines
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleSaveDraft();
        }
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedEffectId, draft]);

  if (!isOpen) return null;

  const selectedEffect = MASTER_EFFECTS.find((e) => e.id === selectedEffectId) || MASTER_EFFECTS[0];

  const handleApply = () => {
    if (!selectedEffect) return;
    masterEffectsService.applyToEditor(selectedEffect.id);
    setActiveEffectId(selectedEffect.id);
    onClose();
  };

  const handleBypass = () => {
    masterEffectsService.removeFromEditor();
    setActiveEffectId(null);
    onClose();
  };

  const handleSliderChange = (cc, normVal) => {
    setSliderValues((prev) => ({ ...prev, [cc]: normVal }));
    // Update live MIDI CC so live sketch modulates immediately
    if (typeof window !== 'undefined') {
      if (!window.cc) window.cc = {};
      window.cc[cc] = normVal;
      if (!window.virtualCC) window.virtualCC = {};
      window.virtualCC[cc] = normVal;
      if (window.hydraliskMidiBridge && typeof window.hydraliskMidiBridge.setVirtualCC === 'function') {
        window.hydraliskMidiBridge.setVirtualCC(cc, normVal);
      } else if (typeof window.setVirtualCC === 'function') {
        window.setVirtualCC(cc, normVal);
      }
    }
  };

  const startEdit = (effect) => {
    setSelectedEffectId(effect.id);
    setDraft({ ...effect, controls: effect.controls.map((c) => ({ ...c })) });
  };

  const startNew = () => setDraft({ ...NEW_EFFECT_TEMPLATE });

  const updateDraft = (key, value) => setDraft((d) => {
    if (!d) return d;
    if (key === 'chain') {
      return { ...d, chain: value, controls: deriveControls(value, d.controls || []) };
    }
    return { ...d, [key]: value };
  });

  const updateDraftControl = (cc, key, value) => setDraft((d) => ({
    ...d,
    controls: (d.controls || []).map((c) => (c.cc === cc ? { ...c, [key]: value } : c))
  }));

  function handleSaveDraft() {
    if (!draft) return;
    if (!draft.name || !draft.name.trim()) {
      window.showToast?.('Effect needs a name');
      return;
    }
    const controls = deriveControls(draft.chain, draft.controls || []);
    const saved = masterEffectsService.saveEffect({
      ...draft,
      name: draft.name.trim(),
      controls
    });
    setSelectedEffectId(saved.id);
    setDraft(null);
    window.showToast?.(`Master Effect Saved: ${saved.name}`);
  }

  const handleDelete = () => {
    if (!draft?.id) return;
    if (!window.confirm(`Delete master effect "${draft.name}"?`)) return;
    masterEffectsService.deleteEffect(draft.id);
    setDraft(null);
    setSelectedEffectId(MASTER_EFFECTS[0]?.id);
  };

  const handleReset = () => {
    if (!window.confirm('Reset all master effects to the built-in defaults? Custom effects will be lost.')) return;
    masterEffectsService.resetEffects();
    setDraft(null);
    setSelectedEffectId(MASTER_EFFECTS[0]?.id);
  };

  // Controls preview while editing: derived live from the chain, keeping edited labels/units
  const draftControls = draft ? deriveControls(draft.chain, draft.controls || []) : [];

  const renderEditor = () => (
    <div className="me-inspector-pane me-editor">
      <div className="me-pane-section-title">{draft.id ? `Edit: ${draft.name}` : 'New Master Effect'}</div>
      <div className="me-form-row">
        <input
          className="me-input me-input-icon"
          value={draft.icon || ''}
          onChange={(e) => updateDraft('icon', e.target.value)}
          aria-label="Icon"
          maxLength={4}
        />
        <input
          className="me-input"
          value={draft.name || ''}
          onChange={(e) => updateDraft('name', e.target.value)}
          placeholder="Name"
          aria-label="Name"
          autoFocus
        />
        <input
          className="me-input me-input-tag"
          value={draft.tag || ''}
          onChange={(e) => updateDraft('tag', e.target.value)}
          placeholder="Tag"
          aria-label="Tag"
        />
      </div>
      <textarea
        className="me-input me-textarea-desc"
        value={draft.description || ''}
        onChange={(e) => updateDraft('description', e.target.value)}
        placeholder="Description"
        aria-label="Description"
        rows={2}
      />
      <div>
        <div className="me-pane-section-title">Function Chain (inserted before .out)</div>
        <textarea
          className="me-input me-textarea-code"
          value={draft.chain || ''}
          onChange={(e) => updateDraft('chain', e.target.value)}
          spellCheck={false}
          aria-label="Function chain"
          rows={8}
        />
        <div className="me-hint">
          Use <code>midix("A".."D", {'{'} min, max, default, ease, duration: () =&gt; beatMs(2) {'}'})</code>. Controls are detected automatically.
        </div>
      </div>
      {draftControls.length > 0 && (
        <div>
          <div className="me-pane-section-title">Detected Controls</div>
          <div className="me-controls-grid">
            {draftControls.map((ctrl) => (
              <div key={ctrl.cc} className="me-form-row me-control-edit-row">
                <span className="me-ctrl-cc">{ctrl.cc.toUpperCase()}</span>
                <input
                  className="me-input"
                  value={ctrl.label}
                  onChange={(e) => updateDraftControl(ctrl.cc, 'label', e.target.value)}
                  aria-label={`${ctrl.cc} label`}
                />
                <input
                  className="me-input me-input-unit"
                  value={ctrl.unit}
                  onChange={(e) => updateDraftControl(ctrl.cc, 'unit', e.target.value)}
                  placeholder="unit"
                  aria-label={`${ctrl.cc} unit`}
                />
                <span className="me-ctrl-range">{ctrl.min} → {ctrl.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );



  return (
    <div className="master-effects-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="master-effects-dialog" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="master-effects-header">
          <div className="me-title-group">
            <span className="me-title-icon">🪄</span>
            <h2 className="me-title">Master Effects &amp; MIDI Binds</h2>
            <span className="me-target-badge">Target Output: {targetBuffer}</span>
          </div>
          <button className="me-close-btn" onClick={onClose} title="Close (Esc)">&times;</button>
        </div>

        {/* Body Split */}
        <div className="master-effects-body">
          {/* Preset Cards List */}
          <div className="me-presets-pane">
            {MASTER_EFFECTS.map((effect) => {
              const isSelected = effect.id === selectedEffectId;
              const isActive = effect.id === activeEffectId;

              return (
                <div
                  key={effect.id}
                  className={`me-preset-card ${isSelected ? 'selected' : ''} ${isActive ? 'active-on-stage' : ''}`}
                  onClick={() => { if (!draft) setSelectedEffectId(effect.id); }}
                >
                  <div className="me-card-header">
                    <div className="me-card-name-group">
                      <span className="me-card-icon">{effect.icon}</span>
                      <span className="me-card-name">{effect.name}</span>
                    </div>
                    <div className="me-card-header-right">
                      {isActive ? (
                        <span className="me-active-badge">ACTIVE</span>
                      ) : (
                        <span className="me-card-tag">{effect.tag}</span>
                      )}
                      <button
                        className="me-card-edit-btn"
                        title="Edit effect"
                        id={`me-edit-${effect.id}`}
                        onClick={(e) => { e.stopPropagation(); startEdit(effect); }}
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                  <div className="me-card-desc">{effect.description}</div>
                  <div className="me-card-midi-pills">
                    {effect.controls.map((ctrl) => (
                      <span key={ctrl.cc} className="me-midi-pill">
                        {ctrl.cc.toUpperCase()}: {ctrl.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            <button className="me-add-effect-btn" id="me-add-effect" onClick={startNew} disabled={!!draft}>
              ＋ New Master Effect
            </button>
          </div>

          {/* Details & Inspector Deck */}
          {draft ? renderEditor() : selectedEffect && (
            <div className="me-inspector-pane">
              <div>
                <div className="me-pane-section-title">Injected Function Chain (before .{targetBuffer})</div>
                <div className="me-code-preview">{buildEffectChain(selectedEffect)}</div>
              </div>

              <div>
                <div className="me-pane-section-title">MIDI CC Live Modulators</div>
                <div className="me-controls-grid">
                  {selectedEffect.controls.map((ctrl) => {
                    const norm = sliderValues[ctrl.cc] !== undefined ? sliderValues[ctrl.cc] : 0.5;
                    const computedVal = (norm * (ctrl.max - ctrl.min) + ctrl.min).toFixed(2);
                    const statuses = typeof window !== 'undefined' && typeof window.midixStatus === 'function'
                      ? window.midixStatus(ctrl.cc)
                      : [];
                    const isWaitingPickup = statuses.length > 0 && statuses.some((s) => !s.pickedUp);

                    return (
                      <div key={ctrl.cc} className="me-control-row">
                        <div className="me-control-label-group">
                          <span>
                            <span className="me-ctrl-cc">{ctrl.cc.toUpperCase()}</span> &mdash; {ctrl.label}
                            {isWaitingPickup && (
                              <span className="me-pickup-badge" title="Waiting for MIDI pickup (knob must reach default value)">
                                pickup
                              </span>
                            )}
                          </span>
                          <span className="me-ctrl-val">
                            {computedVal} {ctrl.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          className="me-control-slider"
                          min="0"
                          max="1"
                          step="0.01"
                          value={norm}
                          onChange={(e) => handleSliderChange(ctrl.cc, parseFloat(e.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="master-effects-footer">
          {draft ? (
            <>
              <div>
                {draft.id && (
                  <button className="me-action-btn me-btn-bypass" onClick={handleDelete}>
                    🗑 Delete Effect
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="me-action-btn me-btn-cancel" onClick={() => setDraft(null)}>
                  Cancel
                </button>
                <button className="me-action-btn me-btn-apply" onClick={handleSaveDraft}>
                  Save Effect ⌘↵
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px' }}>
                {activeEffectId && (
                  <button className="me-action-btn me-btn-bypass" onClick={handleBypass} title="Remove master effect chain from code">
                    ✕ Remove Master Effects
                  </button>
                )}
                <button className="me-action-btn me-btn-cancel" onClick={handleReset} title="Restore built-in presets">
                  Reset Defaults
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="me-action-btn me-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button className="me-action-btn me-btn-apply" onClick={handleApply}>
                  Apply Effect to Code ↵
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
