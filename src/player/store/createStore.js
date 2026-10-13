/**
 * Minimal observable store.
 * Holds an immutable state snapshot and notifies subscribers on every change.
 * Designed to plug straight into React's `useSyncExternalStore`.
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  const getState = () => state;

  const setState = (partial) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    if (!patch) return;
    const next = { ...state, ...patch };
    const changed = Object.keys(patch).some((key) => !Object.is(state[key], next[key]));
    if (!changed) return;
    state = next;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
