import { z } from 'zod';

import {
  activityFactor,
  goalById,
  restingKcal,
} from '@/features/authentication/utils/onboarding.logic';

import type {
  NutritionTargets,
  OnboardingProfile,
  ProfilePatch,
  UserProfile,
  WeightEntry,
} from '../types/profile.types';

/** Maintenance-relative calorie change per goal (kcal/day). Training days already raise maintenance. */
const GOAL_KCAL_ADJUSTMENT: Record<OnboardingProfile['goal'], number> = {
  muscle: 0,
  fat_loss: -400,
  endurance: 100,
  athletic: 0,
};

const FAT_SHARE_OF_KCAL = 0.25;
const HYDRATION_ML_PER_KG = 50;

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Daily calorie, macro and water targets for a profile. Estimates for planning, not medical advice. */
export function nutritionTargets(profile: OnboardingProfile, age: number): NutritionTargets {
  const maintenance = restingKcal(profile, age) * activityFactor(profile.daysPerWeek);
  const budgetKcal = roundTo(maintenance + GOAL_KCAL_ADJUSTMENT[profile.goal], 50);
  const protein = Math.round(goalById(profile.goal).proteinPerKg * profile.weightKg);
  const fat = roundTo((budgetKcal * FAT_SHARE_OF_KCAL) / 9, 5);
  const carbs = Math.max(0, Math.round((budgetKcal - protein * 4 - fat * 9) / 4));
  return {
    budgetKcal,
    protein,
    carbs,
    fat,
    hydrationGoalMl: roundTo(profile.weightKg * HYDRATION_ML_PER_KG, 100),
  };
}

const patchSchema = z
  .object({
    goal: z.enum(['muscle', 'fat_loss', 'endurance', 'athletic']),
    sex: z.enum(['male', 'female']),
    heightCm: z
      .number()
      .min(120, 'Height must be at least 120 cm')
      .max(230, 'Height must be at most 230 cm'),
    weightKg: z
      .number()
      .min(30, 'Weight must be at least 30 kg')
      .max(250, 'Weight must be at most 250 kg'),
    targetKg: z
      .number()
      .min(30, 'Target must be at least 30 kg')
      .max(250, 'Target must be at most 250 kg'),
    experience: z.enum(['beginner', 'intermediate', 'advanced']),
    daysPerWeek: z
      .number()
      .int('Use a whole number of days')
      .min(1, 'Train at least 1 day')
      .max(7, 'At most 7 days'),
  })
  .partial()
  .strict();

export type PatchResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; errors: Partial<Record<keyof OnboardingProfile, string>> };

/** Validates and merges a partial update; never mutates the input. */
export function applyProfilePatch(
  profile: UserProfile,
  patch: ProfilePatch,
  now: number,
): PatchResult {
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success) {
    const errors: Partial<Record<keyof OnboardingProfile, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof OnboardingProfile | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  return {
    ok: true,
    profile: { ...profile, profile: { ...profile.profile, ...parsed.data }, updatedAt: now },
  };
}

/** One entry per day; logging again on the same day replaces it. Result is sorted oldest → newest. */
export function upsertWeight(entries: readonly WeightEntry[], entry: WeightEntry): WeightEntry[] {
  return [...entries.filter((e) => e.dateKey !== entry.dateKey), entry].sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey),
  );
}

export const latestWeight = (entries: readonly WeightEntry[]): WeightEntry | undefined =>
  [...entries].sort((a, b) => a.dateKey.localeCompare(b.dateKey)).at(-1);

/** Change from the first entry on/after `sinceKey` to the latest; null with fewer than two points. */
export function weightChange(entries: readonly WeightEntry[], sinceKey: string): number | null {
  const window = [...entries]
    .filter((e) => e.dateKey >= sinceKey)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (window.length < 2) return null;
  return Math.round((window.at(-1)!.kg - window[0]!.kg) * 10) / 10;
}

export function bmi(kg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}

/** Kilograms still to go to the target (negative when the target is below current weight). */
export const kgToTarget = (p: Pick<OnboardingProfile, 'weightKg' | 'targetKg'>): number =>
  Math.round((p.targetKg - p.weightKg) * 10) / 10;
