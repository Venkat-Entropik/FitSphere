import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { coachService } from '../services/coach.service';
import type { CoachMessage } from '../types/coach.types';

export const coachKeys = {
  overview: ['coach', 'overview'] as const,
  suggestions: ['coach', 'suggestions'] as const,
  messages: ['coach', 'messages'] as const,
};

export function useCoachOverview() {
  return useQuery({ queryKey: coachKeys.overview, queryFn: () => coachService.getOverview() });
}

export function useCoachSuggestions() {
  return useQuery({
    queryKey: coachKeys.suggestions,
    queryFn: () => coachService.getSuggestions(),
  });
}

/** Conversation history lives in the query cache; sending appends to it. */
export function useCoachMessages() {
  return useQuery({
    queryKey: coachKeys.messages,
    queryFn: () => coachService.getHistory(),
    staleTime: Infinity,
  });
}

export function useSendCoachMessage() {
  const queryClient = useQueryClient();
  const append = (message: CoachMessage) =>
    queryClient.setQueryData<CoachMessage[]>(coachKeys.messages, (old = []) => [...old, message]);

  return useMutation({
    mutationFn: (text: string) => coachService.sendMessage(text),
    onMutate: (text) => {
      append({ id: `user-${Date.now()}`, role: 'user', text, createdAt: Date.now() });
    },
    onSuccess: (reply) => append(reply),
    onError: () =>
      append({
        id: `error-${Date.now()}`,
        role: 'assistant',
        createdAt: Date.now(),
        text: "I couldn't reach the coach service. Check your connection and try again.",
      }),
  });
}
