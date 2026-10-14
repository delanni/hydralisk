import React from 'react';
import { useStore } from '../../store/useStore.js';
import { selectTouchOverlayVisible } from '../../store/playerStore.js';
import {
  nudgeSpeed, resetSpeed, playPrevSketch, playRandomSketch, playNextSketch, setAutomutateMode,
  toggleMobileAutomutate, nudgeTempo, togglePlayPause, toggleTouchActions
} from '../../actions/index.js';
import { cx } from '../../utils/cx.js';

const TEMPO_STEP = 2;
const SPEED_STEP = 0.1;

function TouchButton({ label, onClick, children, id, active }) {
  return (
    <button id={id} className={cx('touch-action-btn', active && 'active')} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

function MobileAutomutateToggle() {
  const selectedMode = useStore((s) => s.selectedAutomutateMode);
  const active = useStore((s) => s.automutateMode !== 'off');
  return (
    <TouchButton
      id="mobile-mutate-toggle"
      label="Toggle current automutate setting"
      active={active}
      onClick={toggleMobileAutomutate}
    >
      ~{selectedMode}b
    </TouchButton>
  );
}

/** Mobile / hidden-HUD bottom sheet with large performance buttons. */
export function TouchActionsOverlay() {
  const visible = useStore(selectTouchOverlayVisible);

  return (
    <div
      id="touch-actions-overlay"
      className={cx('touch-actions-overlay', visible && 'visible')}
      role="toolbar"
      aria-label="Playability controls"
    >
      <div className="touch-actions-card">
        <div className="touch-actions-header">
          <div className="touch-actions-title">PLAYABILITY</div>
          <button className="touch-close-btn" onClick={toggleTouchActions} aria-label="Hide playability overlay">×</button>
        </div>
        <div className="touch-actions-grid">
          <TouchButton label="Decrease speed" onClick={() => nudgeSpeed(-SPEED_STEP)}>−</TouchButton>
          <TouchButton label="Reset speed" onClick={() => resetSpeed()}>0</TouchButton>
          <TouchButton label="Increase speed" onClick={() => nudgeSpeed(SPEED_STEP)}>+</TouchButton>

          <TouchButton label="Previous sketch" onClick={playPrevSketch}>‹</TouchButton>
          <TouchButton label="Random sketch" onClick={playRandomSketch}>[~]</TouchButton>
          <TouchButton label="Next sketch" onClick={playNextSketch}>›</TouchButton>

          <TouchButton label="Automutate every beat" onClick={() => setAutomutateMode('1')}>≈</TouchButton>
          <MobileAutomutateToggle />
          <TouchButton label="Disable automutate" onClick={() => setAutomutateMode('off')}>≈</TouchButton>

          <TouchButton label="Decrease tempo" onClick={() => nudgeTempo(-TEMPO_STEP)}>BPM−</TouchButton>
          <TouchButton label="Play or pause" onClick={togglePlayPause}>Ⅱ/▶</TouchButton>
          <TouchButton label="Increase tempo" onClick={() => nudgeTempo(TEMPO_STEP)}>BPM+</TouchButton>
        </div>
      </div>
    </div>
  );
}
