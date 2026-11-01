import * as Haptics from 'expo-haptics';

/** Success tap. Haptics are a nicety: never let an unsupported platform (web) break the action. */
export function notifySuccess(): void {
  try {
    void Promise.resolve(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)).catch(
      () => undefined,
    );
  } catch {
    // unsupported platform
  }
}
