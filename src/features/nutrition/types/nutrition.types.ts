export type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal extends Macros {
  id: string;
  category: MealCategory;
  title: string;
  /** Epoch ms for logged meals; null for a recommendation not yet eaten. */
  loggedAt: number | null;
  kcal: number;
}

export interface MealRecommendation extends Macros {
  id: string;
  category: MealCategory;
  title: string;
  kcal: number;
}

export interface DailyNutrition {
  athleteName: string;
  weightKg: number;
  goalLabel: string;
  budgetKcal: number;
  macroTargets: Macros;
  hydrationMl: number;
  hydrationGoalMl: number;
  /** Planned number of meals today (logged + upcoming). */
  plannedMeals: number;
  meals: Meal[];
  recommendation: MealRecommendation | null;
}

export interface NewMealInput extends Macros {
  category: MealCategory;
  title: string;
  kcal: number;
}
