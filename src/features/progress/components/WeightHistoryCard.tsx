import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { WeightLineChart } from '@/components/charts/WeightLineChart';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { WeightEntry } from '@/features/profile/types/profile.types';
import { useTheme } from '@/theme';

import {
  buildWeightHistory,
  shortDate,
  WEIGHT_RANGES,
  type WeightRange,
} from '../utils/weight-history.logic';

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        gap: 2,
        padding: 10,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLow,
      }}
    >
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="labelUi" weight="bold" tabular numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const deltaText = (d: number | null) =>
  d === null ? 'First entry' : d === 0 ? 'No change' : `${d > 0 ? '+' : ''}${d} kg`;

/** Every weigh-in over time: the trend line, how regularly you log, and the latest readings. */
export function WeightHistoryCard({
  weights,
  now,
}: {
  weights: readonly WeightEntry[];
  now?: number;
}) {
  const theme = useTheme();
  const [range, setRange] = useState<WeightRange>('30D');
  const [mountedAt] = useState(() => Date.now());
  const h = buildWeightHistory(weights, now ?? mountedAt, range);

  return (
    <View style={{ gap: 12 }}>
      <AppText variant="headlineMd" accessibilityRole="header">
        Weight history
      </AppText>
      <Card style={{ gap: 16 }}>
        <SegmentedControl
          options={WEIGHT_RANGES}
          value={range}
          onChange={setRange}
          accessibilityLabel="Weight history range"
          trackColor="surfaceLowest"
        />

        {h.points.length > 0 ? (
          <>
            <WeightLineChart
              points={h.points.map((p) => ({ x: p.day, y: p.kg }))}
              startLabel={shortDate(h.points[0]!.dateKey)}
              endLabel={shortDate(h.points.at(-1)!.dateKey)}
              accessibilityLabel={`Weight over ${range === 'All' ? 'all time' : range}`}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Stat label="Average" value={`${h.average} kg`} />
              <Stat label="Lowest" value={`${h.min} kg`} />
              <Stat label="Highest" value={`${h.max} kg`} />
            </View>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {h.changeKg === null
                ? 'Log on another day to see how your weight is moving.'
                : h.changeKg === 0
                  ? 'Your weight is unchanged over this period.'
                  : `Your weight is ${h.changeKg > 0 ? 'up' : 'down'} ${Math.abs(h.changeKg)} kg over this period.`}{' '}
              Daily weight bounces with water and food, so watch the trend, not a single day.
            </AppText>
          </>
        ) : (
          <AppText variant="bodySm" color="onSurfaceVariant">
            No weigh-ins in this period yet. Tap Log Weigh-in to add today&apos;s weight.
          </AppText>
        )}

        <View
          style={{
            gap: 10,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: theme.colors.surfaceHigh,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="event_available" size={16} color="primary" />
            <AppText variant="labelUi" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
              Logged {h.loggedDays} of the last 30 days
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant" tabular>
              {h.frequencyPercent}%
            </AppText>
          </View>
          <ProgressBar
            progress={h.frequencyPercent / 100}
            height={8}
            accessibilityLabel={`Weighed in on ${h.loggedDays} of the last 30 days`}
          />
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {h.last30.map((on, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 18,
                  borderRadius: 3,
                  backgroundColor: on ? theme.colors.primary : theme.colors.surfaceHigh,
                  opacity: on ? 1 : 0.7,
                }}
              />
            ))}
          </View>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {h.streak > 0 ? `${h.streak}-day logging streak. ` : 'No current logging streak. '}
            Weighing in at the same time each day, such as after waking, gives the cleanest trend.
          </AppText>
        </View>

        {h.recent.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Recent weigh-ins
            </AppText>
            {h.recent.map((row) => (
              <View
                key={row.dateKey}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  paddingVertical: 4,
                }}
              >
                <AppText
                  variant="bodyMd"
                  color="onSurfaceVariant"
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {shortDate(row.dateKey, true)}
                </AppText>
                <AppText variant="bodySm" color="onSurfaceVariant" tabular numberOfLines={1}>
                  {deltaText(row.deltaKg)}
                </AppText>
                <AppText
                  variant="labelUi"
                  weight="semibold"
                  tabular
                  style={{ minWidth: 64, textAlign: 'right' }}
                >
                  {row.kg} kg
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
