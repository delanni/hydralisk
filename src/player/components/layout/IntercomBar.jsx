import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { selectIsUIHidden } from '../../store/playerStore.js';
import { subscribe, takeNext } from '../../services/intercom.js';
import { cx } from '../../utils/cx.js';

const SCROLL_SPEED_PX_PER_SEC = 140;
const MIN_DURATION_SEC = 2.2;
const GAP_BETWEEN_MESSAGES_MS = 150;

/** Thin top ticker that scrolls queued intercom messages one at a time. */
export function IntercomBar() {
  const hidden = useStore(selectIsUIHidden);
  const [current, setCurrent] = useState(null);
  const busyRef = useRef(false);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const pump = useCallback(() => {
    if (busyRef.current) return;
    const next = takeNext();
    busyRef.current = Boolean(next);
    setCurrent(next);
  }, []);

  useEffect(() => {
    pump();
    return subscribe(pump);
  }, [pump]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return undefined;

    if (!current) {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      return undefined;
    }

    const viewportWidth = viewport.offsetWidth || window.innerWidth;
    const textWidth = track.offsetWidth || current.message.length * 8;
    const startX = viewportWidth;
    const endX = -textWidth - 20;
    const durationSec = Math.max(MIN_DURATION_SEC, (startX - endX) / SCROLL_SPEED_PX_PER_SEC);

    track.style.transition = 'none';
    track.style.transform = `translateX(${startX}px)`;
    void track.offsetWidth; // force reflow before starting the transition
    track.style.transition = `transform ${durationSec}s linear`;
    track.style.transform = `translateX(${endX}px)`;

    let ended = false;
    let gapTimer = null;
    const onEnd = () => {
      if (ended) return;
      ended = true;
      clearTimeout(fallbackTimer);
      track.removeEventListener('transitionend', onEnd);
      gapTimer = setTimeout(() => {
        busyRef.current = false;
        pump();
      }, GAP_BETWEEN_MESSAGES_MS);
    };
    track.addEventListener('transitionend', onEnd);
    const fallbackTimer = setTimeout(onEnd, durationSec * 1000 + 200);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(gapTimer);
      track.removeEventListener('transitionend', onEnd);
    };
  }, [current, pump]);

  const isError = Boolean(current?.isError);

  return (
    <div id="intercom-bar" className={cx('intercom-bar', hidden && 'hidden')}>
      <div id="intercom-badge" className={cx('intercom-badge', isError && 'error')}>
        {isError ? 'HYDRA // ERR' : 'HYDRA // SYS'}
      </div>
      <div id="intercom-viewport" className="intercom-viewport" ref={viewportRef}>
        <div id="intercom-track" className={cx('intercom-track', isError && 'error')} ref={trackRef}>
          {current ? current.message : ''}
        </div>
      </div>
    </div>
  );
}
