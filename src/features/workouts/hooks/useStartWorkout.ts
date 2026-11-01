import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useActiveWorkoutStore } from '@/store/active-workout.store';

import { workoutService } from '../services/workout.service';
import { workoutKeys } from './useWorkoutData';

/** Starts (or resumes) the active session, then opens the Workouts tab. */
export function useStartWorkout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(async () => {
    if (!useActiveWorkoutStore.getState().session) {
      const template = await queryClient.fetchQuery({
        queryKey: workoutKeys.activeSession,
        queryFn: () => workoutService.getActiveSession(),
        staleTime: Infinity,
      });
      useActiveWorkoutStore.getState().start(template);
    }
    router.navigate('/workouts');
  }, [queryClient, router]);
}
