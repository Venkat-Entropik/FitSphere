import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { notificationService } from '@/services/notifications/notification.service';
import { resetMockDb } from '@/services/mock-db/mock-db';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { usePreferencesStore } from '@/store/preferences.store';

/** Restores the seeded sample data and clears any live workout/recording (mock backend only). */
export function useResetDemoData() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    resetMockDb();
    useActiveWorkoutStore.getState().finish();
    useActivityRecordingStore.getState().discard();
    usePreferencesStore.setState({
      onboardingComplete: false,
      onboardingSkipped: false,
      notificationsEnabled: false,
    });
    await notificationService.disableReminders();
    await queryClient.invalidateQueries();
  }, [queryClient]);
}
