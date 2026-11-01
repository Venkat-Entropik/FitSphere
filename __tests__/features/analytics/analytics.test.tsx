import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { volumeBars } from '@/features/analytics/components/VolumeCard';
import { AnalyticsScreen } from '@/features/analytics/screens/AnalyticsScreen';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { ANALYTICS_RANGES } from '@/features/analytics/types/analytics.types';
import {
  bucketsFor,
  buildOverview,
  muscleShares,
  volumeBuckets,
  weightedPace,
} from '@/features/analytics/utils/analytics.aggregate';
import {
  bestBucketIndex,
  buildSparkline,
  formatVolumeShort,
  signed,
  totalVolume,
  volumeDeltaPercent,
} from '@/features/analytics/utils/analytics.logic';
import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { buildSeed } from '@/services/mock-db/seed';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';

const NOW = new Date(2026, 10, 4, 12).getTime(); // Wed 4 Nov 2026
const seed = buildSeed(NOW);
const input = (range: (typeof ANALYTICS_RANGES)[number]) => ({
  range,
  now: NOW,
  profile: seed.profile,
  workouts: seed.workouts,
  activities: seed.activities,
  weights: seed.weights,
  plans: WORKOUT_PLANS,
});

const workout = (
  startedAt: number,
  volumeKg: number,
  muscle: 'chest' | 'legs' | 'back',
): WorkoutRecord => ({
  id: `w-${startedAt}`,
  planId: null,
  title: 'x',
  startedAt,
  endedAt: startedAt + 1000,
  durationSec: 1,
  volumeKg,
  setsCompleted: 1,
  prCount: 0,
  kcal: 0,
  exercises: [
    {
      exerciseId: 'e',
      name: 'e',
      muscleGroup: muscle,
      sets: [{ kg: volumeKg, reps: 1, isPersonalRecord: false }],
    },
  ],
  source: 'user',
});

