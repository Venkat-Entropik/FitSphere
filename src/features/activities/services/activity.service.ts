import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';

import type { ActivityRecord } from '../types/activity.types';

export interface ActivityRepository {
  getHistory(): Promise<ActivityRecord[]>;
  saveActivity(record: ActivityRecord): Promise<ActivityRecord>;
}

const mockRepository: ActivityRepository = {
  getHistory: async () => {
    await dbReady();
    return useMockDb.getState().activities;
  },
  saveActivity: async (record) => {
    await dbReady();
    useMockDb.setState((s) => ({
      activities: [...s.activities.filter((a) => a.id !== record.id), record],
    }));
    return record;
  },
};

const apiRepository: ActivityRepository = {
  getHistory: async () =>
    (await apiClient.get<ActivityRecord[]>(API_ENDPOINTS.activities.list)).data,
  saveActivity: async (record) =>
    (await apiClient.post<ActivityRecord>(API_ENDPOINTS.activities.list, record)).data,
};

export const activityService: ActivityRepository = env.useMocks ? mockRepository : apiRepository;
