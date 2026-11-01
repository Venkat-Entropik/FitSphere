import type { QueryClient } from '@tanstack/react-query';

import { env } from '@/config/env';
import { resetMockDb, useMockDb } from '@/services/mock-db/mock-db';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

import type { AuthSession } from '../types/auth.types';

/**
 * Makes a freshly authenticated session the active one. While data is still served by the on-device
 * mock backend, a *different* user must not inherit the previous user's data, so the mock database,
 * onboarding state and live workout/recording are reset when the account changes.
 */
export async function startSession(session: AuthSession, queryClient: QueryClient): Promise<void> {
  const prefs = usePreferencesStore.getState();
  const changedUser = prefs.lastUserId !== session.user.id;

  if (changedUser) {
    if (env.useMocks) {
      resetMockDb();
      useMockDb.setState((db) => ({
        profile: { ...db.profile, identity: { ...db.profile.identity, name: session.user.name } },
      }));
    }
    useActiveWorkoutStore.getState().finish();
    useActivityRecordingStore.getState().discard();
    usePreferencesStore.setState({
      onboardingComplete: false,
      onboardingSkipped: false,
      notificationsEnabled: false,
      lastUserId: session.user.id,
    });
  }

  queryClient.clear();
  await useAuthStore
    .getState()
    .signIn(
      { accessToken: session.tokens.accessToken, refreshToken: session.tokens.refreshToken },
      session.user,
    );
}
