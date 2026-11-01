export type Tone = 'primary' | 'secondary' | 'tertiary' | 'neutral';

export interface HeatCell {
  day: number;
  /** lime = strength session, cyan = cardio session. */
  kind: 'strength' | 'cardio' | 'rest';
}

export interface PersonalRecord {
  id: string;
  exercise: string;
  /** e.g. "32 kg" */
  value: string;
  /** e.g. "× 10 reps" */
  detail: string;
  chip: { label: string; tone: Tone; icon?: string };
  icon: string;
  iconTone: Tone;
  footLeft: { text: string; tone: Tone };
  footRight?: string;
}

export interface BodySnapshot {
  kg: number;
  bodyFatPercent: number;
  muscleKg: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: Tone;
  status: 'earned' | 'locked';
  /** Present on locked badges. */
  progress?: { current: number; target: number; unit: string };
}

export interface ProgressOverview {
  macrocycleLabel: string;
  streak: {
    days: number;
    bestStreak: number;
    weekDone: number;
    weekTarget: number;
    heatmap: HeatCell[];
  };
  /** weeklyVolumePercent / weeksToMilestone are null when there isn't enough data to compute them. */
  synthesis: {
    weeklyVolumePercent: number | null;
    milestoneKg: number;
    weeksToMilestone: number | null;
  };
  personalRecords: { totalCount: number; items: PersonalRecord[] };
  transformation: {
    dayNumber: number;
    baseline: BodySnapshot;
    current: BodySnapshot;
    trajectory: { points: number[]; weekDeltaKg: number; targetKg: number; midLabel: string };
  };
  badges: { items: Badge[]; unlocked: number; total: number };
}
