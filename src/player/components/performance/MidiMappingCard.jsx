import React from 'react';
import { useStore } from '../../store/useStore.js';
import { openMidiMapping } from '../../actions/index.js';
import { InfoCard } from '../common/InfoCard.jsx';
import { StatusDot } from '../common/StatusDot.jsx';

export function MidiMappingCard() {
  const sketchUsesMidi = useStore((s) => Boolean(s.nowPlaying?.midi));
  return (
    <InfoCard
      spaced
      title="MIDI Mapping System"
      status={
        <StatusDot
          id="midi-status-dot"
          midiActive={sketchUsesMidi}
          title={sketchUsesMidi ? 'Uses MIDI input' : 'No MIDI required'}
        />
      }
      description="Map physical MIDI dials/keys directly to speed, sketches, or custom LFO parameters."
    >
      <button className="action-btn" onClick={openMidiMapping}>Configure MIDI Keys</button>
    </InfoCard>
  );
}
