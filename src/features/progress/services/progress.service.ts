import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { ProgressOverview } from '../types/progress.types';
import { mockProgress } from './progress.mock';

export interface ProgressRepository {
  getOverview(): Promise<ProgressOverview>;
}

const mockRepository: ProgressRepository = { getOverview: async () => mockProgress };

const apiRepository: ProgressRepository = {
  getOverview: async () =>
    (await apiClient.get<ProgressOverview>(API_ENDPOINTS.progress.overview)).data,
};

export const progressService: ProgressRepository = env.useMocks ? mockRepository : apiRepository;
