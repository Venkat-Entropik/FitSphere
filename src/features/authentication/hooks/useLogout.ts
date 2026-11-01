import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { notificationService } from '@/services/notifications/notification.service';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

/** Clears credentials, cached server data and scheduled reminders, then leaves the app shell. */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(async () => {
    await useAuthStore.getState().signOut();
    await notificationService.disableReminders();
    usePreferencesStore.getState().setNotificationsEnabled(false);
    queryClient.clear();
    router.replace('/login');
  }, [queryClient, router]);
}
