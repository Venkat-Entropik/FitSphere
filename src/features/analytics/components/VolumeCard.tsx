import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { BarChart, type BarSpec } from '@/components/charts/BarChart';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme, type ColorToken } from '@/theme';

import type { AnalyticsOverview, MuscleShare, VolumeBucket } from '../types/analytics.types';
import {
  bestBucketIndex,
  formatVolumeShort,
  totalVolume,
  volumeDeltaPercent,
} from '../utils/analytics.logic';

/** Rest buckets are small and quiet; the heaviest bucket is lime with a glow. */
export function volumeBars(buckets: readonly VolumeBucket[]): BarSpec[] {
  const max = Math.max(1, ...buckets.map((b) => b.kg));
  const best = bestBucketIndex(buckets);
  return buckets.map((b, i) => ({
    label: b.label,
    topLabel: formatVolumeShort(b.kg),
    ratio: b.kg > 0 ? Math.max(0.1, (b.kg / max) * 0.94) : 0.1,
    variant: i === best ? 'solid' : 'muted',
    fill: i === best ? 'primary' : b.kg > 0 ? 'surfaceHighest' : 'surfaceHigh',
    highlighted: i === best,
  }));
}

function MuscleBar({ muscles }: { muscles: readonly MuscleShare[] }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 12,
        flexDirection: 'row',
        padding: 2,
        gap: 2,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceHighest,
        overflow: 'hidden',
      }}
    >
      {muscles.map((m) => (
        <View
          key={m.id}
          accessibilityLabel={`${m.label} ${m.percent}%`}
          style={{
            width: `${m.percent}%`,
            height: '100%',
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors[m.tone as ColorToken],
          }}
        />
      ))}
    </View>
  );
}

export function VolumeCard({ data }: { data: AnalyticsOverview }) {
  const theme = useTheme();
  const total = totalVolume(data.volume.buckets);
  const delta = volumeDeltaPercent(total, data.volume.previousTotalKg);
  return (
    <Card style={{ gap: 16 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="headlineMd" weight="bold" style={{ flexShrink: 1 }}>
              Volume Progression
            </AppText>
            <Icon name="signal_cellular_alt" size={18} color="primary" />
          </View>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {data.volume.subtitle}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="metricLg" color="primary" tabular style={{ lineHeight: 28 }}>
            {total.toLocaleString('en-US')}{' '}
            <AppText variant="bodySm" color="onSurfaceVariant">
              kg
            </AppText>
          </AppText>
          {delta !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Icon name={delta >= 0 ? 'north_east' : 'south_east'} size={12} color="primary" />
              <AppText variant="labelCaps" color="primary" weight="semibold">
                {' '}
                {delta > 0 ? '+' : ''}
                {delta}% vs prev
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <BarChart
        bars={volumeBars(data.volume.buckets)}
        barAreaHeight={96}
        gap={8}
        accessibilityLabel="Training volume by period"
      />
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Muscle Distribution
          </AppText>
          <AppText variant="labelCaps">{data.muscles.length} Major Zones</AppText>
        </View>
        <MuscleBar muscles={data.muscles} />
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          {data.muscles.map((m) => (
            <View key={m.id} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={[
                  {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors[m.tone as ColorToken],
                  },
                  m.tone === 'primary' && glow(theme.colors.primary, 0.6, 4),
                ]}
              />
              <AppText variant="labelCaps" weight="semibold" style={{ fontSize: 10 }}>
                {m.percent}%
              </AppText>
              <AppText
                variant="labelCaps"
                color="onSurfaceVariant"
                weight="regular"
                style={{ fontSize: 9 }}
              >
                {m.shortLabel}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
