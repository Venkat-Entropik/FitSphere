import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { SyncChange } from './types';

/** Sends one change to the server. Throws on failure; the engine decides whether to retry. */
export async function sendChange(change: SyncChange): Promise<void> {
  switch (change.type) {
    case 'workout.save':
      await apiClient.post(API_ENDPOINTS.workouts.list, change.record);
      return;
    case 'activity.save':
      await apiClient.post(API_ENDPOINTS.activities.list, change.record);
      return;
    case 'meal.log': {
      const { id, loggedAt, category, title, kcal, protein, carbs, fat } = change.meal;
      await apiClient.post(API_ENDPOINTS.nutrition.logFood, {
        date: change.dateKey,
        id,
        ...(loggedAt !== null && { loggedAt }),
        category,
        title,
        kcal,
        protein,
        carbs,
        fat,
      });
      return;
    }
    case 'meal.remove':
      await apiClient.delete(`${API_ENDPOINTS.nutrition.logFood}/${change.mealId}`, {
        params: { date: change.dateKey },
      });
      return;
    case 'water.add':
      await apiClient.post(API_ENDPOINTS.nutrition.water, {
        date: change.dateKey,
        ml: change.ml,
        id: change.eventId,
      });
      return;
    case 'weight.log': {
      const { id, dateKey, kg, bodyFatPercent, muscleKg } = change.entry;
      await apiClient.post(API_ENDPOINTS.profile.weights, {
        id,
        dateKey,
        kg,
        ...(bodyFatPercent !== undefined && { bodyFatPercent }),
        ...(muscleKg !== undefined && { muscleKg }),
      });
      return;
    }
    case 'profile.save':
      await apiClient.put(API_ENDPOINTS.profile.me, change.profile);
      return;
    case 'profile.patch':
      await apiClient.patch(API_ENDPOINTS.profile.me, change.patch);
      return;
  }
}
