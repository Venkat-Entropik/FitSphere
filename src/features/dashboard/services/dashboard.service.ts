import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { DashboardSummary } from '../types/dashboard.types';
import { mockDashboardSummary } from './dashboard.mock';

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>;
}

const mockRepository: DashboardRepository = {
  getSummary: async () => mockDashboardSummary,
};

const apiRepository: DashboardRepository = {
  getSummary: async () =>
    (await apiClient.get<DashboardSummary>(API_ENDPOINTS.dashboard.summary)).data,
};

export const dashboardService: DashboardRepository = env.useMocks ? mockRepository : apiRepository;
