import { useSyncExternalStore } from 'react';
import { store } from './playerStore.js';

/**
 * Subscribe a component to a slice of the player store.
 * The selector must return a stable value (primitive or a reference held in state)
 * so React can skip re-renders when the slice is unchanged.
 */
export function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}
