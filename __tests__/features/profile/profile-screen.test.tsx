import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import * as Notifications from 'expo-notifications';

import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { notificationService } from '@/services/notifications/notification.service';
import { profileService } from '@/features/profile/services/profile.service';
import { useMockDb } from '@/services/mock-db/mock-db';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, navigate: jest.fn() }),
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

const notif = Notifications as jest.Mocked<typeof Notifications>;

describe('notificationService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('schedules a daily reminder once permission is granted', async () => {
    notif.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
    notif.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    expect(await notificationService.enableDailyReminder(7, 30)).toBe('enabled');
    expect(notif.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { type: 'daily', hour: 7, minute: 30 } }),
    );
  });

  it('asks for permission when it can, and reports a refusal without scheduling', async () => {
    notif.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
    notif.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);
    expect(await notificationService.enableDailyReminder()).toBe('denied');
    expect(notif.requestPermissionsAsync).toHaveBeenCalled();
    expect(notif.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("doesn't re-prompt when the OS has blocked the permission", async () => {
    notif.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);
    expect(await notificationService.enableDailyReminder()).toBe('denied');
    expect(notif.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("reports 'unavailable' when the platform can't schedule", async () => {
    notif.getPermissionsAsync.mockRejectedValue(new Error('unsupported'));
    expect(await notificationService.enableDailyReminder()).toBe('unavailable');
  });

  it('disabling never throws', async () => {
    notif.cancelScheduledNotificationAsync.mockRejectedValue(new Error('nothing scheduled'));
    await expect(notificationService.disableReminders()).resolves.toBeUndefined();
  });
});

describe('ProfileScreen', () => {
  const renderScreen = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const view = await render(
      <QueryClientProvider client={client}>
        <ProfileScreen />
      </QueryClientProvider>,
    );
    return { client, ...view };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notif.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    usePreferencesStore.setState({
      notificationsEnabled: false,
      autoProgressiveOverload: true,
      restHaptics: true,
    });
  });

  it('renders every section of the design from stored data', async () => {
    await renderScreen();
    expect(await screen.findByText('Profile & Settings')).toBeTruthy();
    expect(screen.getByText('Alex Chen')).toBeTruthy();
    expect(screen.getByText('PRO TIER')).toBeTruthy();
    expect(screen.getByText('13.8%')).toBeTruthy(); // latest body-fat reading
    expect(screen.getByText('Biometric Baseline & Targets')).toBeTruthy();
    expect(screen.getByText('Lean Muscle Gain')).toBeTruthy();
    expect(screen.getByText('+3.5 kg')).toBeTruthy();
    expect(screen.getByText(/Split: Push • Pull • Legs/)).toBeTruthy();
    expect(screen.getByText('Connected Telemetry')).toBeTruthy();
    expect(screen.getByText('Training Preferences')).toBeTruthy();
    expect(screen.getByText('FitSphere Elite AI Member')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log Out of FitSphere' })).toBeTruthy();
  });

  it('labels sensors and membership as sample and keeps their actions inert', async () => {
    await renderScreen();
    await screen.findByText('Connected Telemetry');
    expect(screen.getAllByText('Sample')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Pair New Sensor' }).props.accessibilityState.disabled,
    ).toBe(true);
    expect(screen.getByRole('tab', { name: 'Imperial' }).props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it("shows today's intake against the profile-derived budget", async () => {
    await renderScreen();
    expect(await screen.findByText('920 left')).toBeTruthy(); // 2,600 − 1,680 logged by the seed
    expect(screen.getByText('1,680 logged • 65% met')).toBeTruthy();
    expect(screen.getByText(/140g/)).toBeTruthy();
  });

  it('edits metrics, goal and training days in one save and refreshes the screen', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit profile' }));
    await fireEvent.changeText(await screen.findByLabelText('Weight (kg)'), '80');
    await fireEvent.press(screen.getByRole('button', { name: 'Fat Loss' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fewer training days' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(useMockDb.getState().profile.profile).toMatchObject({
        weightKg: 80,
        goal: 'fat_loss',
        daysPerWeek: 4,
      }),
    );
    expect(await screen.findByText('Fat Loss')).toBeTruthy(); // trajectory label for the new goal
    expect(useMockDb.getState().weights.at(-1)?.kg).toBe(80); // the weight change is also a weigh-in
  });

  it('saves nothing and just closes when nothing changed', async () => {
    const spy = jest.spyOn(profileService, 'updateProfile');
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit profile' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Save changes' }));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('shows the validation message and stores nothing for an invalid value', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit baseline' }));
    await fireEvent.changeText(await screen.findByLabelText('Height (cm)'), '90');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Height must be at least 120 cm')).toBeTruthy();
    expect(useMockDb.getState().profile.profile.heightCm).toBe(175);
  });

  it('rejects non-numeric input before calling the service', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit profile' }));
    await fireEvent.changeText(await screen.findByLabelText('Target (kg)'), 'heavy');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Target must be a number')).toBeTruthy();
    expect(useMockDb.getState().profile.profile.targetKg).toBe(72);
  });

  it('the split row opens the editor', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Primary Split Focus' }));
    expect(await screen.findByText('Training days / week')).toBeTruthy();
  });

  it('toggles the real preferences and disables the not-yet-built ones', async () => {
    await renderScreen();
    await fireEvent(
      await screen.findByLabelText('Auto-Progressive Overload'),
      'valueChange',
      false,
    );
    expect(usePreferencesStore.getState().autoProgressiveOverload).toBe(false);
    await fireEvent(screen.getByLabelText('Rest Timer Haptics'), 'valueChange', false);
    expect(usePreferencesStore.getState().restHaptics).toBe(false);
    expect(
      screen.getByLabelText('Autonomous AI Prompts').props.disabled ??
        screen.getByLabelText('Autonomous AI Prompts').props.accessibilityState?.disabled,
    ).toBeTruthy();
  });

  it('exports the athlete data through the share sheet', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Export telemetry' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    const message = JSON.parse(share.mock.calls[0]![0].message as string);
    expect(message.profile.identity.name).toBe('Alex Chen');
    expect(message.workouts.length).toBeGreaterThan(0);
    share.mockRestore();
  });

  it('turns the reminder on only after permission is granted', async () => {
    notif.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
    await renderScreen();
    await fireEvent(await screen.findByLabelText('Daily Workout Reminder'), 'valueChange', true);
    await waitFor(() => expect(usePreferencesStore.getState().notificationsEnabled).toBe(true));
    expect(notif.scheduleNotificationAsync).toHaveBeenCalled();
    expect(await screen.findByText('Scheduled for 08:00 AM daily')).toBeTruthy();
  });

  it('keeps the reminder off and explains when permission is denied', async () => {
    notif.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);
    await renderScreen();
    await fireEvent(await screen.findByLabelText('Daily Workout Reminder'), 'valueChange', true);
    expect(await screen.findByText(/Notifications are turned off/)).toBeTruthy();
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy();
  });

  it('signs out after confirmation: clears credentials, reminders and caches, then leaves the app', async () => {
    await useAuthStore.getState().signIn({ accessToken: 'a', refreshToken: null });
    usePreferencesStore.setState({ notificationsEnabled: true });
    const { client } = await renderScreen();
    client.setQueryData(['x'], 1);

    await fireEvent.press(await screen.findByRole('button', { name: 'Log Out of FitSphere' }));
    expect(useAuthStore.getState().status).toBe('signedIn'); // needs confirmation first
    await fireEvent.press((await screen.findAllByRole('button', { name: 'Sign out' })).at(-1)!);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(false);
    expect(notif.cancelScheduledNotificationAsync).toHaveBeenCalled();
    expect(client.getQueryData(['x'])).toBeUndefined();
  });

  it('reset demo data restores the sample profile and restarts onboarding', async () => {
    useMockDb.setState((st) => ({
      profile: { ...st.profile, profile: { ...st.profile.profile, weightKg: 91 } },
    }));
    usePreferencesStore.setState({ onboardingComplete: true });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Reset demo data' }));
    await fireEvent.press((await screen.findAllByRole('button', { name: 'Reset' })).at(-1)!);
    await waitFor(() => expect(useMockDb.getState().profile.profile.weightKg).toBe(68.5));
    expect(usePreferencesStore.getState().onboardingComplete).toBe(false);
  });
});
