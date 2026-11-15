import { dbReady, useMockDb } from '@/services/mock-db/mock-db';
import { commitChange } from '@/services/sync';

import type { ActivityRecord } from '../types/activity.types';

export interface ActivityRepository {
  getHistory(): Promise<ActivityRecord[]>;
  saveActivity(record: ActivityRecord): Promise<ActivityRecord>;
}

/** On-device history; with the real backend a saved activity also queues for the server (works offline). */
export const activityService: ActivityRepository = {
  getHistory: async () => {
    await dbReady();
    return useMockDb.getState().activities;
  },
  saveActivity: async (record) => {
    await commitChange({ type: 'activity.save', record });
    return record;
  },
};
