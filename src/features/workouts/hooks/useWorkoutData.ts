import { useQuery } from '@tanstack/react-query';

import { workoutService } from '../services/workout.service';

export const workoutKeys = {
  categories: ['workouts', 'categories'] as const,
  activeSession: ['workouts', 'active-session'] as const,
};

export function useWorkoutCategories() {
  return useQuery({
    queryKey: workoutKeys.categories,
    queryFn: () => workoutService.getCategories(),
  });
}

/** Template used to start (or resume) the session; live state is in the active-workout store. */
export function useActiveSessionTemplate() {
  return useQuery({
    queryKey: workoutKeys.activeSession,
    queryFn: () => workoutService.getActiveSession(),
    staleTime: Infinity,
  });
}
