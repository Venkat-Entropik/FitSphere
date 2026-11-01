export type GoalId = 'muscle' | 'fat_loss' | 'endurance' | 'athletic';
export type Sex = 'male' | 'female';
export type Experience = 'beginner' | 'intermediate' | 'advanced';

export interface GoalOption {
  id: GoalId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  /** Protein target in g per kg of bodyweight. */
  proteinPerKg: number;
  /** Weekly training days considered optimal for this goal (inclusive). */
  idealDays: readonly [number, number];
  optimalLabel: string;
}

export interface OnboardingProfile {
  goal: GoalId;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetKg: number;
  experience: Experience;
  daysPerWeek: number;
}

/** Fixed identity fields from the account; not edited on this screen. */
export interface OnboardingIdentity {
  name: string;
  age: number;
}

export interface OnboardingDraft {
  identity: OnboardingIdentity;
  profile: OnboardingProfile;
}

export interface NutritionSynthesis {
  baselineKcal: number;
  proteinG: number;
  proteinPerKg: number;
  split: { code: string; label: string };
}
