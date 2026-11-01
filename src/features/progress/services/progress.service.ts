import { env } from '@/config/env';
import { loadRawRecords } from '@/services/api/raw-records';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { ProgressOverview } from '../types/progress.types';
import { buildProgress } from '../utils/progress.aggregate';

export interface ProgressRepository {
  getOverview(): Promise<ProgressOverview>;
}

/** Aggregates the mock database the way a real backend would from its tables. */
const mockRepository: ProgressRepository = {
  getOverview: async () => {
    await dbReady();
    const db = useMockDb.getState();
    return buildProgress({
      now: Date.now(),
      profile: db.profile,
      workouts: db.workouts,
      activities: db.activities,
      weights: db.weights,
    });
  },
};

const apiRepository: ProgressRepository = {
  getOverview: async () => {
    const { profile, workouts, activities, weights } = await loadRawRecords();
    return buildProgress({ now: Date.now(), profile, workouts, activities, weights });
  },
};

export const progressService: ProgressRepository = env.useMocks ? mockRepository : apiRepository;
