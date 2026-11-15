import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

function StatTile({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
      style={{
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        gap: 4,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
      }}
    >
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        {/* Long values (a timer past an hour, big volumes) step down a size instead of overflowing. */}
        <AppText
          variant={value.length > 5 ? 'labelUi' : 'headlineMd'}
          weight={value.length > 5 ? 'bold' : undefined}
          color={accent ? 'primary' : 'onSurface'}
          tabular
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {value}
        </AppText>
        {unit ? (
          <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
            {unit}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export interface SessionTelemetryCardProps {
  title: string;
  /** null while the timer is off. */
  elapsed: string | null;
  volume: string;
  setsDone: number;
  setsTotal: number;
  onStartTimer: () => void;
}

export function SessionTelemetryCard({
  title,
  elapsed,
  volume,
  setsDone,
  setsTotal,
  onStartTimer,
}: SessionTelemetryCardProps) {
  const theme = useTheme();
  return (
    <Card tone="low" style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={[
              { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
              glow(theme.colors.primary, 0.8, 5),
            ]}
          />
          <AppText variant="labelCaps" color="primary" uppercase style={{ letterSpacing: 1.6 }}>
            Workout in progress
          </AppText>
        </View>
        <AppText variant="headlineMd" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatTile label="Time" value={elapsed ?? '--:--'} />
        <StatTile label="Volume" value={volume} unit="kg" />
        <StatTile label="Sets" value={`${setsDone}/${setsTotal}`} accent />
      </View>
      {elapsed === null ? (
        <View
          style={{
            gap: 10,
            padding: 12,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="timer" size={18} color="primary" />
            <AppText variant="labelUi" weight="semibold">
              Time this workout?
            </AppText>
          </View>
          <AppText variant="bodySm" color="onSurfaceVariant">
            The timer is off. Start it when you are ready, or just log your sets without one.
          </AppText>
          <Button label="Start timer" onPress={onStartTimer} />
        </View>
      ) : null}
    </Card>
  );
}
