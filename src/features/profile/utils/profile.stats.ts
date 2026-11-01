import type { ActivityRecord } from '@/features/activities/types/activity.types';
import { goalById, recommendedSplit } from '@/features/authentication/utils/onboarding.logic';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { daysBetween, dateKey } from '@/utils/date';
import { currentStreak } from '@/utils/streak';

import type { UserProfile, WeightEntry } from '../types/profile.types';

const PROGRAM_WEEKS = 6;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export interface ProfileStatsInput {
  now: number;
  profile: UserProfile;
  weights: readonly WeightEntry[];
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
}

const ROMAN = ['I', 'II'] as const;

/** Numbers shown in the header card: mass, height, latest body fat, streak, and the training phase. */
export function headerStats(input: ProfileStatsInput) {
  const { now, profile, weights, workouts, activities } = input;
  const p = profile.profile;
  const withFat = [...weights]
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .filter((w) => w.bodyFatPercent !== undefined);
  const firstWorkout = Math.min(now, ...workouts.map((w) => w.startedAt));
  const programWeek = (Math.floor(daysBetween(firstWorkout, now) / 7) % PROGRAM_WEEKS) + 1;
  return {
    massKg: p.weightKg,
    heightCm: p.heightCm,
    bodyFatPercent: withFat.at(-1)?.bodyFatPercent ?? null,
    streak: currentStreak(
      [...workouts, ...activities].map((r) => dateKey(r.startedAt)),
      now,
    ),
    goalSubtitle: goalById(p.goal).subtitle,
    phase: programWeek <= PROGRAM_WEEKS / 2 ? ROMAN[0] : ROMAN[1],
  };
}

const TRAJECTORY_LABEL = {
  muscle: 'Lean Muscle Gain',
  fat_loss: 'Fat Loss',
  endurance: 'Endurance Build',
  athletic: 'Athletic Performance',
} as const;

/** Where the athlete is between the first logged weight and the target. */
export function goalTrajectory(profile: UserProfile, weights: readonly WeightEntry[]) {
  const p = profile.profile;
  const first =
    [...weights].sort((a, b) => a.dateKey.localeCompare(b.dateKey))[0]?.kg ?? p.weightKg;
  const remaining = round1(p.targetKg - p.weightKg);
  const span = p.targetKg - first;
  return {
    label: TRAJECTORY_LABEL[p.goal],
    deltaKg: remaining,
    deltaText: `${remaining > 0 ? '+' : ''}${remaining}`,
    progress: span === 0 ? 1 : clamp01((p.weightKg - first) / span),
    targetText: `Target: ${p.targetKg.toFixed(1)} kg (${p.weightKg} kg current)`,
  };
}

/** Calories left, logged and share of budget met for today. */
export function intakeSummary(consumedKcal: number, budgetKcal: number) {
  return {
    left: Math.max(0, budgetKcal - consumedKcal),
    logged: consumedKcal,
    percentMet: budgetKcal > 0 ? Math.round(clamp01(consumedKcal / budgetKcal) * 100) : 0,
    progress: budgetKcal > 0 ? clamp01(consumedKcal / budgetKcal) : 0,
  };
}

export function cadenceSummary(profile: UserProfile) {
  const days = profile.profile.daysPerWeek;
  return { days, split: recommendedSplit(days).label.replaceAll('·', ' • ') };
}

export const proteinNote = (perKg: number) => `${perKg}g per kg total body mass`;
