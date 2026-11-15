import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { NutritionDayRecord } from '@/features/nutrition/types/nutrition-record.types';
import type { UserProfile, WeightEntry } from '@/features/profile/types/profile.types';
import type {
  Exercise,
  Routine,
  WorkoutRecord,
} from '@/features/workouts/types/workout-record.types';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';
import { addDays, dateKey } from '@/utils/date';

import type { LocalData } from './local-state';

/** How many days of meals and water a device keeps locally. */
export const NUTRITION_WINDOW_DAYS = 60;

export interface ServerData {
  data: LocalData;
  onboardingComplete: boolean;
}

/** Everything the server holds for the signed-in account, in the shapes the app uses locally. */
export async function fetchServerData(now: number): Promise<ServerData> {
  const from = dateKey(addDays(new Date(now), -NUTRITION_WINDOW_DAYS));
  const to = dateKey(now);
  const [profile, weights, workouts, activities, days, routines, customExercises] =
    await Promise.all([
      apiClient.get<UserProfile>(API_ENDPOINTS.profile.me),
      apiClient.get<WeightEntry[]>(API_ENDPOINTS.profile.weights),
      apiClient.get<WorkoutRecord[]>(API_ENDPOINTS.workouts.history),
      apiClient.get<ActivityRecord[]>(API_ENDPOINTS.activities.list),
      apiClient.get<NutritionDayRecord[]>(API_ENDPOINTS.nutrition.range, { params: { from, to } }),
      apiClient.get<Routine[]>(API_ENDPOINTS.routines.list),
      apiClient.get<Exercise[]>(API_ENDPOINTS.exercises.custom),
    ]);
  return {
    data: {
      profile: profile.data,
      weights: weights.data,
      workouts: workouts.data,
      activities: activities.data,
      nutritionDays: Object.fromEntries(days.data.map((d) => [d.dateKey, d])),
      routines: routines.data,
      customExercises: customExercises.data,
    },
    onboardingComplete: profile.data.onboardingComplete === true,
  };
}
