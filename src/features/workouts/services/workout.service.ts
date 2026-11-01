import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { ActiveSessionTemplate, WorkoutCategory } from '../types/workout.types';
import { buildMockSession, mockWorkoutCategories } from './workout.mock';

export interface WorkoutRepository {
  getCategories(): Promise<WorkoutCategory[]>;
  getActiveSession(): Promise<ActiveSessionTemplate>;
}

const mockRepository: WorkoutRepository = {
  getCategories: async () => mockWorkoutCategories,
  getActiveSession: async () => buildMockSession(),
};

const apiRepository: WorkoutRepository = {
  getCategories: async () =>
    (await apiClient.get<WorkoutCategory[]>(API_ENDPOINTS.workouts.categories)).data,
  getActiveSession: async () =>
    (await apiClient.get<ActiveSessionTemplate>(API_ENDPOINTS.workouts.active)).data,
};

export const workoutService: WorkoutRepository = env.useMocks ? mockRepository : apiRepository;
