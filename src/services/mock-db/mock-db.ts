import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { NutritionDayRecord } from '@/features/nutrition/types/nutrition-record.types';
import type { UserProfile, WeightEntry } from '@/features/profile/types/profile.types';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { zustandAsyncStorage } from '@/services/storage/app-storage';

import { buildSeed } from './seed';

export interface MockDbState {
  profile: UserProfile;
  weights: WeightEntry[];
  workouts: WorkoutRecord[];
  activities: ActivityRecord[];
  nutritionDays: Record<string, NutritionDayRecord>;
  /**
   * Whose data this is when the app runs against the real backend (the local copy is a replica of the
   * server). Unset for the offline demo's sample data.
   */
  ownerId?: string | null;
  /** Replaces the whole database (used by tests and "reset sample data"). */
  reset: (seed?: Omit<MockDbState, 'reset'>) => void;
}

/**
 * The app's on-device database. With the offline demo it is seeded with sample data and stands in for
 * the backend. With the real backend it is a local copy of the signed-in user's server data: every screen
 * reads and writes it, so the app works offline, and `src/services/sync` keeps it in step with the server.
 */
export const useMockDb = create<MockDbState>()(
  persist(
    (set) => ({
      ...buildSeed(),
      reset: (seed) => set(seed ?? buildSeed()),
    }),
    {
      name: 'fitsphere.mock-db',
      storage: zustandAsyncStorage,
      version: 1,
      partialize: ({ reset: _reset, ...data }) => data,
    },
  ),
);

let hydration: Promise<void> | null = null;

/** Resolves once persisted data has been loaded, so repositories never read the seed over real data. */
export function dbReady(): Promise<void> {
  if (!hydration) {
    hydration = Promise.resolve(useMockDb.persist.rehydrate()).then(() => undefined);
  }
  return hydration;
}

/** Test helper. */
export function resetMockDb(seed?: Omit<MockDbState, 'reset'>): void {
  hydration = Promise.resolve();
  useMockDb.getState().reset(seed);
}
