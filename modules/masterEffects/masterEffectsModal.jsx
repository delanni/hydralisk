import React, { useState, useEffect } from 'react';
import './masterEffects.css';
import { masterEffectsService, MASTER_EFFECTS } from './masterEffectsService.js';

export default function MasterEffectsModal({ isOpen, onClose }) {
  const [selectedEffectId, setSelectedEffectId] = useState('hsl_plus');
  const [activeEffectId, setActiveEffectId] = useState(null);
  const [targetBuffer, setTargetBuffer] = useState('o0');
  const [sliderValues, setSliderValues] = useState({});

  useEffect(() => {
    if (isOpen) {
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
          const cur = (window.virtualCC && window.virtualCC[c.cc] !== undefined)
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
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedEffectId]);

  if (!isOpen) return null;

  const selectedEffect = MASTER_EFFECTS.find((e) => e.id === selectedEffectId) || MASTER_EFFECTS[0];

  const handleApply = () => {
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
    // Update live virtual MIDI CC so live sketch modulates immediately
    if (window.hydraliskMidiBridge && typeof window.hydraliskMidiBridge.setVirtualCC === 'function') {
      window.hydraliskMidiBridge.setVirtualCC(cc, normVal);
    } else if (typeof window.setVirtualCC === 'function') {
      window.setVirtualCC(cc, normVal);
    }
  };

  return (
    <div className="master-effects-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="master-effects-dialog" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="master-effects-header">
          <div className="me-title-group">
            <span className="me-title-icon">🪄</span>
            <h2 className="me-title">Master Effects & MIDI Binds</h2>
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
                  onClick={() => setSelectedEffectId(effect.id)}
                >
                  <div className="me-card-header">
                    <div className="me-card-name-group">
                      <span className="me-card-icon">{effect.icon}</span>
                      <span className="me-card-name">{effect.name}</span>
                    </div>
                    {isActive ? (
                      <span className="me-active-badge">ACTIVE</span>
                    ) : (
                      <span className="me-card-tag">{effect.tag}</span>
                    )}
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
          </div>

          {/* Details & Inspector Deck */}
          <div className="me-inspector-pane">
            <div>
              <div className="me-pane-section-title">Injected Function Chain (before .{targetBuffer})</div>
              <div className="me-code-preview">{selectedEffect.chain}</div>
            </div>

            <div>
              <div className="me-pane-section-title">MIDI CC Live Modulators</div>
              <div className="me-controls-grid">
                {selectedEffect.controls.map((ctrl) => {
                  const norm = sliderValues[ctrl.cc] !== undefined ? sliderValues[ctrl.cc] : 0.5;
                  const computedVal = (norm * (ctrl.max - ctrl.min) + ctrl.min).toFixed(2);

                  return (
                    <div key={ctrl.cc} className="me-control-row">
                      <div className="me-control-label-group">
                        <span>
                          <span className="me-ctrl-cc">{ctrl.cc.toUpperCase()}</span> &mdash; {ctrl.label}
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
        </div>

        {/* Footer */}
        <div className="master-effects-footer">
          <div>
            {activeEffectId && (
              <button className="me-action-btn me-btn-bypass" onClick={handleBypass} title="Remove master effect chain from code">
                ✕ Remove Master Effects
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="me-action-btn me-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="me-action-btn me-btn-apply" onClick={handleApply}>
              Apply Effect to Code ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
