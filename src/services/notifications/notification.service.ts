import * as Notifications from 'expo-notifications';

export type ReminderResult = 'enabled' | 'denied' | 'unavailable';

const REMINDER_ID = 'fitsphere.workout-reminder';

/** Local (on-device) workout reminders. No push server is involved. */
export const notificationService = {
  /**
   * Asks for permission if needed, then schedules a daily reminder. Returns 'denied' when the user
   * (or the OS) refuses, and 'unavailable' on platforms that can't schedule notifications.
   */
  async enableDailyReminder(hour = 8, minute = 0): Promise<ReminderResult> {
    try {
      let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
      if (!granted && canAskAgain) {
        ({ granted } = await Notifications.requestPermissionsAsync());
      }
      if (!granted) return 'denied';
      await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_ID,
        content: { title: 'Time to train', body: 'Your next session is ready in FitSphere.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
      return 'enabled';
    } catch {
      return 'unavailable';
    }
  },

  async disableReminders(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
    } catch {
      // Nothing was scheduled, or the platform has no scheduler: either way it's off.
    }
  },
};
