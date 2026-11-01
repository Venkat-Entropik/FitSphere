import { useCallback, useState } from 'react';

import {
  notificationService,
  type ReminderResult,
} from '@/services/notifications/notification.service';
import { usePreferencesStore } from '@/store/preferences.store';

/** Workout-reminder toggle: only turns on once the OS has actually granted permission. */
export function useReminderSetting() {
  const enabled = usePreferencesStore((s) => s.notificationsEnabled);
  const setEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);
  const [problem, setProblem] = useState<Exclude<ReminderResult, 'enabled'> | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(
    async (next: boolean) => {
      setProblem(null);
      if (!next) {
        await notificationService.disableReminders();
        setEnabled(false);
        return;
      }
      setBusy(true);
      const result = await notificationService.enableDailyReminder();
      setBusy(false);
      if (result === 'enabled') setEnabled(true);
      else {
        setEnabled(false);
        setProblem(result);
      }
    },
    [setEnabled],
  );

  return { enabled, busy, problem, toggle };
}
