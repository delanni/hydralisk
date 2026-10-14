import { useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { DEFAULT_BPM } from '../store/playerStore.js';
import { beatsForMode, triggerMutation } from '../actions/index.js';

/** Runs `triggerMutation` on a beat-synced interval while automutate is on. */
export function useAutomutateClock() {
  const mode = useStore((s) => s.automutateMode);
  const bpm = useStore((s) => s.bpm);

  useEffect(() => {
    if (mode === 'off') return undefined;
    const msPerBeat = 60000 / (bpm || DEFAULT_BPM);
    const id = setInterval(triggerMutation, msPerBeat * beatsForMode(mode));
    return () => clearInterval(id);
  }, [mode, bpm]);
}
