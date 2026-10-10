/**
 * Hydralisk Player Intercom Notification System
 * Single-pass marquee ticker queue system for live performance feedback.
 */

export const intercomQueue = [];
export let isIntercomBusy = false;
export let intercomActiveTimeout = null;

/**
 * Dispatch a message to the Intercom Marquee Queue System
 * @param {string} message 
 * @param {boolean} isError 
 */
export function showToast(message, isError = false) {
  intercomNotify(message, isError);
}

export function intercomNotify(message, isError = false) {
  if (!message) return;
  intercomQueue.push({ message: String(message), isError: Boolean(isError) });
  if (!isIntercomBusy) {
    processIntercomQueue();
  }
}

export function processIntercomQueue() {
  if (intercomQueue.length === 0) {
    isIntercomBusy = false;
    const badge = document.getElementById('intercom-badge');
    const track = document.getElementById('intercom-track');
    if (badge) {
      badge.classList.remove('error');
      badge.textContent = "HYDRA // SYS";
    }
    if (track) {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      track.textContent = '';
    }
    return;
  }

  isIntercomBusy = true;
  const current = intercomQueue.shift();

  const badge = document.getElementById('intercom-badge');
  const viewport = document.getElementById('intercom-viewport');
  const track = document.getElementById('intercom-track');

  if (!viewport || !track) {
    isIntercomBusy = false;
    return;
  }

  if (badge) {
    badge.textContent = current.isError ? "HYDRA // ERR" : "HYDRA // SYS";
    if (current.isError) {
      badge.classList.add('error');
    } else {
      badge.classList.remove('error');
    }
  }

  if (current.isError) {
    track.classList.add('error');
  } else {
    track.classList.remove('error');
  }

  track.textContent = current.message;

  // Calculate scroll distance and timing for single-pass left marquee scroll
  const viewportWidth = viewport.offsetWidth || window.innerWidth;
  const textWidth = track.offsetWidth || (current.message.length * 8);

  const startX = viewportWidth;
  const endX = -textWidth - 20;
  const totalDistance = startX - endX;

  // 140px per second speed ensures smooth, crisp readability across all screen sizes
  const speedPxPerSec = 140;
  const durationSec = Math.max(2.2, totalDistance / speedPxPerSec);

  // Position track at right boundary
  track.style.transition = 'none';
  track.style.transform = `translateX(${startX}px)`;

  // Force layout reflow
  void track.offsetWidth;

  // Start smooth left marquee scroll
  track.style.transition = `transform ${durationSec}s linear`;
  track.style.transform = `translateX(${endX}px)`;

  let hasEnded = false;
  const onEnd = () => {
    if (hasEnded) return;
    hasEnded = true;
    if (intercomActiveTimeout) clearTimeout(intercomActiveTimeout);
    track.removeEventListener('transitionend', onEnd);
    setTimeout(() => {
      processIntercomQueue();
    }, 150);
  };

  track.addEventListener('transitionend', onEnd);
  intercomActiveTimeout = setTimeout(onEnd, (durationSec * 1000) + 200);
}

/**
 * Log error to intercom system
 * @param {Error|string} error 
 */
export function showError(error) {
  showToast((error && error.message) || error, true);
}
