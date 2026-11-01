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
  /** Replaces the whole database (used by tests and "reset sample data"). */
  reset: (seed?: Omit<MockDbState, 'reset'>) => void;
}

/**
 * Stands in for the backend database while no API exists. The mock repositories read and write it
 * exactly like a real service would, and it persists across app restarts. Real repositories ignore it.
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
