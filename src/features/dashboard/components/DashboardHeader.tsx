import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';
import { formatDayLabel, getGreeting } from '@/utils/date';

export interface DashboardHeaderProps {
  athleteName: string;
  goalLabel: string;
  streakDays: number;
  weightKg: number;
  now?: Date;
}

export function DashboardHeader({
  athleteName,
  goalLabel,
  streakDays,
  weightKg,
  now = new Date(),
}: DashboardHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 4, marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            {formatDayLabel(now)}
          </AppText>
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.surfaceHighest,
            }}
          />
          <AppText variant="labelCaps" color="secondary" weight="medium">
            {goalLabel}
          </AppText>
        </View>
        <View
          accessibilityLabel={`${streakDays}-day streak`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <AppText style={{ fontSize: 12 }}>🔥</AppText>
          <AppText variant="labelCaps" color="primary">
            {streakDays}-day streak
          </AppText>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <AppText variant="headlineLgMobile" accessibilityRole="header" style={{ flexShrink: 1 }}>
          {getGreeting(now)}, {athleteName}
        </AppText>
        <AppText variant="labelUi" color="onSurfaceVariant" tabular>
          {weightKg} kg
        </AppText>
      </View>
    </View>
  );
}
