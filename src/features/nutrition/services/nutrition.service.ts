import { dbReady, useMockDb } from '@/services/mock-db/mock-db';
import { commitChange } from '@/services/sync';

import type { Meal, NewMealInput } from '../types/nutrition.types';
import type { NutritionDayRecord } from '../types/nutrition-record.types';
import { emptyDay } from '../utils/nutrition.logic';

/**
 * Stores raw days of food and water. Targets, totals and recommendations are derived on the client
 * from the profile, so every write just returns the updated day.
 */
export interface NutritionRepository {
  getDay(dateKey: string): Promise<NutritionDayRecord>;
  logMeal(dateKey: string, input: NewMealInput, now?: number): Promise<NutritionDayRecord>;
  removeMeal(dateKey: string, mealId: string): Promise<NutritionDayRecord>;
  addWater(dateKey: string, ml: number, goalMl: number): Promise<NutritionDayRecord>;
}

const dayOf = (dateKey: string): NutritionDayRecord =>
  useMockDb.getState().nutritionDays[dateKey] ?? emptyDay(dateKey);

/** An id that stays the same if the request is retried, so the server never counts it twice. */
const eventId = () => `water-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Reads and writes the on-device database. With the real backend, writes also queue for the server,
 * so logging meals and water works offline.
 */
export const nutritionService: NutritionRepository = {
  getDay: async (dateKey) => {
    await dbReady();
    return dayOf(dateKey);
  },
  logMeal: async (dateKey, input, now = Date.now()) => {
    const meal: Meal = { id: `meal-${now}`, loggedAt: now, ...input };
    await commitChange({ type: 'meal.log', dateKey, meal });
    return dayOf(dateKey);
  },
  removeMeal: async (dateKey, mealId) => {
    await commitChange({ type: 'meal.remove', dateKey, mealId });
    return dayOf(dateKey);
  },
  addWater: async (dateKey, ml, goalMl) => {
    await commitChange({ type: 'water.add', dateKey, ml, goalMl, eventId: eventId() });
    return dayOf(dateKey);
  },
};
