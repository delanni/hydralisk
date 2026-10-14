import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { MIN_BPM, MAX_BPM } from '../../store/playerStore.js';
import { setBpmFromInput, tapTempo, bendTempo, releaseTempoBend } from '../../actions/index.js';
import { usePulse } from '../../hooks/usePulse.js';
import { cx } from '../../utils/cx.js';

const BEND_RANGE_PERCENT = 15;

/**
 * BPM number input. Commits on the native `change` event (blur, Enter, spinner)
 * rather than on every keystroke, and mirrors external tempo changes.
 */
function BpmInput() {
  const bpm = useStore((s) => s.bpm);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.value = bpm;
  }, [bpm]);

  useEffect(() => {
    const input = ref.current;
    const onChange = (e) => setBpmFromInput(e.target.value);
    input.addEventListener('change', onChange);
    return () => input.removeEventListener('change', onChange);
  }, []);

  return (
    <input
      ref={ref}
      type="number"
      id="bpm-number-input"
      className="search-input bpm-input"
      min={MIN_BPM}
      max={MAX_BPM}
      defaultValue={bpm}
    />
  );
}

function TapButton() {
  const tapPulse = useStore((s) => s.tapPulse);
  const flashing = usePulse(tapPulse, 100);
  return (
    <button id="tap-tempo-btn" className={cx('filter-tag', 'tap-btn', flashing && 'flash')} onClick={() => tapTempo()}>
      TAP
    </button>
  );
}

/** Spring-loaded pitch fader: bends tempo while held, snaps back to center on release. */
function PitchBendFader() {
  const [offset, setOffset] = useState(0);

  const onChange = (e) => {
    const value = parseFloat(e.target.value);
    setOffset(value);
    bendTempo(value);
  };

  const onRelease = () => {
    releaseTempoBend();
    setOffset(0);
  };

  return (
    <div className="pitch-bend">
      <div className="pitch-bend-labels">
        <span>{`-${BEND_RANGE_PERCENT}%`}</span>
        <span>PITCH CORRECTION (FADER)</span>
        <span>{`+${BEND_RANGE_PERCENT}%`}</span>
      </div>
      <input
        type="range"
        id="bpm-bend-slider"
        className="slider-input bend-slider"
        min={-BEND_RANGE_PERCENT}
        max={BEND_RANGE_PERCENT}
        step="0.1"
        value={offset}
        onChange={onChange}
        onMouseUp={onRelease}
        onTouchEnd={onRelease}
      />
    </div>
  );
}

export function TempoControl() {
  return (
    <div className="slider-group">
      <div className="slider-header centered">
        <span>Tempo (BPM)</span>
        <div className="bpm-controls">
          <BpmInput />
          <TapButton />
        </div>
      </div>
      <PitchBendFader />
    </div>
  );
}
