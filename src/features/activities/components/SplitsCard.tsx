import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';

import type { Split } from '../types/activity.types';
import { formatPace } from '../utils/activity.logic';

export interface SplitsCardProps {
  splits: readonly Split[];
}

/** Fastest split is ~full; each extra second per km shortens the bar (Stitch spread: 72%–95%). */
export function splitBarRatio(pace: number, fastest: number): number {
  return pace > 0 ? Math.min(0.95, Math.max(0.2, 0.95 - (pace - fastest) / 70)) : 0;
}

export function SplitsCard({ splits }: SplitsCardProps) {
  const fastest = splits.length ? Math.min(...splits.map((s) => s.paceSecPerKm)) : 0;
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="splitscreen" size={18} color="onSurfaceVariant" />
          <AppText variant="headlineMd" weight="semibold">
            Kilometer Splits
          </AppText>
        </View>
        <AppText variant="labelCaps" color="onSurfaceVariant">
          Pace / km
        </AppText>
      </View>
      {splits.length === 0 ? (
        <AppText variant="bodySm" color="onSurfaceVariant">
          Splits appear after your first kilometre.
        </AppText>
      ) : (
        <View style={{ gap: 10 }}>
          {splits.map((split) => (
            <View key={split.km} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 56, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppText
                  variant="labelCaps"
                  color={split.isFastest ? 'primary' : 'onSurfaceVariant'}
                  weight={split.isFastest ? 'semibold' : 'semibold'}
                >
                  KM {split.km}
                </AppText>
                {split.isFastest ? <Icon name="bolt" size={13} color="primary" /> : null}
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <ProgressBar
                  progress={splitBarRatio(split.paceSecPerKm, fastest)}
                  color={split.isFastest ? 'primary' : 'onSurfaceVariant'}
                  withGlow={split.isFastest}
                />
              </View>
              <AppText
                variant="labelUi"
                color={split.isFastest ? 'primary' : 'onSurface'}
                weight={split.isFastest ? 'bold' : 'medium'}
                tabular
              >
                {formatPace(split.paceSecPerKm)}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
