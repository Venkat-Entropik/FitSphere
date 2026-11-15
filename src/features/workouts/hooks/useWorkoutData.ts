import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { invalidateAfter } from '@/services/api/invalidation';
import { useActiveWorkoutStore } from '@/store/active-workout.store';

import { workoutService } from '../services/workout.service';
import type { Exercise, Routine } from '../types/workout-record.types';
import {
  buildWorkoutRecord,
  filterExercises,
  nextPlan,
  personalBests,
  type ExerciseFilter,
} from '../utils/workout-history.logic';

export const workoutKeys = {
  categories: ['workouts', 'categories'] as const,
  activeSession: ['workouts', 'active-session'] as const,
  exercises: ['workouts', 'exercises'] as const,
  plans: ['workouts', 'plans'] as const,
  history: ['workouts', 'history'] as const,
  routines: ['workouts', 'routines'] as const,
};

export function useWorkoutCategories() {
  return useQuery({
    queryKey: workoutKeys.categories,
    queryFn: () => workoutService.getCategories(),
  });
}

/** Sample mid-session template (demo/testing only; real sessions come from plans). */
export function useActiveSessionTemplate() {
  return useQuery({
    queryKey: workoutKeys.activeSession,
    queryFn: () => workoutService.getActiveSession(),
    staleTime: Infinity,
  });
}

export function useExerciseCatalog() {
  return useQuery({
    queryKey: workoutKeys.exercises,
    queryFn: () => workoutService.getExercises(),
    staleTime: Infinity,
  });
}

/** Exercise library with search / muscle / equipment filtering done client-side. */
export function useExerciseLibrary(filter: ExerciseFilter) {
  const catalog = useExerciseCatalog();
  const { query, muscleGroup, equipment } = filter;
  const filtered = useMemo(
    () => filterExercises(catalog.data ?? [], { query, muscleGroup, equipment }),
    [catalog.data, query, muscleGroup, equipment],
  );
  return { ...catalog, exercises: filtered };
}

export function useWorkoutPlans() {
  return useQuery({
    queryKey: workoutKeys.plans,
    queryFn: () => workoutService.getPlans(),
    staleTime: Infinity,
  });
}

export function useWorkoutHistory() {
  return useQuery({ queryKey: workoutKeys.history, queryFn: () => workoutService.getHistory() });
}

/** Best set per exercise, derived from history. */
export function usePersonalBests() {
  const history = useWorkoutHistory();
  const bests = useMemo(() => personalBests(history.data ?? []), [history.data]);
  return { ...history, bests };
}

/** The built-in plan that follows the one trained last. The rotation skips the user's own routines. */
export function useNextPlan() {
  const plans = useWorkoutPlans();
  const history = useWorkoutHistory();
  return useMemo(() => {
    if (!plans.data || !history.data) return undefined;
    const builtIn = plans.data.filter((p) => p.categoryId !== 'custom');
    return builtIn.length ? nextPlan(history.data, builtIn) : undefined;
  }, [plans.data, history.data]);
}

export function useRoutines() {
  return useQuery({ queryKey: workoutKeys.routines, queryFn: () => workoutService.getRoutines() });
}

export function useSaveRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routine: Routine) => workoutService.saveRoutine(routine),
    onSuccess: () => invalidateAfter(queryClient, 'routine'),
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutService.deleteRoutine(id),
    onSuccess: () => invalidateAfter(queryClient, 'routine'),
  });
}

export function useDeleteCustomExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutService.deleteCustomExercise(id),
    onSuccess: () => invalidateAfter(queryClient, 'routine'),
  });
}

export function useSaveCustomExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exercise: Exercise) => workoutService.saveCustomExercise(exercise),
    onSuccess: () => invalidateAfter(queryClient, 'routine'),
  });
}

/** Saves the finished workout, clears the live session, and refreshes everything derived from it. */
export function useFinishWorkout() {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const catalog = useExerciseCatalog();

  return useMutation({
    mutationFn: async () => {
      const { session } = useActiveWorkoutStore.getState();
      if (!session) throw new Error('There is no workout in progress.');
      const record = buildWorkoutRecord(session, {
        now: Date.now(),
        weightKg: profile.data?.profile.weightKg ?? 70,
        catalog: catalog.data ?? [],
      });
      // Nothing is cleared until the save succeeds, so a failed save never loses the workout.
      return workoutService.saveWorkout(record);
    },
    onSuccess: () => {
      useActiveWorkoutStore.getState().finish();
      void invalidateAfter(queryClient, 'workout');
    },
  });
}
