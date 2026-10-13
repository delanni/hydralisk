import { useEffect } from 'react';
import {
  playPrevSketch, playNextSketch, playRandomSketch, toggleUI, toggleTouchActions, toggleFullscreen
} from '../actions/index.js';

const KEY_BINDINGS = {
  ArrowLeft: { action: playPrevSketch, preventDefault: true },
  ArrowRight: { action: playNextSketch, preventDefault: true },
  KeyR: { action: playRandomSketch },
  KeyH: { action: toggleUI },
  KeyT: { action: toggleTouchActions },
  KeyF: { action: toggleFullscreen }
};

/** Global single-key performance shortcuts (ignored while typing). */
export function useHotkeys() {
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (e.repeat) return;

      const binding = KEY_BINDINGS[e.code];
      if (!binding) return;
      if (binding.preventDefault) e.preventDefault();
      binding.action();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
