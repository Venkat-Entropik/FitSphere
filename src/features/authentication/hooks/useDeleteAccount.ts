import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { env } from '@/config/env';
import { resetMockDb } from '@/services/mock-db/mock-db';
import { emptyLocalData, useOutbox } from '@/services/sync';
import { notificationService } from '@/services/notifications/notification.service';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

import { authService } from '../services/auth.service';

/**
 * Deletes the account on the server (password required), then wipes everything kept on this device:
 * tokens, cached data, live workout/recording, preferences and reminders.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (password: string) => authService.deleteAccount(password),
    onSuccess: async () => {
      // The account is gone, so nothing waiting to sync for it should ever be sent.
      const userId = useAuthStore.getState().user?.id;
      if (userId) useOutbox.getState().clearUser(userId);
      await useAuthStore.getState().signOut();
      await notificationService.disableReminders();
      useActiveWorkoutStore.getState().finish();
      useActivityRecordingStore.getState().discard();
      resetMockDb(env.useMocks ? undefined : emptyLocalData(''));
      usePreferencesStore.setState({
        onboardingComplete: false,
        onboardingSkipped: false,
        notificationsEnabled: false,
        lastUserId: null,
      });
      queryClient.clear();
      router.replace('/login');
    },
  });
}
