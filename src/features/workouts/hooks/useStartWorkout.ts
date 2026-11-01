import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { usePreferencesStore } from '@/store/preferences.store';

import { workoutService } from '../services/workout.service';
import { buildSessionFromPlan, nextPlan } from '../utils/workout-history.logic';
import { workoutKeys } from './useWorkoutData';

/**
 * Starts a workout from a plan (or the next plan in the rotation), with loads and rep targets from
 * the athlete's history, then opens the Workouts tab. An existing session is resumed, never replaced.
 */
export function useStartWorkout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(
    async (planId?: string) => {
      if (!useActiveWorkoutStore.getState().session) {
        const [plans, catalog, history] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: workoutKeys.plans,
            queryFn: () => workoutService.getPlans(),
          }),
          queryClient.fetchQuery({
            queryKey: workoutKeys.exercises,
            queryFn: () => workoutService.getExercises(),
          }),
          queryClient.fetchQuery({
            queryKey: workoutKeys.history,
            queryFn: () => workoutService.getHistory(),
            staleTime: 0,
          }),
        ]);
        const plan = plans.find((p) => p.id === planId) ?? nextPlan(history, plans);
        useActiveWorkoutStore.getState().start(
          buildSessionFromPlan(plan, catalog, history, Date.now(), {
            autoOverload: usePreferencesStore.getState().autoProgressiveOverload,
          }),
        );
      }
      router.navigate('/workouts');
    },
    [queryClient, router],
  );
}
