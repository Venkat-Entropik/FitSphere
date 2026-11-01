import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/hooks/useProfile';
import { invalidateAfter } from '@/services/api/invalidation';
import { usePreferencesStore } from '@/store/preferences.store';

import { onboardingService } from '../services/onboarding.service';

export const onboardingKeys = { draft: ['onboarding', 'draft'] as const };

export function useOnboardingDraft() {
  return useQuery({
    queryKey: onboardingKeys.draft,
    queryFn: () => onboardingService.getDraft(),
    staleTime: Infinity,
  });
}

/** Saves the profile, marks onboarding done, and refreshes everything derived from the profile. */
export function useSaveOnboarding() {
  const queryClient = useQueryClient();
  const complete = usePreferencesStore((s) => s.completeOnboarding);
  return useMutation({
    mutationFn: onboardingService.saveProfile,
    onSuccess: async () => {
      complete();
      await queryClient.invalidateQueries({ queryKey: profileKeys.profile });
      await invalidateAfter(queryClient, 'profile');
    },
  });
}
