import React, { useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { openEditorWithCurrentSketch, toggleFeedback, toggleCollapse } from '../../actions/index.js';
import { useAudioLevel } from '../../hooks/useAudioLevel.js';
import { StatusDot } from '../common/StatusDot.jsx';
import { ChevronLeftIcon } from '../common/Icons.jsx';

function AudioIndicator() {
  const ref = useRef(null);
  useAudioLevel(ref);
  return <StatusDot ref={ref} id="audio-indicator-dot" title="Audio Reactive Ready" />;
}

export function PanelHeader() {
  const midiAvailable = useStore((s) => s.midiAvailable);

  return (
    <div className="panel-header">
      <h2 className="panel-title">HYDRALISK</h2>
      <div className="header-status">
        <button id="nav-editor-btn" className="nav-editor-btn" onClick={openEditorWithCurrentSketch} title="Open Full Editor">
          Editor ↗
        </button>
        <AudioIndicator />
        <StatusDot id="midi-indicator-dot" active={midiAvailable} title="MIDI Access Active" />
        <button
          className="collapse-btn feedback-toggle"
          onClick={toggleFeedback}
          title="Report Bug / Send Feedback (Cmd+Shift+F)"
        >
          💬
        </button>
        <button
          className="collapse-btn remote-qr-toggle"
          onClick={() => window.hydraliskRemote && window.hydraliskRemote.toggleQR()}
          title="Phone Remote Pairing (Ctrl+Shift+R)"
          style={{ fontSize: '13px' }}
        >
          📱
        </button>
        <button className="collapse-btn" onClick={toggleCollapse} title="Hide Sidebar">
          <ChevronLeftIcon />
        </button>
      </div>
    </div>
  );
}
