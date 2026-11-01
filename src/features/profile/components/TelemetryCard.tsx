import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

import type { SampleSensor } from '../services/sample-account.mock';
import { SectionChip, SettingsSection } from './SettingsSection';

const LIVE: ReadonlySet<SampleSensor['status']> = new Set(['syncing', 'connected']);

export function TelemetryCard({ sensors }: { sensors: readonly SampleSensor[] }) {
  const theme = useTheme();
  return (
    <SettingsSection
      title="Connected Telemetry"
      icon="sensors"
      trailing={<SectionChip label="Sample" tone="warning" />}
    >
      <View style={{ gap: 8 }}>
        {sensors.map((s) => (
          <View
            key={s.id}
            accessibilityLabel={`${s.name}, ${s.detail}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surfaceLow,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceHigh,
              }}
            >
              <Icon name={s.icon} size={20} color="onSurfaceVariant" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMd" weight="semibold">
                {s.name}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {LIVE.has(s.status) ? (
                  <View
                    style={[
                      {
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: theme.colors.primary,
                      },
                      glow(theme.colors.primary, 0.8, 4),
                    ]}
                  />
                ) : null}
                <AppText
                  variant="bodySm"
                  color={LIVE.has(s.status) ? 'primary' : 'onSurfaceVariant'}
                >
                  {s.detail}
                </AppText>
              </View>
            </View>
            <Icon
              name={s.trailingIcon}
              size={20}
              color={s.status === 'syncing' ? 'onSurface' : 'onSurfaceVariant'}
            />
          </View>
        ))}
      </View>
      <Button
        variant="secondary"
        label="Pair New Sensor"
        onPress={() => undefined}
        disabled
        leftIcon={<Icon name="add" size={18} />}
      />
      <AppText variant="bodySm" color="onSurfaceVariant">
        Device pairing isn&apos;t available yet — these devices are sample data.
      </AppText>
    </SettingsSection>
  );
}
