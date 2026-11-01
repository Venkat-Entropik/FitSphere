import type { NutritionTargets, UserProfile } from '@/features/profile/types/profile.types';

import { MEAL_CATALOG } from '../services/meal-catalog.mock';
import type {
  DailyNutrition,
  Macros,
  Meal,
  MealCategory,
  MealRecommendation,
} from '../types/nutrition.types';
import type { NutritionDayRecord } from '../types/nutrition-record.types';
import { goalById } from '@/features/authentication/utils/onboarding.logic';

export const MEAL_CATEGORIES: readonly { id: MealCategory; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: 'wb_twilight' },
  { id: 'lunch', label: 'Lunch', icon: 'sunny' },
  { id: 'snack', label: 'Post-Workout Snack', icon: 'bolt' },
  { id: 'dinner', label: 'Dinner', icon: 'restaurant' },
];

export const categoryMeta = (id: MealCategory) => MEAL_CATEGORIES.find((c) => c.id === id)!;

export const WATER_STEPS_ML = [250, 500] as const;

export function consumedKcal(meals: readonly Meal[]): number {
  return meals.reduce((sum, m) => sum + m.kcal, 0);
}

export function consumedMacros(meals: readonly Meal[]): Macros {
  return meals.reduce<Macros>(
    (t, m) => ({ protein: t.protein + m.protein, carbs: t.carbs + m.carbs, fat: t.fat + m.fat }),
    { protein: 0, carbs: 0, fat: 0 },
  );
}

/** 0–1, capped at 1; 0 when there is no target. */
export function ratio(value: number, target: number): number {
  return target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
}

export const percent = (value: number, target: number): number =>
  Math.round(ratio(value, target) * 100);

export function kcalLeft(day: Pick<DailyNutrition, 'budgetKcal' | 'meals'>): number {
  return Math.max(0, day.budgetKcal - consumedKcal(day.meals));
}

export function formatLitres(ml: number): string {
  // Round half up on whole 100 ml steps (toFixed would show 2.65 L as 2.6).
  return (Math.round(ml / 100) / 10).toFixed(1);
}

/** Rule-based macro tip (not an AI model, not medical advice). */
export function macroTip(day: DailyNutrition): { shortfallG: number; text: string } {
  const shortfallG = Math.max(
    0,
    Math.round(day.macroTargets.protein - consumedMacros(day.meals).protein),
  );
  if (shortfallG < 10) {
    return {
      shortfallG,
      text: 'Your protein is on target for the day. Keep carbs and fats steady and stay hydrated.',
    };
  }
  return {
    shortfallG,
    text: `A high-protein dinner like wild salmon or Greek yogurt will help close the gap and support muscle hypertrophy.`,
  };
}

export function addMeal(day: DailyNutrition, meal: Meal): DailyNutrition {
  return { ...day, meals: [...day.meals, meal] };
}

/** Marks the recommendation as eaten: it becomes a logged meal and is no longer upcoming. */
export function logRecommendation(day: DailyNutrition, now: number): DailyNutrition {
  const rec = day.recommendation;
  if (!rec) return day;
  const { id, ...rest } = rec;
  return { ...addMeal(day, { id, ...rest, loggedAt: now }), recommendation: null };
}

export function addWater(day: DailyNutrition, ml: number): DailyNutrition {
  return {
    ...day,
    hydrationMl: Math.min(day.hydrationGoalMl * 2, Math.max(0, day.hydrationMl + ml)),
  };
}

/** Meals eaten out of those planned for the day, e.g. "3 of 4 logged". */
export function loggedLabel(day: DailyNutrition): string {
  return `${Math.min(day.meals.length, day.plannedMeals)} of ${day.plannedMeals} logged`;
}

export function formatMealTime(epochMs: number, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(epochMs),
  );
}

const MEALS_PER_DAY = 4;
const CATEGORY_ORDER: readonly MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export const emptyDay = (key: string): NutritionDayRecord => ({
  dateKey: key,
  meals: [],
  hydrationMl: 0,
});

/** The first meal slot of the day that has nothing logged yet; null once every slot is covered. */
export function nextMealCategory(meals: readonly Meal[]): MealCategory | null {
  const logged = new Set(meals.map((m) => m.category));
  return CATEGORY_ORDER.find((c) => !logged.has(c)) ?? null;
}

/**
 * Picks the catalog meal for the next open slot that best fits what is left of the day: calories
 * split across the remaining slots, with protein weighted double. Returns null when all slots are logged.
 */
export function recommendMeal(
  meals: readonly Meal[],
  targets: Pick<NutritionTargets, 'budgetKcal' | 'protein'>,
  catalog: readonly MealRecommendation[] = MEAL_CATALOG,
): MealRecommendation | null {
  const category = nextMealCategory(meals);
  if (!category) return null;
  const slotsLeft = Math.max(1, CATEGORY_ORDER.length - new Set(meals.map((m) => m.category)).size);
  const eaten = consumedMacros(meals);
  const wantKcal = Math.max(150, (targets.budgetKcal - consumedKcal(meals)) / slotsLeft);
  const wantProtein = Math.max(10, (targets.protein - eaten.protein) / slotsLeft);
  const options = catalog.filter((m) => m.category === category);
  const score = (m: MealRecommendation) =>
    Math.abs(m.kcal - wantKcal) / wantKcal + (2 * Math.abs(m.protein - wantProtein)) / wantProtein;
  return options.length ? [...options].sort((a, b) => score(a) - score(b))[0]! : null;
}

/** Combines a stored day with the athlete's profile into everything the Nutrition screen shows. */
export function composeDay(
  record: NutritionDayRecord,
  profile: UserProfile,
  targets: NutritionTargets,
): DailyNutrition {
  const meals = [...record.meals].sort((a, b) => (a.loggedAt ?? 0) - (b.loggedAt ?? 0));
  return {
    athleteName: profile.identity.name.split(' ')[0]!,
    weightKg: profile.profile.weightKg,
    goalLabel:
      goalById(profile.profile.goal).title === 'Build Muscle'
        ? 'Muscle Hypertrophy'
        : goalById(profile.profile.goal).title,
    budgetKcal: targets.budgetKcal,
    macroTargets: { protein: targets.protein, carbs: targets.carbs, fat: targets.fat },
    hydrationMl: record.hydrationMl,
    hydrationGoalMl: targets.hydrationGoalMl,
    plannedMeals: MEALS_PER_DAY,
    meals,
    recommendation: recommendMeal(meals, targets),
  };
}

export function removeMeal(record: NutritionDayRecord, mealId: string): NutritionDayRecord {
  return { ...record, meals: record.meals.filter((m) => m.id !== mealId) };
}

export function addMealToRecord(record: NutritionDayRecord, meal: Meal): NutritionDayRecord {
  return { ...record, meals: [...record.meals, meal] };
}

export function addWaterToRecord(
  record: NutritionDayRecord,
  ml: number,
  goalMl: number,
): NutritionDayRecord {
  return { ...record, hydrationMl: Math.min(goalMl * 2, Math.max(0, record.hydrationMl + ml)) };
}
