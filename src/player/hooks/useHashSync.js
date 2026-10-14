import { useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { selectIsUIHidden } from '../store/playerStore.js';
import { writeHashSettings } from '../services/hashSettings.js';

/**
 * Mirrors live performance settings into the URL hash (#b120|h1|m4|s10).
 * Starts only after the incoming hash has been applied, so it is never overwritten.
 */
export function useHashSync() {
  const ready = useStore((s) => s.hashSettingsApplied);
  const bpm = useStore((s) => s.bpm);
  const hidden = useStore(selectIsUIHidden);
  const automutate = useStore((s) => s.automutateMode);
  const speed = useStore((s) => s.speed);

  useEffect(() => {
    if (!ready) return;
    writeHashSettings({ bpm, hud: hidden ? 0 : 1, automutate, speed: speed || 1.0 });
  }, [ready, bpm, hidden, automutate, speed]);
}
