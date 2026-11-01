export const ANALYTICS_RANGES = ['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export interface VolumeBucket {
  label: string;
  /** Kilograms lifted; 0 for a rest bucket. */
  kg: number;
}

export type MuscleTone =
  'primary' | 'secondary' | 'tertiary' | 'surfaceBright' | 'onSurfaceVariant';

export interface MuscleShare {
  id: string;
  label: string;
  shortLabel: string;
  percent: number;
  tone: MuscleTone;
}

export interface DensityDay {
  day: number;
  active: boolean;
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  athleteLine: string;
  synthesis: { status: string; sleepThreshold: string; hrvThresholdMs: number };
  weight: { kg: number; deltaKg: number; focusLabel: string; trend: number[] };
  skeletalMuscle: { kg: number; deltaKg: number };
  bodyFat: { percent: number; deltaPercent: number };
  restingHr: { bpm: number; label: string };
  hrv: { ms: number; label: string };
  volume: { buckets: VolumeBucket[]; previousTotalKg: number; subtitle: string };
  muscles: MuscleShare[];
  cardio: {
    avgPaceSecPerKm: number;
    paceDeltaSec: number;
    monthlyKm: number;
    monthlyGoalKm: number;
  };
  density: { streakDays: number; days: DensityDay[] };
  nextBenchmark: { title: string; whenLabel: string };
}
