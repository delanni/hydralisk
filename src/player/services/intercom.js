/**
 * Intercom notification service.
 * Queues ticker messages; the <IntercomBar> component drains the queue
 * and animates each message as a single-pass marquee.
 */

const queue = [];
const listeners = new Set();

export function notify(message, isError = false) {
  if (!message) return;
  queue.push({ message: String(message), isError: Boolean(isError) });
  listeners.forEach((listener) => listener());
}

export function notifyError(error) {
  notify((error && error.message) || error, true);
}

export function takeNext() {
  return queue.shift() || null;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
