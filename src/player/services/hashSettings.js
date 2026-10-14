/**
 * URL hash performance settings (protocol: #b120|h1|m4|s10).
 * Thin wrapper around the shared PlayerSettings codec from modules/settings.js.
 */
import { playerSettings } from '../../../modules/settings.js';

export { playerSettings };

export function readHashSettings() {
  return playerSettings.decode(window.location.hash);
}

export function writeHashSettings({ bpm, hud, automutate, speed }) {
  playerSettings.syncToHash({ bpm, hud, automutate, speed });
}
