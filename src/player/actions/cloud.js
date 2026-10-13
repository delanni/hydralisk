/**
 * Cloud synchronisation actions.
 */
import { setState } from '../store/playerStore.js';
import { notify, notifyError } from '../services/intercom.js';
import * as cloud from '../services/cloud.js';
import { reloadSketches } from './library.js';

export async function restoreCloudSession() {
  if (!cloud.isCloudAvailable()) return;
  setState({ cloudAuthenticated: await cloud.restoreSession() });
}

export function loginToCloud() {
  if (!cloud.isCloudAvailable()) {
    notifyError('Amakit module not loaded');
    return;
  }
  cloud.login()
    .then(() => {
      notify('Successfully authenticated with Cloud!');
      setState({ cloudAuthenticated: true });
      reloadSketches();
    })
    .catch((err) => {
      notifyError(err || 'Login failed');
      setState({ cloudAuthenticated: false });
    });
}

export function logoutFromCloud() {
  cloud.logout();
  setState({ cloudAuthenticated: false });
  notify('Disconnected from Cloud');
  reloadSketches();
}
