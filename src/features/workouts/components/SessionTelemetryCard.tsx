import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { glow, useTheme, type ColorToken } from '@/theme';

interface StatTileProps {
  icon: IconName;
  iconColor?: ColorToken;
  label: string;
  children: React.ReactNode;
}

function StatTile({ icon, iconColor = 'onSurfaceVariant', label, children }: StatTileProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <Icon name={icon} size={14} color={iconColor} />
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          {label}
        </AppText>
      </View>
      {children}
    </View>
  );
}

export interface SessionTelemetryCardProps {
  title: string;
  elapsed: string;
  volume: string;
  setsDone: number;
  setsTotal: number;
  heartRateBpm: number | null;
  onOpenSettings: () => void;
}

export function SessionTelemetryCard({
  title,
  elapsed,
  volume,
  setsDone,
  setsTotal,
  heartRateBpm,
  onOpenSettings,
}: SessionTelemetryCardProps) {
  const theme = useTheme();
  return (
    <Card tone="low" style={{ gap: 8, overflow: 'hidden' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={[
                { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
                glow(theme.colors.primary, 0.8, 5),
              ]}
            />
            <AppText variant="labelCaps" color="primary" uppercase style={{ letterSpacing: 1.6 }}>
              Active Session
            </AppText>
          </View>
          <AppText variant="headlineMd" accessibilityRole="header">
            {title}
          </AppText>
        </View>
        <View
          accessibilityRole="button"
          accessibilityLabel="Workout settings"
          onTouchEnd={onOpenSettings}
          style={{
            padding: 8,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Icon name="more_horiz" size={20} color="onSurfaceVariant" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 8 }}>
        <StatTile icon="timer" label="Time">
          <AppText variant="headlineMd" tabular>
            {elapsed}
          </AppText>
        </StatTile>
        <StatTile icon="fitness_center" label="Volume">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <AppText variant="headlineMd" tabular>
              {volume}
            </AppText>
            <AppText variant="labelCaps" color="onSurfaceVariant">
              kg
            </AppText>
          </View>
        </StatTile>
        <StatTile icon="checklist" label="Sets">
          <AppText variant="headlineMd" color="primary" tabular>
            {setsDone}
            <AppText variant="bodySm" color="onSurfaceVariant" weight="regular">
              /{setsTotal}
            </AppText>
          </AppText>
        </StatTile>
        <StatTile icon="favorite" iconColor="error" label="BPM">
          <AppText variant="headlineMd" tabular>
            {heartRateBpm ?? '--'}
          </AppText>
        </StatTile>
      </View>
    </Card>
  );
}