describe('analytics helpers', () => {
  it('totals volume, finds the heaviest bucket and the change vs previous', () => {
    const buckets = [
      { label: 'a', kg: 100 },
      { label: 'b', kg: 300 },
      { label: 'c', kg: 0 },
    ];
    expect(totalVolume(buckets)).toBe(400);
    expect(bestBucketIndex(buckets)).toBe(1);
    expect(bestBucketIndex([{ label: 'a', kg: 0 }])).toBe(-1);
    expect(volumeDeltaPercent(400, 200)).toBe(100);
    expect(volumeDeltaPercent(100, 0)).toBeNull();
  });

  it('formats numbers', () => {
    expect(formatVolumeShort(4200)).toBe('4.2k');
    expect(formatVolumeShort(0)).toBe('Rest');
    expect(signed(0.4)).toBe('+0.4');
    expect(signed(-0.8)).toBe('-0.8');
  });

  it('builds a sparkline within bounds, and none for too little data', () => {
    expect(buildSparkline([1], 100, 40)).toBeNull();
    const out = buildSparkline([69.3, 69, 68.8, 68.5], 300, 40)!;
    expect(out.area.endsWith('Z')).toBe(true);
    const ys = [...out.line.matchAll(/,(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(40);
  });

  it('highlights only the best bar and keeps rest bars small', () => {
    const bars = volumeBars([
      { label: 'M', kg: 4000 },
      { label: 'T', kg: 0 },
      { label: 'W', kg: 8000 },
    ]);
    expect(bars.filter((b) => b.variant === 'solid')).toHaveLength(1);
    expect(bars[2]).toMatchObject({ variant: 'solid', topLabel: '8.0k' });
    expect(bars[1]).toMatchObject({ topLabel: 'Rest', ratio: 0.1 });
  });
});

describe('bucketsFor', () => {
  it('gives each range its own bucket structure', () => {
    const counts = ANALYTICS_RANGES.map((r) => bucketsFor(r, NOW, NOW - 40 * 86_400_000).length);
    expect(counts).toEqual([7, 4, 12, 6, 12, 3]); // ALL: three calendar months of data
    expect(bucketsFor('ALL', NOW, NOW)).toHaveLength(2); // never fewer than two
  });

  it('1W is the last seven calendar days ending today, in order', () => {
    const b = bucketsFor('1W', NOW, NOW);
    expect(b.map((x) => x.label).join('')).toBe('TFSSMTW'); // Thu … Wed
    expect(b.at(-1)!.start).toBe(new Date(2026, 10, 4).getTime());
    for (let i = 1; i < b.length; i++) expect(b[i]!.start).toBe(b[i - 1]!.end);
  });
});

describe('volumeBuckets / muscleShares / weightedPace', () => {
  it('assigns workouts to the right bucket and ignores out-of-range ones', () => {
    const buckets = bucketsFor('1W', NOW, NOW);
    const out = volumeBuckets(
      [
        workout(NOW, 1000, 'chest'),
        workout(NOW - 86_400_000, 500, 'chest'),
        workout(NOW - 30 * 86_400_000, 9999, 'chest'),
      ],
      buckets,
    );
    expect(out.at(-1)!.kg).toBe(1000);
    expect(out.at(-2)!.kg).toBe(500);
    expect(totalVolume(out)).toBe(1500);
  });

  it('shares sum to exactly 100 and reflect volume', () => {
    const shares = muscleShares([
      workout(1, 300, 'chest'),
      workout(2, 100, 'legs'),
      workout(3, 100, 'back'),
    ]);
    expect(shares.reduce((s, m) => s + m.percent, 0)).toBe(100);
    expect(shares.find((m) => m.id === 'chest')!.percent).toBe(60);
    expect(muscleShares([]).every((m) => m.percent === 0)).toBe(true);
    const thirds = muscleShares([
      workout(1, 100, 'chest'),
      workout(2, 100, 'legs'),
      workout(3, 100, 'back'),
    ]);
    expect(thirds.reduce((s, m) => s + m.percent, 0)).toBe(100);
  });

  it('weights pace by distance and returns null with almost no data', () => {
    const a = { distanceKm: 5, movingSec: 1500 } as never;
    const b = { distanceKm: 10, movingSec: 3300 } as never;
    expect(weightedPace([a, b])).toBe(320);
    expect(weightedPace([])).toBeNull();
  });
});

describe('buildOverview (from seeded history)', () => {
  it('derives a coherent overview for every range', () => {
    for (const range of ANALYTICS_RANGES) {
      const o = buildOverview(input(range));
      expect(o.range).toBe(range);
      expect(o.muscles.reduce((s, m) => s + m.percent, 0)).toBe(100);
      expect(o.density.days).toHaveLength(28);
      expect(o.athleteLine).toContain('Alex');
    }
  });

  it('1W volume equals the sum of workouts in the last seven days', () => {
    const o = buildOverview(input('1W'));
    const since = new Date(2026, 10, 4).getTime() - 6 * 86_400_000;
    const expected = seed.workouts
      .filter((w) => w.startedAt >= since && w.startedAt < since + 7 * 86_400_000)
      .reduce((s, w) => s + w.volumeKg, 0);
    expect(totalVolume(o.volume.buckets)).toBe(Math.round(expected));
    expect(o.volume.buckets).toHaveLength(7);
  });

  it('reports the unbroken streak, latest body metrics and weight trend', () => {
    const o = buildOverview(input('3M'));
    expect(o.density.streakDays).toBe(14);
    expect(o.weight.kg).toBe(68.5);
    expect(o.weight.deltaKg).toBeGreaterThan(0);
    expect(o.skeletalMuscle.kg).toBe(34.2);
    expect(o.bodyFat.percent).toBe(13.8);
    expect(o.weight.trend.length).toBeGreaterThanOrEqual(2);
  });

  it('changes when workouts are added', () => {
    const before = buildOverview(input('1W'));
    const after = buildOverview({
      ...input('1W'),
      workouts: [...seed.workouts, workout(NOW, 12_345, 'chest')],
    });
    expect(totalVolume(after.volume.buckets)).toBe(totalVolume(before.volume.buckets) + 12_345);
  });

  it('handles an athlete with no history at all', () => {
    const o = buildOverview({ ...input('1M'), workouts: [], activities: [], weights: [] });
    expect(totalVolume(o.volume.buckets)).toBe(0);
    expect(o.muscles.every((m) => m.percent === 0)).toBe(true);
    expect(o.cardio.avgPaceSecPerKm).toBe(0);
    expect(o.density.streakDays).toBe(0);
    expect(o.weight.trend).toEqual([]);
  });
});

describe('analyticsService + screen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <AnalyticsScreen />
      </QueryClientProvider>,
    );
  };

  it('aggregates the mock database', async () => {
    const o = await analyticsService.getOverview('1M');
    expect(o.volume.buckets).toHaveLength(4);
  });

  it('shows the weekly view and switches range', async () => {
    await renderScreen();
    expect(await screen.findByText('Performance Bio')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '1W' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole('tab', { name: '1M' }));
    expect(await screen.findByText('W4')).toBeTruthy();
  });
});
