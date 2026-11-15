import type { QueryClient } from '@tanstack/react-query';

import { env } from '@/config/env';
import { resetMockDb, useMockDb } from '@/services/mock-db/mock-db';
import { emptyLocalData, initialSync } from '@/services/sync';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

import type { AuthSession } from '../types/auth.types';

/**
 * Makes a freshly authenticated session the active one. A *different* user must not inherit the
 * previous user's live workout/recording or cached screens, so those and the on-device database are
 * reset when the account changes. With the real backend the database is then caught up with the
 * account's server data (see `src/services/sync`); a signed-in device keeps working offline from it.
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
    } else {
      // The local copy mirrors the signed-in account; start blank and let the first sync fill it in.
      resetMockDb({ ...emptyLocalData(session.user.name), ownerId: session.user.id });
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

  // Catch this device up with the account (also reads whether onboarding is already done).
  if (!env.useMocks) await initialSync(queryClient);
}
