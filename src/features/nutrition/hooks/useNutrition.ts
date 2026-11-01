import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { nutritionService } from '../services/nutrition.service';
import type { DailyNutrition, NewMealInput } from '../types/nutrition.types';

export const nutritionKeys = { day: ['nutrition', 'day'] as const };

export function useNutritionDay() {
  return useQuery({ queryKey: nutritionKeys.day, queryFn: () => nutritionService.getDay() });
}

/** All mutations return the updated day, which replaces the cached one. */
function useDayMutation<TVars>(fn: (vars: TVars) => Promise<DailyNutrition>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (day) => queryClient.setQueryData(nutritionKeys.day, day),
  });
}

export const useLogMeal = () =>
  useDayMutation((input: NewMealInput) => nutritionService.logMeal(input));
export const useLogRecommendedMeal = () =>
  useDayMutation((_: void) => nutritionService.logRecommendedMeal());
export const useAddWater = () => useDayMutation((ml: number) => nutritionService.addWater(ml));
