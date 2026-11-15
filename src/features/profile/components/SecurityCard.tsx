import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { env } from '@/config/env';
import { AppText } from '@/components/ui/AppText';

import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

export interface SecurityCardProps {
  reminder: {
    enabled: boolean;
    busy: boolean;
    problem: 'denied' | 'unavailable' | null;
    onToggle: (next: boolean) => void;
  };
  onExport: () => void;
  onOpenSettings: () => void;
}

export function SecurityCard({ reminder, onExport, onOpenSettings }: SecurityCardProps) {
  const router = useRouter();
  return (
    <SettingsSection title="System & Data" icon="shield">
      <SettingRow
        icon="download"
        title="Export Telemetry"
        subtitle="Workouts, runs & weights as JSON"
        onPress={onExport}
      />
      <SettingRow
        icon="lock"
        title={env.useMocks ? 'On-Device Storage' : 'Account & Offline Storage'}
        subtitle={
          env.useMocks
            ? 'Your data is stored on this device only'
            : 'Saved to your account and kept on this phone for offline use'
        }
      />
      <SettingRow
        icon="policy"
        title="Privacy Policy"
        subtitle="What we collect and how it is used"
        onPress={() => router.navigate('/privacy')}
      />
      <SettingRow
        icon="description"
        title="Terms of Service"
        subtitle="The rules for using FitSphere"
        onPress={() => router.navigate('/terms')}
      />
      <SettingRow
        icon="notifications_active"
        title="Daily Workout Reminder"
        subtitle={reminder.enabled ? 'Scheduled for 08:00 AM daily' : 'Off'}
        toggle={{ value: reminder.enabled, onChange: reminder.onToggle, disabled: reminder.busy }}
      />
      {reminder.problem === 'denied' ? (
        <View style={{ gap: 6 }}>
          <AppText variant="bodySm" color="warning" accessibilityRole="alert">
            Notifications are turned off for FitSphere. Allow them in your device settings to get
            reminders.
          </AppText>
          <SettingRow title="Open settings" icon="settings" onPress={onOpenSettings} />
        </View>
      ) : null}
      {reminder.problem === 'unavailable' ? (
        <AppText variant="bodySm" color="onSurfaceVariant" accessibilityRole="alert">
          Reminders aren&apos;t available on this device.
        </AppText>
      ) : null}
    </SettingsSection>
  );
}
