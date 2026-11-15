import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { useCountUp } from '@/components/motion/useCountUp';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { glow, useTheme, type ColorToken } from '@/theme';

import type { DailyTelemetry } from '../types/dashboard.types';
import { telemetryRings } from '../utils/telemetry';

interface StatTileProps {
  color: ColorToken;
  label: string;
  value: number;
  goal: number;
  unit: string;
}

/** One goal: a coloured dot and name, the number so far against the goal, and a bar that fills as it grows. */
function StatTile({ color, label, value, goal, unit }: StatTileProps) {
  const theme = useTheme();
  const shown = useCountUp(value);
  const met = value >= goal;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value} of ${goal} ${unit}`}
      style={{
        flex: 1,
        gap: 8,
        padding: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={[
            { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors[color] },
            glow(theme.colors[color], 0.9, 6),
          ]}
        />
        <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </AppText>
        {met ? <Icon name="check_circle" size={16} color="primary" /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <AppText variant="metricLg" tabular numberOfLines={1}>
          {shown}
        </AppText>
        <AppText
          variant="bodySm"
          color="onSurfaceVariant"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          / {goal} {unit}
        </AppText>
      </View>
      <ProgressBar progress={goal > 0 ? value / goal : 0} color={color} height={6} />
    </View>
  );
}

export interface DailyTelemetryCardProps {
  telemetry: DailyTelemetry;
  weeklyTargetDays: number;
}

export function DailyTelemetryCard({ telemetry, weeklyTargetDays }: DailyTelemetryCardProps) {
  const theme = useTheme();
  const { rings, aggregatePercent } = telemetryRings(telemetry);
  const percent = useCountUp(aggregatePercent, 1100, 250);

  return (
    <Card style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="monitoring" size={18} color="primary" />
          <AppText variant="labelUi" weight="semibold">
            Today
          </AppText>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant" numberOfLines={1}>
            Goal: {weeklyTargetDays} days a week
          </AppText>
        </View>
      </View>

      <View style={{ alignItems: 'center' }}>
        <ProgressRing
          rings={rings}
          size={150}
          strokeWidth={9}
          ringGap={6}
          inset={4}
          animated
          centerValue={String(percent)}
          centerUnit="%"
          centerLabel="of goal"
          accessibilityLabel={`Daily progress ${aggregatePercent} percent`}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatTile
          color="secondary"
          label="Active burn"
          value={telemetry.activeBurnKcal}
          goal={telemetry.activeBurnGoalKcal}
          unit="kcal"
        />
        <StatTile
          color="tertiary"
          label="Active time"
          value={telemetry.activeMinutes}
          goal={telemetry.activeMinutesGoal}
          unit="min"
        />
      </View>

      {aggregatePercent === 0 ? (
        <AppText variant="bodySm" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
          Log a workout or a run and your rings fill up.
        </AppText>
      ) : null}
    </Card>
  );
}
