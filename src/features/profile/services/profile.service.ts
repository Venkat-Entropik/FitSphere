import { dbReady, useMockDb } from '@/services/mock-db/mock-db';
import { commitChange } from '@/services/sync';
import { dateKey } from '@/utils/date';

import type {
  OnboardingProfile,
  ProfilePatch,
  UserProfile,
  WeightEntry,
} from '../types/profile.types';
import { applyProfilePatch } from '../utils/profile.logic';

export interface NewWeightInput {
  kg: number;
  bodyFatPercent?: number;
  muscleKg?: number;
}

export class ProfileValidationError extends Error {
  constructor(readonly fieldErrors: Partial<Record<keyof OnboardingProfile, string>>) {
    super(Object.values(fieldErrors)[0] ?? 'Invalid profile');
    this.name = 'ProfileValidationError';
  }
}

export interface ProfileRepository {
  getProfile(): Promise<UserProfile>;
  /** Replaces the body/goal profile (onboarding). */
  saveProfile(profile: OnboardingProfile): Promise<UserProfile>;
  updateProfile(patch: ProfilePatch): Promise<UserProfile>;
  getWeights(): Promise<WeightEntry[]>;
  logWeight(input: NewWeightInput, now?: number): Promise<WeightEntry[]>;
}

/** Checks a change against the current profile before it is recorded, so bad values never get queued. */
async function validated(patch: ProfilePatch, now: number): Promise<void> {
  await dbReady();
  const result = applyProfilePatch(useMockDb.getState().profile, patch, now);
  if (!result.ok) throw new ProfileValidationError(result.errors);
}

/**
 * Reads and writes the on-device database. With the real backend, writes also queue for the server
 * (see `src/services/sync`), so profile edits work offline.
 */
export const profileService: ProfileRepository = {
  getProfile: async () => {
    await dbReady();
    return useMockDb.getState().profile;
  },

  saveProfile: async (profile) => {
    const now = Date.now();
    await validated(profile, now);
    await commitChange({ type: 'profile.save', profile, now });
    return useMockDb.getState().profile;
  },

  updateProfile: async (patch) => {
    const now = Date.now();
    await validated(patch, now);
    await commitChange({ type: 'profile.patch', patch, now });
    return useMockDb.getState().profile;
  },

  getWeights: async () => {
    await dbReady();
    return useMockDb.getState().weights;
  },

  logWeight: async (input, now = Date.now()) => {
    // Current mass follows the newest logged weight; reject impossible values before logging them.
    await validated({ weightKg: input.kg }, now);
    const entry: WeightEntry = { id: `weight-${now}`, dateKey: dateKey(now), ...input };
    await commitChange({ type: 'weight.log', entry, now });
    return useMockDb.getState().weights;
  },
};
