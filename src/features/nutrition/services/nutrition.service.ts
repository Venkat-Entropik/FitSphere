import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { DailyNutrition, NewMealInput } from '../types/nutrition.types';
import { addMeal, addWater, logRecommendation } from '../utils/nutrition.logic';
import { buildMockDay } from './nutrition.mock';

/** Each mutation resolves to the updated day so the UI can replace its cache in one step. */
export interface NutritionRepository {
  getDay(): Promise<DailyNutrition>;
  logMeal(input: NewMealInput): Promise<DailyNutrition>;
  logRecommendedMeal(): Promise<DailyNutrition>;
  addWater(ml: number): Promise<DailyNutrition>;
}

let mockDay = buildMockDay();

const mockRepository: NutritionRepository = {
  getDay: async () => mockDay,
  logMeal: async (input) => {
    mockDay = addMeal(mockDay, { id: `meal-${Date.now()}`, loggedAt: Date.now(), ...input });
    return mockDay;
  },
  logRecommendedMeal: async () => {
    mockDay = logRecommendation(mockDay, Date.now());
    return mockDay;
  },
  addWater: async (ml) => {
    mockDay = addWater(mockDay, ml);
    return mockDay;
  },
};

const apiRepository: NutritionRepository = {
  getDay: async () => (await apiClient.get<DailyNutrition>(API_ENDPOINTS.nutrition.daily)).data,
  logMeal: async (input) =>
    (await apiClient.post<DailyNutrition>(API_ENDPOINTS.nutrition.logFood, input)).data,
  logRecommendedMeal: async () =>
    (await apiClient.post<DailyNutrition>(API_ENDPOINTS.nutrition.logRecommended)).data,
  addWater: async (ml) =>
    (await apiClient.post<DailyNutrition>(API_ENDPOINTS.nutrition.water, { ml })).data,
};

export const nutritionService: NutritionRepository = env.useMocks ? mockRepository : apiRepository;

/** Test helper: resets the in-memory sample day. */
export function resetMockNutrition(): void {
  mockDay = buildMockDay();
}
