import { useQuery } from '@tanstack/react-query';

import { foodSearchService } from '../services/food-search.service';
import { nutritionService } from '../services/nutrition.service';
import { recentFoods } from '../utils/food.logic';

/** Searches the food database. Only runs for a submitted query of two or more characters. */
export function useFoodSearch(query: string) {
  const text = query.trim();
  return useQuery({
    queryKey: ['foods', 'search', text.toLowerCase()],
    queryFn: () => foodSearchService.search(text),
    enabled: text.length >= 2,
    staleTime: 10 * 60_000,
    retry: false, // the database allows few searches per minute; a failure should say so, not hammer it
  });
}

/** Meals logged in the last weeks, offered again. Read from the phone, so it works offline. */
export function useRecentFoods() {
  return useQuery({
    queryKey: ['nutrition', 'recent-foods'],
    queryFn: async () => recentFoods(await nutritionService.getRecentMeals()),
  });
}
