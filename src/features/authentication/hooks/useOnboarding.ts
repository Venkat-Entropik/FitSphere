import { useMutation, useQuery } from '@tanstack/react-query';

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

export function useSaveOnboarding() {
  const complete = usePreferencesStore((s) => s.completeOnboarding);
  return useMutation({
    mutationFn: onboardingService.saveProfile,
    onSuccess: () => complete(),
  });
}
