import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { NewMealInput } from '../types/nutrition.types';
import type { NutritionDayRecord } from '../types/nutrition-record.types';
import { addMealToRecord, addWaterToRecord, emptyDay, removeMeal } from '../utils/nutrition.logic';

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

async function update(
  dateKey: string,
  change: (day: NutritionDayRecord) => NutritionDayRecord,
): Promise<NutritionDayRecord> {
  await dbReady();
  const days = useMockDb.getState().nutritionDays;
  const next = change(days[dateKey] ?? emptyDay(dateKey));
  useMockDb.setState({ nutritionDays: { ...days, [dateKey]: next } });
  return next;
}

const mockRepository: NutritionRepository = {
  getDay: async (dateKey) => {
    await dbReady();
    return useMockDb.getState().nutritionDays[dateKey] ?? emptyDay(dateKey);
  },
  logMeal: (dateKey, input, now = Date.now()) =>
    update(dateKey, (day) => addMealToRecord(day, { id: `meal-${now}`, loggedAt: now, ...input })),
  removeMeal: (dateKey, mealId) => update(dateKey, (day) => removeMeal(day, mealId)),
  addWater: (dateKey, ml, goalMl) => update(dateKey, (day) => addWaterToRecord(day, ml, goalMl)),
};

const apiRepository: NutritionRepository = {
  getDay: async (dateKey) =>
    (
      await apiClient.get<NutritionDayRecord>(API_ENDPOINTS.nutrition.daily, {
        params: { date: dateKey },
      })
    ).data,
  logMeal: async (dateKey, input, now = Date.now()) =>
    (
      await apiClient.post<NutritionDayRecord>(API_ENDPOINTS.nutrition.logFood, {
        date: dateKey,
        id: `meal-${now}`,
        loggedAt: now,
        ...input,
      })
    ).data,
  removeMeal: async (dateKey, mealId) =>
    (
      await apiClient.delete<NutritionDayRecord>(`${API_ENDPOINTS.nutrition.logFood}/${mealId}`, {
        params: { date: dateKey },
      })
    ).data,
  addWater: async (dateKey, ml) =>
    (await apiClient.post<NutritionDayRecord>(API_ENDPOINTS.nutrition.water, { date: dateKey, ml }))
      .data,
};

export const nutritionService: NutritionRepository = env.useMocks ? mockRepository : apiRepository;
