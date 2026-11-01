import { addDays, dateKey, daysBetween } from './date';

/**
 * Consecutive active days ending today. Today not being logged *yet* doesn't break a streak — it
 * only breaks once a whole day has been missed — so the count is anchored on yesterday in that case.
 */
export function currentStreak(
  activeDateKeys: Iterable<string>,
  now: number | Date = Date.now(),
): number {
  const active = new Set(activeDateKeys);
  let cursor = new Date(now);
  if (!active.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (active.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

const parseKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

/** Longest run of consecutive active days in the whole history. */
export function longestStreak(activeDateKeys: Iterable<string>): number {
  const days = [...new Set(activeDateKeys)].sort().map(parseKey);
  let best = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && daysBetween(days[i - 1]!, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}
