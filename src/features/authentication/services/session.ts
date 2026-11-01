import type { QueryClient } from '@tanstack/react-query';

import { env } from '@/config/env';
import { profileService } from '@/features/profile/services/profile.service';
import { resetMockDb, useMockDb } from '@/services/mock-db/mock-db';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

import type { AuthSession } from '../types/auth.types';

/**
 * Makes a freshly authenticated session the active one. A *different* user must not inherit the
 * previous user's live workout/recording or cached screens; with the on-device mock backend the mock
 * database is reset too. With the real backend all data is per-account on the server, so the only
 * thing synced here is whether this account has finished onboarding.
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

  if (!env.useMocks) await syncOnboardingFromServer();
}

/** The server profile is the source of truth for onboarding; the local flag is just a cache of it. */
async function syncOnboardingFromServer(): Promise<void> {
  try {
    const { onboardingComplete } = await profileService.getProfile();
    if (onboardingComplete) usePreferencesStore.setState({ onboardingComplete: true });
  } catch {
    // Offline: keep the cached flag. The next sign-in or profile load will reconcile it.
  }
}
