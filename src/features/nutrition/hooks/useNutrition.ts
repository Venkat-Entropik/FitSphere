import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { nutritionTargets } from '@/features/profile/utils/profile.logic';
import { invalidateAfter } from '@/services/api/invalidation';
import { dateKey } from '@/utils/date';

import { nutritionService } from '../services/nutrition.service';
import type { MealRecommendation, NewMealInput } from '../types/nutrition.types';
import type { NutritionDayRecord } from '../types/nutrition-record.types';
import { composeDay } from '../utils/nutrition.logic';

export const nutritionKeys = { day: (key: string) => ['nutrition', 'day', key] as const };

/** Today's key, fixed for the lifetime of the screen. */
export function useToday(): string {
  const [key] = useState(() => dateKey(Date.now()));
  return key;
}

/**
 * Today's nutrition: the stored day (server state) combined with the profile's targets. Changing the
 * profile recalculates targets and the recommendation without refetching the day.
 */
export function useNutritionDay(key?: string) {
  const today = useToday();
  const day = key ?? today;
  const record = useQuery({
    queryKey: nutritionKeys.day(day),
    queryFn: () => nutritionService.getDay(day),
  });
  const profile = useProfile();

  const data = useMemo(() => {
    if (!record.data || !profile.data) return undefined;
    return composeDay(
      record.data,
      profile.data,
      nutritionTargets(profile.data.profile, profile.data.identity.age),
    );
  }, [record.data, profile.data]);

  return {
    data,
    dateKey: day,
    isPending: record.isPending || profile.isPending,
    error: record.error ?? profile.error,
    refetch: async () => {
      await Promise.all([record.refetch(), profile.refetch()]);
    },
  };
}

function useDayMutation<TVars>(key: string, fn: (vars: TVars) => Promise<NutritionDayRecord>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (record) => {
      queryClient.setQueryData(nutritionKeys.day(key), record);
      void invalidateAfter(queryClient, 'nutrition');
    },
  });
}

export function useLogMeal(key: string) {
  return useDayMutation(key, (input: NewMealInput) => nutritionService.logMeal(key, input));
}

/** Logs the suggested meal exactly as recommended. */
export function useLogRecommendedMeal(key: string) {
  return useDayMutation(key, (meal: MealRecommendation) =>
    nutritionService.logMeal(key, {
      category: meal.category,
      title: meal.title,
      kcal: meal.kcal,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    }),
  );
}

export function useRemoveMeal(key: string) {
  return useDayMutation(key, (mealId: string) => nutritionService.removeMeal(key, mealId));
}

export function useAddWater(key: string, goalMl: number) {
  return useDayMutation(key, (ml: number) => nutritionService.addWater(key, ml, goalMl));
}
