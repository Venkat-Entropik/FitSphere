import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { notificationService } from '@/services/notifications/notification.service';
import { secureStorage } from '@/services/storage/secure-storage';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

import { authService } from '../services/auth.service';

/** Revokes the session on the server, then clears credentials, cached data and reminders locally. */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(async () => {
    const tokens = await secureStorage.getTokens();
    await authService.logout(tokens?.refreshToken ?? null);
    await useAuthStore.getState().signOut();
    await notificationService.disableReminders();
    usePreferencesStore.getState().setNotificationsEnabled(false);
    queryClient.clear();
    router.replace('/login');
  }, [queryClient, router]);
}
