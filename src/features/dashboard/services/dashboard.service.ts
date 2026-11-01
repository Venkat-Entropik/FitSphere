import { env } from '@/config/env';
import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { loadRawRecords } from '@/services/api/raw-records';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { DashboardSummary } from '../types/dashboard.types';
import { buildDashboard } from '../utils/dashboard.aggregate';

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>;
}

/** Aggregates the mock database the way a real backend would from its tables. */
const mockRepository: DashboardRepository = {
  getSummary: async () => {
    await dbReady();
    const db = useMockDb.getState();
    return buildDashboard({
      now: Date.now(),
      profile: db.profile,
      workouts: db.workouts,
      activities: db.activities,
      plans: WORKOUT_PLANS,
    });
  },
};

const apiRepository: DashboardRepository = {
  getSummary: async () => {
    const { profile, workouts, activities, plans } = await loadRawRecords();
    return buildDashboard({ now: Date.now(), profile, workouts, activities, plans });
  },
};

export const dashboardService: DashboardRepository = env.useMocks ? mockRepository : apiRepository;
