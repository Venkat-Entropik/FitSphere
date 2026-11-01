import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { volumeBars } from '@/features/analytics/components/VolumeCard';
import { AnalyticsScreen } from '@/features/analytics/screens/AnalyticsScreen';
import { buildMockOverview } from '@/features/analytics/services/analytics.mock';
import { ANALYTICS_RANGES } from '@/features/analytics/types/analytics.types';
import {
  bestBucketIndex,
  buildSparkline,
  formatVolumeShort,
  signed,
  totalVolume,
  volumeDeltaPercent,
} from '@/features/analytics/utils/analytics.logic';

describe('analytics logic', () => {
  const week = buildMockOverview('1W').volume;

  it('totals volume and finds the heaviest bucket', () => {
    expect(totalVolume(week.buckets)).toBe(28400);
    expect(bestBucketIndex(week.buckets)).toBe(4);
    expect(bestBucketIndex([{ label: 'a', kg: 0 }])).toBe(-1);
  });

  it('computes change vs the previous period', () => {
    expect(volumeDeltaPercent(28400, 26050)).toBe(9);
    expect(volumeDeltaPercent(100, 0)).toBeNull();
    expect(volumeDeltaPercent(80, 100)).toBe(-20);
  });

  it('formats volumes and signed deltas', () => {
    expect(formatVolumeShort(4200)).toBe('4.2k');
    expect(formatVolumeShort(850)).toBe('850');
    expect(formatVolumeShort(0)).toBe('Rest');
    expect(signed(0.4)).toBe('+0.4');
    expect(signed(-0.8)).toBe('-0.8');
    expect(signed(0)).toBe('0');
  });

  it('highlights only the best bar and keeps rest bars small', () => {
    const bars = volumeBars(week.buckets);
    expect(bars[4]).toMatchObject({ variant: 'solid', fill: 'primary', topLabel: '7.4k' });
    expect(bars[2]).toMatchObject({ variant: 'muted', topLabel: 'Rest', ratio: 0.1 });
    expect(bars.filter((b) => b.variant === 'solid')).toHaveLength(1);
  });

  it('builds a sparkline within bounds, and none for too little data', () => {
    expect(buildSparkline([1], 100, 40)).toBeNull();
    const result = buildSparkline([69.3, 69, 68.8, 68.5], 300, 40)!;
    expect(result.line.startsWith('M0.0,')).toBe(true);
    expect(result.area.endsWith('Z')).toBe(true);
    const ys = [...result.line.matchAll(/,(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(40);
  });

  it('produces a different, stable series for every range', () => {
    const lengths = ANALYTICS_RANGES.map((r) => buildMockOverview(r).volume.buckets.length);
    expect(lengths).toEqual([7, 4, 12, 6, 12, 6]);
    expect(buildMockOverview('3M')).toEqual(buildMockOverview('3M'));
  });
});

describe('AnalyticsScreen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <AnalyticsScreen />
      </QueryClientProvider>,
    );
  };

  it('shows the weekly view and switches range', async () => {
    await renderScreen();
    expect(await screen.findByText('Performance Bio')).toBeTruthy();
    expect(screen.getByText(/28,400/)).toBeTruthy();
    expect(screen.getByRole('tab', { name: '1W' }).props.accessibilityState.selected).toBe(true);

    await fireEvent.press(screen.getByRole('tab', { name: '1M' }));
    expect(await screen.findByText('W4')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '1M' }).props.accessibilityState.selected).toBe(true);
  });
});
