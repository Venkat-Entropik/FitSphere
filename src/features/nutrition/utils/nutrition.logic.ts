import type { DailyNutrition, Macros, Meal, MealCategory } from '../types/nutrition.types';

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
