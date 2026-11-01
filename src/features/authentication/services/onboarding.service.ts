import { profileService } from '@/features/profile/services/profile.service';

import type { OnboardingDraft, OnboardingProfile } from '../types/onboarding.types';

/** Onboarding reads and writes the same profile every other feature uses. */
export interface OnboardingRepository {
  getDraft(): Promise<OnboardingDraft>;
  saveProfile(profile: OnboardingProfile): Promise<void>;
}

export const onboardingService: OnboardingRepository = {
  getDraft: async () => {
    const { identity, profile } = await profileService.getProfile();
    return { identity, profile };
  },
  saveProfile: async (profile) => {
    await profileService.saveProfile(profile);
  },
};
