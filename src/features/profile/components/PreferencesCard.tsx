import { View } from 'react-native';

import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

export interface PreferencesCardProps {
  splitSubtitle: string;
  onEditSplit: () => void;
  autoOverload: { value: boolean; onChange: (next: boolean) => void };
  restHaptics: { value: boolean; onChange: (next: boolean) => void };
}

export function PreferencesCard({
  splitSubtitle,
  onEditSplit,
  autoOverload,
  restHaptics,
}: PreferencesCardProps) {
  return (
    <SettingsSection title="Training Preferences" icon="tune">
      <View style={{ gap: 4 }}>
        <SettingRow title="Primary Split Focus" subtitle={splitSubtitle} onPress={onEditSplit} />
        <SettingRow
          title="Auto-Progressive Overload"
          subtitle="Raise loads when every set hits the top of the rep range"
          toggle={autoOverload}
        />
        <SettingRow
          title="Autonomous AI Prompts"
          subtitle="Form correction & intra-set cues · Coming soon"
          toggle={{ value: false, onChange: () => undefined, disabled: true }}
          unavailable
        />
        <SettingRow
          title="Audio Pacer & Interval Cues"
          subtitle="Cadence clicks and rest transitions · Coming soon"
          toggle={{ value: false, onChange: () => undefined, disabled: true }}
          unavailable
        />
        <SettingRow
          title="Rest Timer Haptics"
          subtitle="A tap each time you log a set"
          toggle={restHaptics}
        />
      </View>
    </SettingsSection>
  );
}
