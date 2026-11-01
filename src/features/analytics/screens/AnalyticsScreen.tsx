import { useState } from 'react';
import { Share } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

import { ActivityDensityCard } from '../components/ActivityDensityCard';
import { AnalyticsHeader } from '../components/AnalyticsHeader';
import { BodySignals } from '../components/BodySignals';
import { CardioCard } from '../components/CardioCard';
import { DeepDiveCard } from '../components/DeepDiveCard';
import { SynthesisCard } from '../components/SynthesisCard';
import { VolumeCard } from '../components/VolumeCard';
import { useAnalytics } from '../hooks/useAnalytics';
import { ANALYTICS_RANGES, type AnalyticsRange } from '../types/analytics.types';
import { shareSummary, signed, totalVolume } from '../utils/analytics.logic';

export function AnalyticsScreen() {
  const [range, setRange] = useState<AnalyticsRange>('1W');
  const { data, isPending, error, refetch } = useAnalytics(range);

  if (isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading analytics" />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const exportReport = () =>
    void Share.share({
      message: shareSummary(data.athleteLine, range, [
        `Body weight: ${data.weight.kg} kg (${signed(data.weight.deltaKg)} kg)`,
        `Body fat: ${data.bodyFat.percent}%`,
        `Training volume: ${totalVolume(data.volume.buckets).toLocaleString('en-US')} kg`,
        `Day streak: ${data.density.streakDays}`,
      ]),
    }).catch(() => undefined);

  return (
    <Screen scroll>
      <AnalyticsHeader athleteLine={data.athleteLine} onExport={exportReport} />
      <SegmentedControl
        options={ANALYTICS_RANGES}
        value={range}
        onChange={setRange}
        accessibilityLabel="Time range"
      />
      <SynthesisCard synthesis={data.synthesis} />
      <BodySignals data={data} />
      <VolumeCard data={data} />
      <CardioCard cardio={data.cardio} />
      <ActivityDensityCard density={data.density} />
      <DeepDiveCard benchmark={data.nextBenchmark} />
    </Screen>
  );
}
