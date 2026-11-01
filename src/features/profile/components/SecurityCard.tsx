import { View } from 'react-native';

import { env } from '@/config/env';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { UnitSystem } from '@/store/preferences.store';

import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

export interface SecurityCardProps {
  units: UnitSystem;
  reminder: {
    enabled: boolean;
    busy: boolean;
    problem: 'denied' | 'unavailable' | null;
    onToggle: (next: boolean) => void;
  };
  onExport: () => void;
  onOpenSettings: () => void;
}

export function SecurityCard({ units, reminder, onExport, onOpenSettings }: SecurityCardProps) {
  return (
    <SettingsSection title="System & Data" icon="shield">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <Icon name="straighten" size={20} color="onSurfaceVariant" />
          <AppText variant="bodyMd" weight="semibold">
            Measurement Units
          </AppText>
        </View>
        <View style={{ width: 150 }}>
          <SegmentedControl
            options={['Metric', 'Imperial'] as const}
            value={units === 'metric' ? 'Metric' : 'Imperial'}
            onChange={() => undefined}
            disabledOptions={['Imperial']}
            accessibilityLabel="Measurement units"
          />
        </View>
      </View>
      <SettingRow
        icon="download"
        title="Export Telemetry"
        subtitle="Workouts, runs & weights as JSON"
        onPress={onExport}
      />
      <SettingRow
        icon="lock"
        title={env.useMocks ? 'On-Device Storage' : 'Account Storage'}
        subtitle={
          env.useMocks
            ? 'Your data is stored on this device only'
            : 'Your data is saved to your FitSphere account'
        }
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
