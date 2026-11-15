import { dbReady, useMockDb } from '@/services/mock-db/mock-db';
import { commitChange } from '@/services/sync';

import type { ActiveSessionTemplate, WorkoutCategory } from '../types/workout.types';
import type { Exercise, WorkoutPlan, WorkoutRecord } from '../types/workout-record.types';
import { EXERCISE_CATALOG, WORKOUT_PLANS } from './catalog.mock';
import { buildMockSession, mockWorkoutCategories } from './workout.mock';

export interface WorkoutRepository {
  getCategories(): Promise<WorkoutCategory[]>;
  /** A sample mid-session template (demo only). */
  getActiveSession(): Promise<ActiveSessionTemplate>;
  getExercises(): Promise<Exercise[]>;
  getPlans(): Promise<WorkoutPlan[]>;
  getHistory(): Promise<WorkoutRecord[]>;
  saveWorkout(record: WorkoutRecord): Promise<WorkoutRecord>;
}

/**
 * Exercises, plans and categories are reference data bundled with the app. History lives in the
 * on-device database; with the real backend a saved workout also queues for the server, so finishing a
 * workout works offline.
 */
export const workoutService: WorkoutRepository = {
  getCategories: async () => mockWorkoutCategories,
  getActiveSession: async () => buildMockSession(),
  getExercises: async () => EXERCISE_CATALOG,
  getPlans: async () => WORKOUT_PLANS,
  getHistory: async () => {
    await dbReady();
    return useMockDb.getState().workouts;
  },
  saveWorkout: async (record) => {
    await commitChange({ type: 'workout.save', record });
    return record;
  },
};
