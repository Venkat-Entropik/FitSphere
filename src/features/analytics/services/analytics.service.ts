import { env } from '@/config/env';
import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { AnalyticsOverview, AnalyticsRange } from '../types/analytics.types';
import { buildOverview } from '../utils/analytics.aggregate';

export interface AnalyticsRepository {
  getOverview(range: AnalyticsRange): Promise<AnalyticsOverview>;
}

/** Aggregates whatever is stored in the mock database, as a real backend would from its tables. */
const mockRepository: AnalyticsRepository = {
  getOverview: async (range) => {
    await dbReady();
    const db = useMockDb.getState();
    return buildOverview({
      range,
      now: Date.now(),
      profile: db.profile,
      workouts: db.workouts,
      activities: db.activities,
      weights: db.weights,
      plans: WORKOUT_PLANS,
    });
  },
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
