import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { DashboardSummary } from '../types/dashboard.types';
import { buildDashboard } from '../utils/dashboard.aggregate';

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>;
}

/** Computes the screen from the on-device database, so it works offline and loads instantly. */
const localRepository: DashboardRepository = {
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

export const dashboardService: DashboardRepository = localRepository;
