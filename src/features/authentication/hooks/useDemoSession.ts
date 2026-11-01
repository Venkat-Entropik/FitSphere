import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { startSession } from '../services/session';

export const DEMO_USER_ID = 'demo';

/** Offline demo account (mock mode only): no server involved, sample data on this device. */
export function useDemoSession() {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      startSession(
        {
          user: { id: DEMO_USER_ID, name: 'Demo Athlete', email: '' },
          tokens: { accessToken: 'demo-session', refreshToken: 'demo-session', expiresIn: 0 },
        },
        queryClient,
      ),
    [queryClient],
  );
}
