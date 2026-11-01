import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme, type ColorToken } from '@/theme';

import type { DailyTelemetry } from '../types/dashboard.types';
import { telemetryRings } from '../utils/telemetry';

const formatCompact = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));

interface MetricRowProps {
  color: ColorToken;
  label: string;
  value: string;
  suffix?: React.ReactNode;
}

function MetricRow({ color, label, value, suffix }: MetricRowProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surfaceLow,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.radius.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          maxWidth: '45%',
        }}
      >
        <View
          style={[
            { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors[color] },
            glow(theme.colors[color], 0.9, 6),
          ]}
        />
        <AppText variant="bodySm" color="onSurfaceVariant">
          {label}
        </AppText>
      </View>
      <AppText style={{ textAlign: 'right', flexShrink: 1 }}>
        <AppText variant="labelUi" weight="semibold" tabular>
          {value}
        </AppText>{' '}
        {suffix}
      </AppText>
    </View>
  );
}

export interface DailyTelemetryCardProps {
  telemetry: DailyTelemetry;
  weeklyTargetDays: number;
}

export function DailyTelemetryCard({ telemetry, weeklyTargetDays }: DailyTelemetryCardProps) {
  const { rings, aggregatePercent } = telemetryRings(telemetry);
  const minutesMet = telemetry.activeMinutes >= telemetry.activeMinutesGoal;

  return (
    <Card style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="monitoring" size={18} color="primary" />
          <AppText variant="labelUi" weight="semibold">
            Daily Telemetry
          </AppText>
        </View>
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          Goal: {weeklyTargetDays} days/wk
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <ProgressRing
          rings={rings}
          size={112}
          inset={5}
          centerValue={String(aggregatePercent)}
          centerUnit="%"
          centerLabel="Aggregated"
          accessibilityLabel={`Daily progress ${aggregatePercent} percent`}
        />
        <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
          <MetricRow
            color="primary"
            label="Steps"
            value={telemetry.steps.toLocaleString('en-US')}
            suffix={
              <AppText variant="labelCaps" color="onSurfaceVariant">
                / {formatCompact(telemetry.stepsGoal)}
              </AppText>
            }
          />
          <MetricRow
            color="secondary"
            label="Active Burn"
            value={String(telemetry.activeBurnKcal)}
            suffix={
              <AppText variant="labelCaps" color="onSurfaceVariant">
                / {telemetry.activeBurnGoalKcal} kcal
              </AppText>
            }
          />
          <MetricRow
            color="tertiary"
            label="Active Min"
            value={String(telemetry.activeMinutes)}
            suffix={
              minutesMet ? (
                <AppText variant="labelCaps" color="primary" weight="bold">
                  ✓ Met
                </AppText>
              ) : (
                <AppText variant="labelCaps" color="onSurfaceVariant">
                  / {telemetry.activeMinutesGoal}
                </AppText>
              )
            }
          />
        </View>
      </View>
    </Card>
  );
}
