import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

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

const mockRepository: WorkoutRepository = {
  getCategories: async () => mockWorkoutCategories,
  getActiveSession: async () => buildMockSession(),
  getExercises: async () => EXERCISE_CATALOG,
  getPlans: async () => WORKOUT_PLANS,
  getHistory: async () => {
    await dbReady();
    return useMockDb.getState().workouts;
  },
  saveWorkout: async (record) => {
    await dbReady();
    useMockDb.setState((s) => ({
      workouts: [...s.workouts.filter((w) => w.id !== record.id), record],
    }));
    return record;
  },
};

const apiRepository: WorkoutRepository = {
  getCategories: async () =>
    (await apiClient.get<WorkoutCategory[]>(API_ENDPOINTS.workouts.categories)).data,
  getActiveSession: async () =>
    (await apiClient.get<ActiveSessionTemplate>(API_ENDPOINTS.workouts.active)).data,
  getExercises: async () => (await apiClient.get<Exercise[]>(API_ENDPOINTS.exercises.list)).data,
  getPlans: async () => (await apiClient.get<WorkoutPlan[]>(API_ENDPOINTS.workouts.plans)).data,
  getHistory: async () =>
    (await apiClient.get<WorkoutRecord[]>(API_ENDPOINTS.workouts.history)).data,
  saveWorkout: async (record) =>
    (await apiClient.post<WorkoutRecord>(API_ENDPOINTS.workouts.list, record)).data,
};

export const workoutService: WorkoutRepository = env.useMocks ? mockRepository : apiRepository;
