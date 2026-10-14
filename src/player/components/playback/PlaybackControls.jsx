import React from 'react';
import { useStore } from '../../store/useStore.js';
import {
  playPrevSketch, playNextSketch, playRandomSketch, togglePlayPause, toggleTouchActions
} from '../../actions/index.js';
import { PrevIcon, NextIcon, PlayIcon, PauseIcon, ShuffleIcon } from '../common/Icons.jsx';
import { cx } from '../../utils/cx.js';

function PlayPauseButton() {
  const isPlaying = useStore((s) => s.isPlaying);
  return (
    <button
      id="play-pause-btn"
      className="control-icon-btn play-pause"
      onClick={togglePlayPause}
      title={isPlaying ? 'Pause Loop (Space)' : 'Resume Loop (Space)'}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

/** Sidebar footer: transport controls and touch overlay toggle. */
export function PlaybackControls() {
  const touchActionsEnabled = useStore((s) => s.touchActionsEnabled);
  return (
    <div className="playback-controls">
      <div className="controls-row">
        <button className="control-icon-btn" onClick={playPrevSketch} title="Previous Sketch (Left Arrow)">
          <PrevIcon />
        </button>
        <PlayPauseButton />
        <button className="control-icon-btn" onClick={playNextSketch} title="Next Sketch (Right Arrow)">
          <NextIcon />
        </button>
        <button className="control-icon-btn" onClick={playRandomSketch} title="Shuffle/Random Sketch (R)">
          <ShuffleIcon />
        </button>
      </div>
      <div className="touch-toggle-row">
        <button
          id="touch-actions-hud-btn"
          className={cx('action-btn', 'touch-actions-hud-btn', touchActionsEnabled && 'active')}
          onClick={toggleTouchActions}
        >
          Touch Actions Overlay
        </button>
      </div>
    </div>
  );
}
