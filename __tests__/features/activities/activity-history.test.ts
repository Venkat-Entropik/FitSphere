import { activityService } from '@/features/activities/services/activity.service';
import { sampleActivity } from '@/features/activities/services/activity.mock';
import type { ActivityRecord } from '@/features/activities/types/activity.types';
import {
  activityBests,
  activityTotals,
  downsampleRoute,
  isWorthSaving,
  thisWeekTotals,
  toActivityRecord,
} from '@/features/activities/utils/activity-history.logic';
import { useMockDb } from '@/services/mock-db/mock-db';

const NOW = new Date(2026, 10, 4, 12).getTime(); // Wed
const rec = (over: Partial<ActivityRecord>): ActivityRecord => ({
  id: 'a',
  kind: 'run',
  title: 'Run',
  startedAt: NOW,
  endedAt: NOW + 1_800_000,
  distanceKm: 5,
  durationSec: 1500,
  movingSec: 1490,
  avgPaceSecPerKm: 298,
  kcal: 360,
  elevationGainM: 40,
  splits: [],
  route: [],
  source: 'user',
  ...over,
});

describe('downsampleRoute', () => {
  const route = Array.from({ length: 1000 }, (_, i) => ({ lat: i, lng: -i }));
  it('caps length and keeps both endpoints', () => {
    const out = downsampleRoute(route, 200);
    expect(out).toHaveLength(200);
    expect(out[0]).toEqual(route[0]);
    expect(out.at(-1)).toEqual(route.at(-1));
  });
  it('returns short routes unchanged', () => {
    expect(downsampleRoute(route.slice(0, 5), 200)).toHaveLength(5);
  });
});

describe('toActivityRecord / isWorthSaving', () => {
  it('maps a snapshot to a stored user record', () => {
    const r = toActivityRecord(
      { ...sampleActivity, isDemo: false },
      { id: 'x', startedAt: 1, endedAt: 2 },
    );
    expect(r).toMatchObject({
      id: 'x',
      source: 'user',
      distanceKm: 6.42,
      durationSec: 1905,
      kcal: 420,
    });
  });

  it('discards accidental starts but keeps real ones', () => {
    expect(isWorthSaving({ kind: 'run', distanceKm: 0, durationSec: 600 })).toBe(false);
    expect(isWorthSaving({ kind: 'run', distanceKm: 1, durationSec: 10 })).toBe(false);
    expect(isWorthSaving({ kind: 'run', distanceKm: 1, durationSec: 400 })).toBe(true);
    expect(isWorthSaving({ kind: 'hiit', distanceKm: 0, durationSec: 600 })).toBe(true);
  });
});

describe('totals and bests', () => {
  const week = new Date(2026, 10, 2).getTime(); // Monday of the current week
  const records = [
    rec({ id: '1', startedAt: week + 3_600_000, distanceKm: 5, kcal: 300 }),
    rec({ id: '2', startedAt: week + 90_000_000, distanceKm: 8.4, kcal: 500 }),
    rec({ id: '3', startedAt: week - 86_400_000, distanceKm: 10, kcal: 700 }), // last Sunday
  ];

  it('sums only this calendar week (Monday start)', () => {
    expect(thisWeekTotals(records, NOW)).toEqual({
      count: 2,
      distanceKm: 13.4,
      durationSec: 3000,
      kcal: 800,
    });
    expect(activityTotals(records, 0).count).toBe(3);
  });

  it('finds bests, ignoring tiny runs for pace and handling empty history', () => {
    const bests = activityBests([
      rec({
        distanceKm: 6,
        avgPaceSecPerKm: 300,
        elevationGainM: 80,
        splits: [{ km: 1, paceSecPerKm: 290, isFastest: true }],
      }),
      rec({ id: 'b', distanceKm: 0.4, avgPaceSecPerKm: 200 }),
      rec({ id: 'c', distanceKm: 12, avgPaceSecPerKm: 310, elevationGainM: 20 }),
    ]);
    expect(bests).toEqual({
      longestKm: 12,
      fastestAvgPace: 300,
      fastestSplit: 290,
      mostElevationM: 80,
    });
    expect(activityBests([])).toEqual({
      longestKm: null,
      fastestAvgPace: null,
      fastestSplit: null,
      mostElevationM: null,
    });
  });
});

describe('activityService (mock database)', () => {
  it('saves a record and returns it in history, replacing by id', async () => {
    const before = (await activityService.getHistory()).length;
    await activityService.saveActivity(rec({ id: 'new-1', distanceKm: 7 }));
    await activityService.saveActivity(rec({ id: 'new-1', distanceKm: 7.5 }));
    const history = await activityService.getHistory();
    expect(history).toHaveLength(before + 1);
    expect(useMockDb.getState().activities.find((a) => a.id === 'new-1')?.distanceKm).toBe(7.5);
  });
});
