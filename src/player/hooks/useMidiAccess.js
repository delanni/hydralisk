import { useEffect } from 'react';
import { setState } from '../store/playerStore.js';

/** Flags MIDI availability once the browser grants Web MIDI access. */
export function useMidiAccess() {
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess()
      .then(() => setState({ midiAvailable: true }))
      .catch(() => {});
  }, []);
}
