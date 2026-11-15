import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { ProgressOverview } from '../types/progress.types';
import { buildProgress } from '../utils/progress.aggregate';

export interface ProgressRepository {
  getOverview(): Promise<ProgressOverview>;
}

/** Computes the screen from the on-device database, so it works offline and loads instantly. */
const localRepository: ProgressRepository = {
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

export const progressService: ProgressRepository = localRepository;
