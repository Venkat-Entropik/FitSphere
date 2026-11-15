import { useEffect, useState } from 'react';

import { useMotionEnabled } from './useReducedMotion';

/** Counts a whole number up to `target` with an ease-out curve. Shows the target at once with reduced motion. */
export function useCountUp(target: number, durationMs = 1000, delayMs = 200): number {
  const enabled = useMotionEnabled();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let startedAt = 0;
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        startedAt ||= now;
        const t = Math.min(1, (now - startedAt) / durationMs);
        setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, enabled, durationMs, delayMs]);

  return enabled ? value : target;
}
