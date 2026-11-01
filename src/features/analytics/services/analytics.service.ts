import { env } from '@/config/env';
import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { loadRawRecords } from '@/services/api/raw-records';
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
  getOverview: async (range) => {
    const { profile, workouts, activities, weights, plans } = await loadRawRecords();
    return buildOverview({ range, now: Date.now(), profile, workouts, activities, weights, plans });
  },
};

export const analyticsService: AnalyticsRepository = env.useMocks ? mockRepository : apiRepository;
