import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { AnalyticsOverview, AnalyticsRange } from '../types/analytics.types';
import { buildOverview } from '../utils/analytics.aggregate';

export interface AnalyticsRepository {
  getOverview(range: AnalyticsRange): Promise<AnalyticsOverview>;
}

/** Computes the screen from the on-device database, so it works offline and loads instantly. */
const localRepository: AnalyticsRepository = {
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

export const analyticsService: AnalyticsRepository = localRepository;
