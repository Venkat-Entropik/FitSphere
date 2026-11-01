import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/theme';
import { formatPace } from '@/features/activities/utils/activity.logic';

import type { AnalyticsOverview } from '../types/analytics.types';

export function CardioCard({ cardio }: { cardio: AnalyticsOverview['cardio'] }) {
  const theme = useTheme();
  const goalRatio = cardio.monthlyGoalKm > 0 ? cardio.monthlyKm / cardio.monthlyGoalKm : 0;
  const faster = cardio.paceDeltaSec <= 0;
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              padding: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surfaceHigh,
            }}
          >
            <Icon name="directions_run" size={18} color="secondary" />
          </View>
          <View>
            <AppText variant="headlineMd" weight="bold" style={{ lineHeight: 24 }}>
              Cardio Efficiency
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              Zone 2 Aerobic Conditioning
            </AppText>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(123, 208, 255, 0.1)',
          }}
        >
          <AppText variant="labelCaps" color="secondary" weight="semibold">
            Optimal
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, paddingTop: 8 }}>
        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceLow,
          }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Avg Pace Trend
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <AppText variant="metricLg" weight="extrabold" tabular>
              {formatPace(cardio.avgPaceSecPerKm)}
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              /km
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 }}>
            <Icon name="speed" size={12} color="primary" />
            <AppText variant="labelCaps" color="primary" weight="semibold">
              {Math.abs(cardio.paceDeltaSec)}s {faster ? 'faster' : 'slower'} vs avg
            </AppText>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceLow,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Monthly Goal
            </AppText>
            <AppText variant="labelCaps" weight="bold">
              {Math.round(goalRatio * 100)}%
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <AppText variant="metricLg" weight="extrabold" tabular>
              {cardio.monthlyKm}
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              / {cardio.monthlyGoalKm} km
            </AppText>
          </View>
          <View style={{ marginTop: 8 }}>
            <ProgressBar progress={goalRatio} color="secondary" height={6} />
          </View>
        </View>
      </View>
    </Card>
  );
}
