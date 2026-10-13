/**
 * Cloud (Amakit) authentication service.
 */
import { remove, PREF_KEYS } from './preferences.js';

export function isCloudAvailable() {
  return Boolean(window.amakit);
}

/** Resolve to true if stored credentials can log in silently. */
export async function restoreSession() {
  const amakit = window.amakit;
  if (!amakit || !amakit.getCredentials()) return false;
  try {
    await amakit.login(false);
    return true;
  } catch (e) {
    return false;
  }
}

/** Interactive login; rejects on failure. */
export function login() {
  return window.amakit.login(true);
}

export function logout() {
  remove(PREF_KEYS.awsCredentials);
  if (window.amakit) window.amakit.isAuthenticated = false;
}
