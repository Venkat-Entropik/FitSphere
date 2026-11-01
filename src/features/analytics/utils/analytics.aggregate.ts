import { goalById } from '@/features/authentication/utils/onboarding.logic';
import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { UserProfile, WeightEntry } from '@/features/profile/types/profile.types';
import { nextPlan, volumeByMuscle } from '@/features/workouts/utils/workout-history.logic';
import type { WorkoutPlan, WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { addDays, dateKey, startOfDay, startOfWeek } from '@/utils/date';
import { currentStreak } from '@/utils/streak';

import type {
  AnalyticsOverview,
  AnalyticsRange,
  DensityDay,
  MuscleShare,
  VolumeBucket,
} from '../types/analytics.types';

const DAY_MS = 86_400_000;
const MONTHLY_KM_GOAL = 60;
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export interface AggregateInput {
  range: AnalyticsRange;
  now: number;
  profile: UserProfile;
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
  weights: readonly WeightEntry[];
  plans: readonly WorkoutPlan[];
}

export interface Bucket {
  label: string;
  start: number;
  end: number;
}

/** Sensors (resting HR, HRV, sleep) aren't recorded by the app yet; these are labelled sample values. */
const SAMPLE_SENSORS = {
  restingHr: { bpm: 52, label: 'Cardio Base • Optimal' },
  hrv: { ms: 68, label: 'High Capacity' },
};

/** Rolling 7-day windows ending today. */
function weeklyBuckets(
  count: number,
  now: number,
  label: (i: number, start: Date) => string,
): Bucket[] {
  const end = addDays(startOfDay(now), 1).getTime();
  return Array.from({ length: count }, (_, i) => {
    const windowEnd = end - (count - 1 - i) * 7 * DAY_MS;
    const start = windowEnd - 7 * DAY_MS;
    return { label: label(i, new Date(start)), start, end: windowEnd };
  });
}

function dailyBuckets(now: number): Bucket[] {
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return {
      label: WEEKDAY_LETTERS[day.getDay()]!,
      start: day.getTime(),
      end: addDays(day, 1).getTime(),
    };
  });
}

/** Calendar months ending with the month containing `now`. */
function monthlyBuckets(count: number, now: number, withYear = false): Bucket[] {
  const current = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i;
    const start = new Date(current.getFullYear(), current.getMonth() - offset, 1);
    const end = new Date(current.getFullYear(), current.getMonth() - offset + 1, 1);
    const label = withYear
      ? `${MONTH_LABELS[start.getMonth()]} ${String(start.getFullYear()).slice(2)}`
      : MONTH_LABELS[start.getMonth()]!;
    return { label, start: start.getTime(), end: end.getTime() };
  });
}

/** Buckets covering a range; ALL spans from the earliest record (at most the last 12 months). */
export function bucketsFor(range: AnalyticsRange, now: number, earliest: number): Bucket[] {
  switch (range) {
    case '1W':
      return dailyBuckets(now);
    case '1M':
      return weeklyBuckets(4, now, (i) => `W${i + 1}`);
    case '3M':
      return weeklyBuckets(12, now, (i) => `W${i + 1}`);
    case '6M':
      return monthlyBuckets(6, now);
    case '1Y':
      return monthlyBuckets(12, now);
    case 'ALL': {
      const first = new Date(earliest);
      const current = new Date(now);
      const months =
        (current.getFullYear() - first.getFullYear()) * 12 +
        current.getMonth() -
        first.getMonth() +
        1;
      return monthlyBuckets(Math.min(12, Math.max(2, months)), now, months > 12);
    }
  }
}

const inWindow = <T extends { startedAt: number }>(
  items: readonly T[],
  start: number,
  end: number,
) => items.filter((i) => i.startedAt >= start && i.startedAt < end);

export function volumeBuckets(
  workouts: readonly WorkoutRecord[],
  buckets: readonly Bucket[],
): VolumeBucket[] {
  return buckets.map((b) => ({
    label: b.label,
    kg: Math.round(inWindow(workouts, b.start, b.end).reduce((s, w) => s + w.volumeKg, 0)),
  }));
}

const DISPLAYED_MUSCLES: readonly {
  id: MuscleShare['id'];
  label: string;
  shortLabel: string;
  tone: MuscleShare['tone'];
}[] = [
  { id: 'chest', label: 'Chest', shortLabel: 'Chest', tone: 'primary' },
  { id: 'legs', label: 'Legs', shortLabel: 'Legs', tone: 'secondary' },
  { id: 'back', label: 'Back', shortLabel: 'Back', tone: 'tertiary' },
  { id: 'shoulders', label: 'Shoulders', shortLabel: 'Shld', tone: 'surfaceBright' },
  { id: 'arms', label: 'Arms', shortLabel: 'Arms', tone: 'onSurfaceVariant' },
];

/** Share of training volume per muscle zone; whole percents that always sum to 100. */
export function muscleShares(workouts: readonly WorkoutRecord[]): MuscleShare[] {
  const totals = volumeByMuscle(workouts);
  // Core work is folded into arms so the chart keeps its five designed zones.
  const volumes = DISPLAYED_MUSCLES.map((m) =>
    m.id === 'arms' ? totals.arms + totals.core : totals[m.id as keyof typeof totals],
  );
  const sum = volumes.reduce((a, b) => a + b, 0);
  if (sum === 0) return DISPLAYED_MUSCLES.map((m) => ({ ...m, percent: 0 }));

  // Largest-remainder rounding.
  const exact = volumes.map((v) => (v / sum) * 100);
  const floors = exact.map(Math.floor);
  let remaining = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remaining <= 0) break;
    floors[i]! += 1;
    remaining -= 1;
  }
  return DISPLAYED_MUSCLES.map((m, i) => ({ ...m, percent: floors[i]! }));
}

