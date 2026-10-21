import React, { useState, useEffect, useRef, useMemo } from 'react';
import { midiMappingService } from './midiMappingService.js';

export default function MidiMappingModal({ isOpen, onClose }) {
  const [serviceState, setServiceState] = useState(() => midiMappingService.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = midiMappingService.subscribe((nextState) => {
      setServiceState(nextState);
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const { mapping, waitingForAction, deviceCount, actions } = serviceState;

  // Filter actions by search query
  const filteredActions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const entries = Object.entries(actions);
    if (!query) return entries;

    return entries.filter(([actionId, config]) => {
      const label = config.label || actionId;
      return (
        label.toLowerCase().includes(query) ||
        actionId.toLowerCase().includes(query)
      );
    });
  }, [actions, searchQuery]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAssignClick = (e, actionId) => {
    e.preventDefault();
    e.stopPropagation();
    midiMappingService.startAssign(actionId);
  };

  const handleClearClick = (e, actionId) => {
    e.preventDefault();
    e.stopPropagation();
    midiMappingService.clearMapping(actionId);
  };

  return (
    <div className="midi-mapping-overlay" onClick={handleOverlayClick}>
      <div className="midi-mapping-modal" role="dialog" aria-modal="true" aria-label="MIDI Mapping">
        {/* 1. Header */}
        <div className="midi-mapping-header">
          <div className="midi-mapping-title-group">
            <div className="midi-mapping-icon-badge">
              <i className="fa fa-sliders-h" />
            </div>
            <div className="midi-mapping-title-text">
              <h5>MIDI Mapping</h5>
              <span className="midi-mapping-subtitle">Assign hardware CC knobs & pads to actions</span>
            </div>
          </div>
          <button
            type="button"
            className="midi-mapping-close"
            onClick={onClose}
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        {/* 2. Search Bar */}
        <div className="midi-mapping-search-wrap">
          <i className="fa fa-search" />
          <input
            ref={searchInputRef}
            type="text"
            className="midi-mapping-search"
            placeholder="Search actions (e.g. mutate, speed, sketch, CC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 3. Action List (Scroll container preserves position on React reconciliations) */}
        <div className="midi-mapping-body">
          <ul className="midi-mapping-list">
            {filteredActions.map(([actionId, config]) => {
              const actionLabel = config.label || actionId;
              const isBind = typeof config.callback === 'function';
              const isWaiting = waitingForAction === actionId;
              const current = mapping[actionId];

              return (
                <li
                  key={actionId}
                  className={`midi-mapping-row ${isWaiting ? 'listening' : ''}`}
                >
                  {/* Action Title & Category Tag */}
                  <div className="midi-mapping-action-group">
                    <span className="midi-mapping-action">{actionLabel}</span>
                    <span className="midi-mapping-type-tag">
                      {isBind ? 'Continuous CC Bind' : 'Trigger Action'}
                    </span>
                  </div>

                  {/* Controls Group */}
                  <div className="midi-mapping-controls-group">
                    {/* Value Badge */}
                    {isWaiting ? (
                      <span className="midi-mapping-value waiting">
                        <span className="midi-pulse-dot" /> Waiting for MIDI...
                      </span>
                    ) : current ? (
                      <span className="midi-mapping-value assigned">
                        <i className="fa fa-plug" /> {midiMappingService.formatMappingDesc(current)}
                      </span>
                    ) : (
                      <span className="midi-mapping-value unassigned">—</span>
                    )}

                    {/* Assign / Cancel Button */}
                    <button
                      type="button"
                      className={`midi-mapping-btn ${isWaiting ? 'midi-mapping-btn-cancel' : 'midi-mapping-btn-assign'}`}
                      onClick={(e) => handleAssignClick(e, actionId)}
                    >
                      {isWaiting ? 'Cancel' : 'Assign'}
                    </button>

                    {/* Clear Button (only shown if assigned) */}
                    {current && !isWaiting && (
                      <button
                        type="button"
                        className="midi-mapping-btn midi-mapping-clear"
                        title="Clear assignment"
                        onClick={(e) => handleClearClick(e, actionId)}
                      >
                        <i className="fa fa-times" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}

            {filteredActions.length === 0 && (
              <div className="midi-mapping-empty">
                <i
                  className="fa fa-search"
                  style={{ fontSize: '22px', marginBottom: '8px', display: 'block', opacity: 0.4 }}
                />
                No actions found matching "{searchQuery}"
              </div>
            )}
          </ul>
        </div>

        {/* 4. Footer */}
        <div className="midi-mapping-footer">
          <div className="midi-mapping-device-status">
            <span className={`midi-status-indicator ${deviceCount > 0 ? '' : 'offline'}`} />
            <span>
              {deviceCount > 0
                ? `${deviceCount} MIDI Device${deviceCount > 1 ? 's' : ''} Connected`
                : 'No MIDI inputs detected'}
            </span>
          </div>
          <div className="midi-mapping-shortcut-hint">
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
