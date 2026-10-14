import React, { useCallback } from 'react';
import { registerCanvas } from '../../services/hydraEngine.js';

/** Fullscreen background canvas Hydra renders into. */
export function HydraCanvas() {
  const ref = useCallback((el) => {
    if (el) registerCanvas(el);
  }, []);
  return <canvas id="hydra-canvas" ref={ref} />;
}