/** Average pace weighted by distance (total moving time ÷ total km), null without GPS activities. */
export function weightedPace(activities: readonly ActivityRecord[]): number | null {
  const gps = activities.filter((a) => a.distanceKm > 0);
  const km = gps.reduce((s, a) => s + a.distanceKm, 0);
  return km >= 0.5 ? Math.round(gps.reduce((s, a) => s + a.movingSec, 0) / km) : null;
}

function densityGrid(
  now: number,
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
): DensityDay[] {
  const active = new Set([...workouts, ...activities].map((r) => dateKey(r.startedAt)));
  const first = addDays(startOfWeek(now), -21);
  return Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    active: active.has(dateKey(addDays(first, i))),
  }));
}

const GOAL_LABEL = {
  muscle: 'Hypertrophy',
  fat_loss: 'Fat Loss',
  endurance: 'Endurance',
  athletic: 'Performance',
} as const;

/** Builds the whole analytics overview for a range from stored data. */
export function buildOverview(input: AggregateInput): AnalyticsOverview {
  const { range, now, profile, workouts, activities, weights, plans } = input;
  const earliest = Math.min(
    now,
    ...workouts.map((w) => w.startedAt),
    ...activities.map((a) => a.startedAt),
  );
  const buckets = bucketsFor(range, now, earliest);
  const windowStart = buckets[0]!.start;
  const windowEnd = buckets[buckets.length - 1]!.end;
  const span = windowEnd - windowStart;

  const volume = volumeBuckets(workouts, buckets);
  const previousTotalKg = Math.round(
    inWindow(workouts, windowStart - span, windowStart).reduce((s, w) => s + w.volumeKg, 0),
  );
  const inRangeWorkouts = inWindow(workouts, windowStart, windowEnd);

  const sortedWeights = [...weights].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const startKey = dateKey(windowStart);
  const rangeWeights = sortedWeights.filter((w) => w.dateKey >= startKey);
  const trendSource = rangeWeights.length >= 2 ? rangeWeights : sortedWeights.slice(-8);
  const latest = sortedWeights.at(-1);
  const firstInRange = rangeWeights[0] ?? sortedWeights[0];
  const delta = (pick: (w: WeightEntry) => number | undefined, digits = 1) => {
    const a = firstInRange && pick(firstInRange);
    const b = latest && pick(latest);
    return a === undefined || b === undefined || a === null || b === null
      ? 0
      : Math.round((b - a) * 10 ** digits) / 10 ** digits;
  };

  const inRangeActivities = inWindow(activities, windowStart, windowEnd);
  const previousActivities = inWindow(activities, windowStart - span, windowStart);
  const pace = weightedPace(inRangeActivities);
  const prevPace = weightedPace(previousActivities);
  const monthStart = now - 30 * DAY_MS;
  const monthlyKm =
    Math.round(
      inWindow(activities, monthStart, now + 1).reduce((s, a) => s + a.distanceKm, 0) * 10,
    ) / 10;

  const activeKeys = [...workouts, ...activities].map((r) => dateKey(r.startedAt));
  const plan = plans.length ? nextPlan(workouts, plans) : undefined;
  const p = profile.profile;

  return {
    range,
    athleteLine: `${profile.identity.name} • ${p.weightKg} kg • ${GOAL_LABEL[p.goal]} (${p.daysPerWeek}d/wk)`,
    synthesis: { status: 'OPTIMAL', sleepThreshold: '7h 30m', hrvThresholdMs: 65 },
    weight: {
      kg: latest?.kg ?? p.weightKg,
      deltaKg: delta((w) => w.kg),
      focusLabel: p.goal === 'muscle' ? 'Lean Bulk Focus' : `${goalById(p.goal).title} Focus`,
      trend: trendSource.map((w) => w.kg),
    },
    skeletalMuscle: { kg: latest?.muscleKg ?? 0, deltaKg: delta((w) => w.muscleKg) },
    bodyFat: { percent: latest?.bodyFatPercent ?? 0, deltaPercent: delta((w) => w.bodyFatPercent) },
    restingHr: SAMPLE_SENSORS.restingHr,
    hrv: SAMPLE_SENSORS.hrv,
    volume: {
      buckets: volume,
      previousTotalKg,
      subtitle: `${goalById(p.goal).subtitle} load tracking (kg lifted)`,
    },
    muscles: muscleShares(inRangeWorkouts),
    cardio: {
      avgPaceSecPerKm: pace ?? 0,
      paceDeltaSec: pace !== null && prevPace !== null ? pace - prevPace : 0,
      monthlyKm,
      monthlyGoalKm: MONTHLY_KM_GOAL,
    },
    density: {
      streakDays: currentStreak(activeKeys, now),
      days: densityGrid(now, workouts, activities),
    },
    nextBenchmark: {
      title: plan?.name.split(' –')[0] ?? 'Next session',
      whenLabel: 'Next in your rotation',
    },
  };
}
