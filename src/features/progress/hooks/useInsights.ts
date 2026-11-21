import { useQuery } from '@tanstack/react-query';

import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import { buildInsights, type TrainingInsights } from '../utils/insights.logic';

/** Training trends from the on-device log, so they work offline. Refreshed with the other progress data. */
export function useInsights() {
  return useQuery<TrainingInsights>({
    queryKey: ['progress', 'insights'],
    queryFn: async () => {
      await dbReady();
      const db = useMockDb.getState();
      return buildInsights({
        now: Date.now(),
        workouts: db.workouts,
        activities: db.activities,
        targetDays: db.profile.profile.daysPerWeek,
      });
    },
  });
}
