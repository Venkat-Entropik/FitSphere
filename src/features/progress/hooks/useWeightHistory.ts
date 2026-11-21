import { useQuery } from '@tanstack/react-query';

import type { WeightEntry } from '@/features/profile/types/profile.types';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

/** Every logged weigh-in, from the on-device log. Refreshed with the other progress data. */
export function useWeightEntries() {
  return useQuery<WeightEntry[]>({
    queryKey: ['progress', 'weights'],
    queryFn: async () => {
      await dbReady();
      return useMockDb.getState().weights;
    },
  });
}
