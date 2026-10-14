import React from 'react';
import { useStore } from '../../store/useStore.js';
import { startExperience } from '../../actions/index.js';

/** Launch screen: the click gesture unlocks AudioContext & WebMIDI. */
export function SplashScreen() {
  const splash = useStore((s) => s.splash);
  if (splash === 'hidden') return null;

  return (
    <div id="splash-screen" className="splash-screen" style={splash === 'fading' ? { opacity: 0 } : undefined}>
      <div className="splash-card">
        <h1 className="splash-logo">HYDRALISK</h1>
        <p className="splash-description">
          A dedicated presentation player for live-coded Hydra visuals. Feed scripts directly to the canvas,
          map physical MIDI controls, and run audio-reactive synthesizers in fullscreen.
        </p>
        <button id="start-experience-btn" className="start-btn" onClick={startExperience}>
          Launch Player &amp; Engine
        </button>
        <div className="splash-footer">Requires microphone access for audio-reactive visuals.</div>
      </div>
    </div>
  );
}
