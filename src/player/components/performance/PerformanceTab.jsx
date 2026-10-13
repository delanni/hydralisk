import React from 'react';
import { TempoControl } from './TempoControl.jsx';
import { SpeedControl } from './SpeedControl.jsx';
import { AutomutateCard } from './AutomutateCard.jsx';
import { NowPlayingCard } from './NowPlayingCard.jsx';
import { CloudSyncCard } from './CloudSyncCard.jsx';
import { MidiMappingCard } from './MidiMappingCard.jsx';

export function PerformanceTab() {
  return (
    <>
      <TempoControl />
      <SpeedControl />
      <AutomutateCard />
      <NowPlayingCard />
      <CloudSyncCard />
      <MidiMappingCard />
    </>
  );
}
