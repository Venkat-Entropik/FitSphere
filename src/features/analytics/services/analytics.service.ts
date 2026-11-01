import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { AnalyticsOverview, AnalyticsRange } from '../types/analytics.types';
import { buildMockOverview } from './analytics.mock';

export interface AnalyticsRepository {
  getOverview(range: AnalyticsRange): Promise<AnalyticsOverview>;
}

const mockRepository: AnalyticsRepository = {
  getOverview: async (range) => buildMockOverview(range),
};

const apiRepository: AnalyticsRepository = {
  getOverview: async (range) =>
    (
      await apiClient.get<AnalyticsOverview>(API_ENDPOINTS.analytics.overview, {
        params: { range },
      })
    ).data,
};

export const analyticsService: AnalyticsRepository = env.useMocks ? mockRepository : apiRepository;
