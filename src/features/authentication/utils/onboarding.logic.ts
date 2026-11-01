import type {
  Experience,
  GoalId,
  GoalOption,
  NutritionSynthesis,
  OnboardingIdentity,
  OnboardingProfile,
} from '../types/onboarding.types';

export const GOALS: readonly GoalOption[] = [
  {
    id: 'muscle',
    title: 'Build Muscle',
    subtitle: 'Hypertrophic Adaptation',
    description:
      'Max lean mass acceleration, volume periodization, and timed intra-workout amino balance.',
    icon: 'fitness_center',
    proteinPerKg: 2.05,
    idealDays: [4, 6],
    optimalLabel: 'Hypertrophy Optimal',
  },
  {
    id: 'fat_loss',
    title: 'Fat Loss & Cut',
    subtitle: 'Metabolic Density Focus',
    description:
      'Deficit preservation algorithm, glycemic stabilization, and high-density functional conditioning.',
    icon: 'local_fire_department',
    proteinPerKg: 2.2,
    idealDays: [4, 6],
    optimalLabel: 'Fat Loss Optimal',
  },
  {
    id: 'endurance',
    title: 'Endurance & Speed',
    subtitle: 'VO2 Max & Cadence',
    description:
      'Lactate clearance tuning, mitochondrial density stimulation, and aerobic engine conditioning.',
    icon: 'sprint',
    proteinPerKg: 1.6,
    idealDays: [4, 6],
    optimalLabel: 'Endurance Optimal',
  },
  {
    id: 'athletic',
    title: 'Athletic Performance',
    subtitle: 'Kinetic Explosiveness',
    description:
      'Explosive triple-extension power output, CNS fatigue dampening, and elastic tendon integrity.',
    icon: 'bolt',
    proteinPerKg: 1.8,
    idealDays: [3, 5],
    optimalLabel: 'Performance Optimal',
  },
];

export const goalById = (id: GoalId): GoalOption => GOALS.find((g) => g.id === id)!;

export const EXPERIENCE_OPTIONS: readonly { id: Experience; label: string; years: string }[] = [
  { id: 'beginner', label: 'Beginner', years: '0–1 yrs' },
  { id: 'intermediate', label: 'Intermediate', years: '2-4 yrs continuous' },
  { id: 'advanced', label: 'Advanced', years: '5+ yrs' },
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** The goal that best fits where the user's weight is heading. */
export function recommendedGoal(weightKg: number, targetKg: number): GoalId {
  if (targetKg > weightKg + 1) return 'muscle';
  if (targetKg < weightKg - 1) return 'fat_loss';
  return 'athletic';
}

/** Mifflin–St Jeor resting energy, in kcal/day. */
export function restingKcal(
  p: Pick<OnboardingProfile, 'sex' | 'weightKg' | 'heightCm'>,
  age: number,
): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * age + (p.sex === 'male' ? 5 : -161);
}

/** Activity multiplier from weekly training days (sedentary 1.2 up to very active ~1.725). */
export const activityFactor = (daysPerWeek: number): number =>
  1.2 + 0.075 * Math.min(7, Math.max(0, daysPerWeek));

export function recommendedSplit(days: number): { code: string; label: string } {
  if (days <= 2) return { code: 'FB', label: 'Full Body' };
  if (days === 3) return { code: 'FB', label: 'Full·Body·Full' };
  if (days === 4) return { code: 'U/L', label: 'Upper·Lower' };
  if (days === 5) return { code: 'PPL', label: 'Push·Pull·Legs' };
  return { code: 'PPL×2', label: 'Push·Pull·Legs ×2' };
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function synthesize(
  profile: OnboardingProfile,
  identity: OnboardingIdentity,
): NutritionSynthesis {
  const goal = goalById(profile.goal);
  return {
    baselineKcal: roundTo(
      restingKcal(profile, identity.age) * activityFactor(profile.daysPerWeek),
      50,
    ),
    proteinG: Math.round(goal.proteinPerKg * profile.weightKg),
    proteinPerKg: goal.proteinPerKg,
    split: recommendedSplit(profile.daysPerWeek),
  };
}

export function cadenceSummary(goal: GoalId, days: number): { label: string; rest: string } {
  const g = goalById(goal);
  const [min, max] = g.idealDays;
  const label =
    days < min ? 'Below ideal range' : days > max ? 'Above ideal range' : g.optimalLabel;
  return { label, rest: `${7 - days} Rest & CNS Recovery` };
}

export function targetDelta(profile: Pick<OnboardingProfile, 'weightKg' | 'targetKg'>): number {
  return Math.round((profile.targetKg - profile.weightKg) * 10) / 10;
}

export const formatDelta = (kg: number): string => `${kg > 0 ? '+' : ''}${kg}kg`;
