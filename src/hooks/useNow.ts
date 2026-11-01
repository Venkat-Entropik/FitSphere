import { useEffect, useState } from 'react';

/** Current epoch ms, refreshed every `intervalMs` while `enabled`. Timers are cleared on unmount. */
export function useNow(enabled = true, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    // Refresh right away (in a callback, not the effect body) so a late-enabled clock isn't stale.
    const immediate = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(immediate);
      clearInterval(id);
    };
  }, [enabled, intervalMs]);
  return now;
}
