import type {
  OnboardingDraft,
  OnboardingProfile,
} from '@/features/authentication/types/onboarding.types';

export type { OnboardingProfile };

/** The signed-in athlete: identity plus the body/goal profile captured in onboarding. */
export interface UserProfile extends OnboardingDraft {
  updatedAt: number;
}

export type ProfilePatch = Partial<OnboardingProfile>;

export interface WeightEntry {
  id: string;
  /** Local day, "YYYY-MM-DD". One entry per day (latest wins). */
  dateKey: string;
  kg: number;
  bodyFatPercent?: number;
  muscleKg?: number;
}

/** Daily targets derived from the profile. */
export interface NutritionTargets {
  budgetKcal: number;
  protein: number;
  carbs: number;
  fat: number;
  hydrationGoalMl: number;
}
