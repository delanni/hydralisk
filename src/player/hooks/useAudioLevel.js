import { useEffect } from 'react';

/**
 * Drives an element's scale from Hydra's audio volume (`window.a.vol`).
 * Updates the DOM directly from requestAnimationFrame to avoid per-frame re-renders.
 */
export function useAudioLevel(ref) {
  useEffect(() => {
    let frameId;
    const update = () => {
      const el = ref.current;
      if (el) {
        if (window.a && typeof window.a.vol !== 'undefined') {
          const vol = window.a.vol;
          el.classList.add('active');
          if (vol > 0.01) {
            el.style.transform = `scale(${1 + vol * 0.15})`;
            el.title = `Audio reactive active (Vol: ${vol.toFixed(2)})`;
          } else {
            el.style.transform = 'scale(1)';
          }
        } else {
          el.classList.remove('active');
        }
      }
      frameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frameId);
  }, [ref]);
}
