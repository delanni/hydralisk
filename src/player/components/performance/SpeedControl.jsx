import React from 'react';
import { useStore } from '../../store/useStore.js';
import { MIN_SPEED, MAX_SPEED } from '../../store/playerStore.js';
import { setSpeed } from '../../actions/index.js';
import { formatSpeed } from '../../utils/math.js';

export function SpeedControl() {
  const speed = useStore((s) => s.speed);
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span>Visual Speed Rate</span>
        <span id="speed-val">{formatSpeed(speed)}</span>
      </div>
      <input
        type="range"
        id="speed-slider"
        className="slider-input"
        min={MIN_SPEED}
        max={MAX_SPEED}
        step="0.1"
        value={speed}
        onChange={(e) => setSpeed(parseFloat(e.target.value))}
      />
    </div>
  );
}
