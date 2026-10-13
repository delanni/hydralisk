import { useEffect } from 'react';
import { updateViewport } from '../actions/index.js';

/**
 * Tracks mobile mode and exposes the visual viewport width as a CSS variable.
 * Mobile browsers can keep a wider layout viewport than the visible one, so the
 * touch sheet is sized from the visual viewport to avoid trailing off-screen.
 */
export function useViewport() {
  useEffect(() => {
    const update = () => {
      const width = window.visualViewport?.width || document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--player-viewport-width', `${width}px`);
      updateViewport();
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);
}
