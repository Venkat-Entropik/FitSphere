import type {
  AnalyticsOverview,
  AnalyticsRange,
  DensityDay,
  MuscleShare,
  VolumeBucket,
} from '../types/analytics.types';

const WEEK: VolumeBucket[] = [
  { label: 'M', kg: 4200 },
  { label: 'T', kg: 6100 },
  { label: 'W', kg: 0 },
  { label: 'T', kg: 5800 },
  { label: 'F', kg: 7400 },
  { label: 'S', kg: 4900 },
  { label: 'S', kg: 0 },
];

/** Deterministic pseudo-series so each range looks different but is stable between renders. */
function series(count: number, base: number, wobble: number, seed: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    Math.round(base + Math.sin((i + seed) * 1.3) * wobble + i * 40),
  );
}

const RANGE_SHAPE: Record<
  Exclude<AnalyticsRange, '1W'>,
  { labels: string[]; base: number; trendPoints: number }
> = {
  '1M': { labels: ['W1', 'W2', 'W3', 'W4'], base: 26000, trendPoints: 12 },
  '3M': { labels: Array.from({ length: 12 }, (_, i) => `W${i + 1}`), base: 25000, trendPoints: 18 },
  '6M': { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], base: 98000, trendPoints: 24 },
  '1Y': {
    labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    base: 95000,
    trendPoints: 30,
  },
  ALL: {
    labels: ['Y1 Q1', 'Y1 Q2', 'Y1 Q3', 'Y1 Q4', 'Y2 Q1', 'Y2 Q2'],
    base: 280000,
    trendPoints: 36,
  },
};

const MUSCLES: MuscleShare[] = [
  { id: 'chest', label: 'Chest', shortLabel: 'Chest', percent: 28, tone: 'primary' },
  { id: 'legs', label: 'Legs', shortLabel: 'Legs', percent: 26, tone: 'secondary' },
  { id: 'back', label: 'Back', shortLabel: 'Back', percent: 24, tone: 'tertiary' },
  { id: 'shoulders', label: 'Shoulders', shortLabel: 'Shld', percent: 12, tone: 'surfaceBright' },
  { id: 'arms', label: 'Arms', shortLabel: 'Arms', percent: 10, tone: 'onSurfaceVariant' },
];

const ACTIVE_DAYS = new Set([
  2, 3, 5, 6, 8, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
]);
const DENSITY: DensityDay[] = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  active: ACTIVE_DAYS.has(i + 1),
}));

export function buildMockOverview(range: AnalyticsRange): AnalyticsOverview {
  const shape = range === '1W' ? null : RANGE_SHAPE[range];
  const buckets: VolumeBucket[] = shape
    ? shape.labels.map((label, i) => ({
        label,
        kg: series(shape.labels.length, shape.base, shape.base * 0.08, 1)[i]!,
      }))
    : WEEK;
  const total = buckets.reduce((s, b) => s + b.kg, 0);
  const trendLength = shape?.trendPoints ?? 8;
  const trend = Array.from(
    { length: trendLength },
    (_, i) => 69.3 - (i / (trendLength - 1)) * 0.8 + Math.sin(i * 1.7) * 0.15,
  );

  return {
    range,
    athleteLine: 'Alex • 68.5 kg • Hypertrophy (5d/wk)',
    synthesis: { status: 'OPTIMAL', sleepThreshold: '7h 30m', hrvThresholdMs: 65 },
    weight: { kg: 68.5, deltaKg: -0.8, focusLabel: 'Lean Bulk Focus', trend },
    skeletalMuscle: { kg: 34.2, deltaKg: 0.4 },
    bodyFat: { percent: 13.8, deltaPercent: -0.4 },
    restingHr: { bpm: 52, label: 'Cardio Base • Optimal' },
    hrv: { ms: 68, label: 'High Capacity' },
    volume: {
      buckets,
      previousTotalKg: Math.round(total / 1.09),
      subtitle: 'Hypertrophy load tracking (kg lifted)',
    },
    muscles: MUSCLES,
    cardio: { avgPaceSecPerKm: 296, paceDeltaSec: -8, monthlyKm: 54.2, monthlyGoalKm: 60 },
    density: { streakDays: 14, days: DENSITY },
    nextBenchmark: { title: 'Leg Day Hypertrophy II', whenLabel: 'Tomorrow, 07:00' },
  };
}
