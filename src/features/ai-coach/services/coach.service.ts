import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { CoachMessage, CoachOverview, SuggestedPrompt } from '../types/coach.types';
import { buildMockHistory, mockOverview, mockReply, mockSuggestions } from './coach.mock';

/**
 * The only seam the UI knows about. All AI calls go through the FitSphere backend, which holds the
 * model credentials — no API key ever ships in the app. Swap `mockRepository` for `apiRepository`
 * (EXPO_PUBLIC_USE_MOCKS=false) without touching any screen code.
 */
export interface CoachRepository {
  getOverview(): Promise<CoachOverview>;
  getSuggestions(): Promise<SuggestedPrompt[]>;
  getHistory(): Promise<CoachMessage[]>;
  sendMessage(text: string): Promise<CoachMessage>;
}

const MOCK_LATENCY_MS = 900;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const mockRepository: CoachRepository = {
  getOverview: async () => mockOverview,
  getSuggestions: async () => mockSuggestions,
  getHistory: async () => buildMockHistory(),
  sendMessage: async (text) => {
    await delay(MOCK_LATENCY_MS);
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      createdAt: Date.now(),
      ...mockReply(text),
    };
  },
};

const apiRepository: CoachRepository = {
  getOverview: async () => (await apiClient.get<CoachOverview>(API_ENDPOINTS.coach.overview)).data,
  getSuggestions: async () =>
    (await apiClient.get<SuggestedPrompt[]>(API_ENDPOINTS.coach.suggestions)).data,
  getHistory: async () => (await apiClient.get<CoachMessage[]>(API_ENDPOINTS.coach.messages)).data,
  sendMessage: async (text) =>
    (await apiClient.post<CoachMessage>(API_ENDPOINTS.coach.send, { text })).data,
};

export const coachService: CoachRepository = env.useMocks ? mockRepository : apiRepository;
