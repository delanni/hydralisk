import React, { useEffect } from 'react';
import { useHotkeys } from './hooks/useHotkeys.js';
import { useViewport } from './hooks/useViewport.js';
import { useAutomutateClock } from './hooks/useAutomutateClock.js';
import { useHashSync } from './hooks/useHashSync.js';
import { useMidiAccess } from './hooks/useMidiAccess.js';
import { restoreCloudSession, restoreTouchActionsPreference, shouldAutoLaunch, startExperience } from './actions/index.js';
import { SplashScreen } from './components/layout/SplashScreen.jsx';
import { HydraCanvas } from './components/layout/HydraCanvas.jsx';
import { IntercomBar } from './components/layout/IntercomBar.jsx';
import { ExpandTrigger } from './components/layout/ExpandTrigger.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { ShortcutsPanel } from './components/layout/ShortcutsPanel.jsx';
import { TouchActionsOverlay } from './components/playback/TouchActionsOverlay.jsx';

export function App() {
  useViewport();
  useHotkeys();
  useMidiAccess();
  useAutomutateClock();
  useHashSync();

  useEffect(() => {
    restoreCloudSession();
    restoreTouchActionsPreference();
    // Skip the splash if the user launched the player before.
    if (shouldAutoLaunch()) startExperience();
  }, []);

  return (
    <>
      <SplashScreen />
      <HydraCanvas />
      <IntercomBar />
      <ExpandTrigger />
      <Sidebar />
      <ShortcutsPanel />
      <TouchActionsOverlay />
    </>
  );
}
