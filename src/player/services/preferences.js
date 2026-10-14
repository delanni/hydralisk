/**
 * Safe localStorage helpers (storage may be unavailable, e.g. private mode).
 */

export function readString(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (e) {
    return fallback;
  }
}

export function writeString(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (e) {}
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

export function readJSON(key, fallback) {
  const raw = readString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Could not parse ${key} from localStorage`, e);
    return fallback;
  }
}

export const PREF_KEYS = {
  lastSketch: 'lastSelectedSketchName',
  welcomeClosed: 'welcomeScreenClosed',
  touchActions: 'touchActionsEnabled',
  awsCredentials: 'awsCredentials'
};
