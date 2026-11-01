import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invalidateAfter } from '@/services/api/invalidation';

import { profileService, type NewWeightInput } from '../services/profile.service';
import type { ProfilePatch } from '../types/profile.types';
import { nutritionTargets } from '../utils/profile.logic';

export const profileKeys = {
  profile: ['profile', 'me'] as const,
  weights: ['profile', 'weights'] as const,
};

export function useProfile() {
  return useQuery({ queryKey: profileKeys.profile, queryFn: () => profileService.getProfile() });
}

/** Daily targets derived from the current profile. */
export function useNutritionTargets() {
  return useQuery({
    queryKey: profileKeys.profile,
    queryFn: () => profileService.getProfile(),
    select: (p) => nutritionTargets(p.profile, p.identity.age),
  });
}

export function useWeights() {
  return useQuery({ queryKey: profileKeys.weights, queryFn: () => profileService.getWeights() });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => profileService.updateProfile(patch),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.profile, profile);
      void invalidateAfter(queryClient, 'profile');
    },
  });
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWeightInput) => profileService.logWeight(input),
    onSuccess: (weights) => {
      queryClient.setQueryData(profileKeys.weights, weights);
      void invalidateAfter(queryClient, 'weight');
    },
  });
}
