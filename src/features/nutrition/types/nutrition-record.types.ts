import type { Meal } from './nutrition.types';

/** One day of logged food and water, as stored by the backend. */
export interface NutritionDayRecord {
  dateKey: string;
  meals: Meal[];
  hydrationMl: number;
}
