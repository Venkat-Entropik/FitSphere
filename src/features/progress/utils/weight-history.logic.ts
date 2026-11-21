import type { WeightEntry } from '@/features/profile/types/profile.types';
import { addDays, dateKey } from '@/utils/date';

export const WEIGHT_RANGES = ['30D', '90D', 'All'] as const;
export type WeightRange = (typeof WEIGHT_RANGES)[number];

const RANGE_DAYS: Record<WeightRange, number | null> = { '30D': 30, '90D': 90, All: null };
const FREQUENCY_WINDOW = 30;

const round1 = (n: number) => Math.round(n * 10) / 10;
const dayIndex = (key: string) => {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

export interface WeightPoint {
  dateKey: string;
  kg: number;
  /** Days since the first point shown, for spacing the chart by real time. */
  day: number;
}

export interface WeightRow {
  dateKey: string;
  kg: number;
  /** Change from the previous entry; null for the first one ever logged. */
  deltaKg: number | null;
}

export interface WeightHistory {
  points: WeightPoint[];
  min: number | null;
  max: number | null;
  average: number | null;
  /** Latest minus first shown; null with fewer than two points. */
  changeKg: number | null;
  /** Days with a weigh-in out of the last 30, and as a percentage. */
  loggedDays: number;
  frequencyPercent: number;
  streak: number;
  /** One flag per day for the last 30 days, oldest first. */
  last30: boolean[];
  recent: WeightRow[];
  total: number;
}

export function buildWeightHistory(
  weights: readonly WeightEntry[],
  now: number,
  range: WeightRange,
): WeightHistory {
  const sorted = [...weights].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const today = dateKey(now);
  const days = RANGE_DAYS[range];
  const from = days === null ? '' : dateKey(addDays(now, -(days - 1)));
  const shown = sorted.filter((w) => w.dateKey >= from && w.dateKey <= today);

  const firstDay = shown.length ? dayIndex(shown[0]!.dateKey) : 0;
  const points = shown.map((w) => ({
    dateKey: w.dateKey,
    kg: w.kg,
    day: dayIndex(w.dateKey) - firstDay,
  }));
  const kgs = shown.map((w) => w.kg);

  const logged = new Set(sorted.map((w) => w.dateKey));
  const last30 = Array.from({ length: FREQUENCY_WINDOW }, (_, i) =>
    logged.has(dateKey(addDays(now, -(FREQUENCY_WINDOW - 1 - i)))),
  );
  const loggedDays = last30.filter(Boolean).length;

  // Consecutive logged days ending today, or yesterday if today has not been logged yet.
  let streak = 0;
  let cursor = logged.has(today) ? now : addDays(now, -1).getTime();
  while (logged.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1).getTime();
  }

  const newestFirst = [...sorted].reverse();
  const recent = newestFirst.slice(0, 7).map((w, i) => {
    const previous = newestFirst[i + 1];
    return {
      dateKey: w.dateKey,
      kg: w.kg,
      deltaKg: previous ? round1(w.kg - previous.kg) : null,
    };
  });

  return {
    points,
    min: kgs.length ? Math.min(...kgs) : null,
    max: kgs.length ? Math.max(...kgs) : null,
    average: kgs.length ? round1(kgs.reduce((a, b) => a + b, 0) / kgs.length) : null,
    changeKg: kgs.length >= 2 ? round1(kgs.at(-1)! - kgs[0]!) : null,
    loggedDays,
    frequencyPercent: Math.round((loggedDays / FREQUENCY_WINDOW) * 100),
    streak,
    last30,
    recent,
    total: sorted.length,
  };
}

/** "Mon 3 Nov" for lists, "3 Nov" for chart axes. */
export function shortDate(key: string, withWeekday = false): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    ...(withWeekday && { weekday: 'short' }),
    day: 'numeric',
    month: 'short',
  });
}
