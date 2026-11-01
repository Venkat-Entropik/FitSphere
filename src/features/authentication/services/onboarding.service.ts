import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { OnboardingDraft, OnboardingProfile } from '../types/onboarding.types';

export interface OnboardingRepository {
  getDraft(): Promise<OnboardingDraft>;
  saveProfile(profile: OnboardingProfile): Promise<void>;
}

/** Sample starting values mirroring the Stitch reference. */
const mockDraft: OnboardingDraft = {
  identity: { name: 'Alex', age: 28 },
  profile: {
    goal: 'muscle',
    sex: 'male',
    heightCm: 175,
    weightKg: 68.5,
    targetKg: 72,
    experience: 'intermediate',
    daysPerWeek: 5,
  },
};

const mockRepository: OnboardingRepository = {
  getDraft: async () => mockDraft,
  saveProfile: async () => undefined,
};

const apiRepository: OnboardingRepository = {
  getDraft: async () => (await apiClient.get<OnboardingDraft>(API_ENDPOINTS.profile.me)).data,
  saveProfile: async (profile) => {
    await apiClient.put(API_ENDPOINTS.profile.me, profile);
  },
};

export const onboardingService: OnboardingRepository = env.useMocks
  ? mockRepository
  : apiRepository;
