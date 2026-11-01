import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';
import { dbReady, useMockDb } from '@/services/mock-db/mock-db';
import { dateKey } from '@/utils/date';

import type {
  OnboardingProfile,
  ProfilePatch,
  UserProfile,
  WeightEntry,
} from '../types/profile.types';
import { applyProfilePatch, upsertWeight } from '../utils/profile.logic';

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

async function applyAndStore(patch: ProfilePatch): Promise<UserProfile> {
  await dbReady();
  const db = useMockDb.getState();
  const result = applyProfilePatch(db.profile, patch, Date.now());
  if (!result.ok) throw new ProfileValidationError(result.errors);
  // A changed body weight is a weigh-in: keep the weight log consistent with the profile.
  const changedWeight =
    patch.weightKg !== undefined && patch.weightKg !== db.profile.profile.weightKg;
  const weights = changedWeight
    ? upsertWeight(db.weights, {
        id: `weight-${Date.now()}`,
        dateKey: dateKey(Date.now()),
        kg: patch.weightKg!,
      })
    : db.weights;
  useMockDb.setState({ profile: result.profile, weights });
  return result.profile;
}

const mockRepository: ProfileRepository = {
  getProfile: async () => {
    await dbReady();
    return useMockDb.getState().profile;
  },

  saveProfile: (body) => applyAndStore(body),
  updateProfile: (patch) => applyAndStore(patch),

  getWeights: async () => {
    await dbReady();
    return useMockDb.getState().weights;
  },

  logWeight: async (input, now = Date.now()) => {
    await dbReady();
    const db = useMockDb.getState();
    const entry: WeightEntry = { id: `weight-${now}`, dateKey: dateKey(now), ...input };
    const weights = upsertWeight(db.weights, entry);
    // Current mass follows the newest logged weight.
    const result = applyProfilePatch(db.profile, { weightKg: input.kg }, now);
    useMockDb.setState({ weights, ...(result.ok ? { profile: result.profile } : {}) });
    return weights;
  },
};

const apiRepository: ProfileRepository = {
  getProfile: async () => (await apiClient.get<UserProfile>(API_ENDPOINTS.profile.me)).data,
  saveProfile: async (profile) =>
    (await apiClient.put<UserProfile>(API_ENDPOINTS.profile.me, profile)).data,
  updateProfile: async (patch) =>
    (await apiClient.patch<UserProfile>(API_ENDPOINTS.profile.me, patch)).data,
  getWeights: async () => (await apiClient.get<WeightEntry[]>(API_ENDPOINTS.profile.weights)).data,
  logWeight: async (input) =>
    (await apiClient.post<WeightEntry[]>(API_ENDPOINTS.profile.weights, input)).data,
};

export const profileService: ProfileRepository = env.useMocks ? mockRepository : apiRepository;
