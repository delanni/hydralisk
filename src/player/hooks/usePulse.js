import { useEffect, useState } from 'react';

/**
 * Returns true for `durationMs` every time `trigger` changes (ignoring the initial value).
 * Used for short visual flashes (tap tempo button, mutation highlight).
 */
export function usePulse(trigger, durationMs) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return undefined;
    setActive(true);
    const id = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(id);
  }, [trigger, durationMs]);

  return active;
}
