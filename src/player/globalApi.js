/**
 * Legacy global API.
 * Keeps the `window.*` functions the vanilla player exposed so that plugins,
 * MIDI mappings and console users keep working.
 */
import * as actions from './actions/index.js';
import { notify, notifyError } from './services/intercom.js';
import { playerSettings } from './services/hashSettings.js';

export function exposeGlobalApi() {
  Object.assign(window, {
    playerSettings,

    startExperience: actions.startExperience,
    showToast: notify,
    intercomNotify: notify,
    showError: notifyError,

    playSketch: actions.playSketch,
    playPrevSketch: actions.playPrevSketch,
    playNextSketch: actions.playNextSketch,
    playRandomSketch: actions.playRandomSketch,
    togglePlayPause: actions.togglePlayPause,
    runCustomCode: actions.runCustomCode,
    resetCustomCode: actions.resetCustomCode,

    updateBPM: actions.setBpm,
    handleTapTempo: actions.tapTempo,
    nudgeTempo: actions.nudgeTempo,
    nudgeSpeed: actions.nudgeSpeed,
    resetSpeed: actions.resetSpeed,

    setAutomutateMode: actions.setAutomutateMode,
    triggerMutation: actions.triggerMutation,
    undoMutation: actions.undoMutation,
    redoMutation: actions.redoMutation,
    toggleMobileAutomutate: actions.toggleMobileAutomutate,

    switchTab: actions.switchTab,
    toggleCollapse: actions.toggleCollapse,
    toggleUI: actions.toggleUI,
    toggleTouchActions: actions.toggleTouchActions,
    toggleFullscreen: actions.toggleFullscreen,
    openEditorWithCurrentSketch: actions.openEditorWithCurrentSketch,
    handleCloudLogin: actions.loginToCloud
  });
}
