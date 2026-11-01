import type { GpsPoint } from '@/features/activities/types/activity.types';
import {
  buildSnapshot,
  computeSplits,
  currentPaceSecPerKm,
  distanceKm,
  elevationStats,
  estimateKcal,
  formatDuration,
  formatPace,
  gpsQuality,
  haversineMeters,
  movingSeconds,
  pacerCue,
  projectRoute,
} from '@/features/activities/utils/activity.logic';

/** ~111.2 m per 0.001° of latitude. Builds a straight northbound track at a constant speed. */
function track(opts: {
  meters: number;
  secPerKm: number;
  stepM?: number;
  accuracy?: number;
  altitudeGain?: number;
}): GpsPoint[] {
  const stepM = opts.stepM ?? 10;
  const steps = Math.round(opts.meters / stepM);
  const secPerStep = (opts.secPerKm * stepM) / 1000;
  return Array.from({ length: steps + 1 }, (_, i) => ({
    lat: 37 + (i * stepM) / 111_195,
    lng: -122,
    altitude: opts.altitudeGain ? (i / steps) * opts.altitudeGain : 10,
    accuracy: opts.accuracy ?? 5,
    timestamp: 1_000_000 + i * secPerStep * 1000,
  }));
}

describe('distance and moving time', () => {
  it('haversine matches a known distance (0.01° latitude ≈ 1.112 km)', () => {
    expect(haversineMeters({ lat: 0, lng: 0 }, { lat: 0.01, lng: 0 })).toBeCloseTo(1111.95, 0);
  });

  it('sums a track', () => {
    expect(distanceKm(track({ meters: 2000, secPerKm: 300 }))).toBeCloseTo(2, 2);
  });

  it('ignores low-accuracy fixes and impossible GPS jumps', () => {
    const noisy = track({ meters: 1000, secPerKm: 300, accuracy: 120 });
    expect(distanceKm(noisy)).toBe(0);
    const jump: GpsPoint[] = [
      { lat: 37, lng: -122, altitude: 0, accuracy: 5, timestamp: 0 },
      { lat: 37.5, lng: -122, altitude: 0, accuracy: 5, timestamp: 1000 },
    ];
    expect(distanceKm(jump)).toBe(0);
  });

  it('does not count standing still as moving time', () => {
    const still: GpsPoint[] = [0, 1, 2, 3].map((i) => ({
      lat: 37,
      lng: -122,
      altitude: 0,
      accuracy: 5,
      timestamp: i * 1000,
    }));
    expect(movingSeconds(still)).toBe(0);
    expect(movingSeconds(track({ meters: 500, secPerKm: 300 }))).toBeCloseTo(150, 0);
  });
});

describe('pace and splits', () => {
  it('computes current pace from the recent window', () => {
    const pace = currentPaceSecPerKm(track({ meters: 500, secPerKm: 288 }));
    expect(pace).toBeCloseTo(288, 0);
  });

  it('returns null pace with too little data', () => {
    expect(currentPaceSecPerKm(track({ meters: 10, secPerKm: 300, stepM: 5 }))).toBeNull();
  });

  it('produces one split per completed km and flags the fastest', () => {
    const slow = track({ meters: 1010, secPerKm: 320 });
    const fast = track({ meters: 1000, secPerKm: 280 }).map((p, i, arr) => ({
      ...p,
      lat: p.lat + 1010 / 111_195 + 0 * i * arr.length,
      timestamp: slow[slow.length - 1]!.timestamp + (p.timestamp - arr[0]!.timestamp),
    }));
    const splits = computeSplits([...slow, ...fast]);
    expect(splits).toHaveLength(2);
    expect(splits[0]!.paceSecPerKm).toBeCloseTo(320, 0);
    // km 2 = 10 m at 320 s/km then 990 m at 280 s/km
    expect(splits[1]!.paceSecPerKm).toBeCloseTo(280.4, 0);
    expect(splits.map((s) => s.isFastest)).toEqual([false, true]);
  });

  it('adds no split before a full kilometre', () => {
    expect(computeSplits(track({ meters: 900, secPerKm: 300 }))).toEqual([]);
  });
});

describe('elevation, quality, energy', () => {
  it('totals ascent and steepest grade', () => {
    const stats = elevationStats(track({ meters: 1000, secPerKm: 300, altitudeGain: 50 }));
    expect(stats.gainM).toBeGreaterThanOrEqual(48);
    expect(stats.gainM).toBeLessThanOrEqual(50);
    expect(stats.maxGradePct).toBeCloseTo(5, 0);
  });

  it('classifies GPS quality from the latest accuracy', () => {
    expect(gpsQuality([])).toBe('none');
    expect(gpsQuality(track({ meters: 20, secPerKm: 300, accuracy: 6 }))).toBe('high');
    expect(gpsQuality(track({ meters: 20, secPerKm: 300, accuracy: 25 }))).toBe('medium');
    expect(gpsQuality(track({ meters: 20, secPerKm: 300, accuracy: 45 }))).toBe('low');
  });

  it('estimates energy by activity', () => {
    expect(estimateKcal('run', 70, 5, 1800)).toBe(364);
    expect(estimateKcal('hiit', 70, 0, 1800)).toBe(280);
  });
});

describe('snapshot and formatting', () => {
  it('builds a non-demo snapshot from points', () => {
    const snap = buildSnapshot({
      kind: 'run',
      title: 'Run',
      points: track({ meters: 1500, secPerKm: 300 }),
      durationSec: 460,
      weightKg: 70,
      targetPaceSecPerKm: 300,
      lapCount: 1,
    });
    expect(snap.isDemo).toBe(false);
    expect(snap.distanceKm).toBeCloseTo(1.5, 2);
    expect(snap.splits).toHaveLength(1);
    expect(snap.heartRateBpm).toBeNull();
    expect(snap.lapCount).toBe(1);
  });

  it('formats pace and duration', () => {
    expect(formatPace(288)).toBe('4\'48"');
    expect(formatPace(null)).toBe('--\'--"');
    expect(formatDuration(1905)).toBe('31:45');
    expect(formatDuration(3729)).toBe('1:02:09');
  });
});

describe('projectRoute', () => {
  it('needs at least two distinct points', () => {
    expect(projectRoute([{ lat: 1, lng: 1 }], 300, 200)).toBeNull();
    expect(
      projectRoute(
        [
          { lat: 1, lng: 1 },
          { lat: 1, lng: 1 },
        ],
        300,
        200,
      ),
    ).toBeNull();
  });

  it('fits the route inside the padded box', () => {
    const result = projectRoute(
      [
        { lat: 37.0, lng: -122.0 },
        { lat: 37.01, lng: -122.01 },
        { lat: 37.02, lng: -122.0 },
      ],
      300,
      200,
      20,
    );
    expect(result).not.toBeNull();
    const coords = [...result!.path.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(19.9);
      expect(x).toBeLessThanOrEqual(280.1);
      expect(y).toBeGreaterThanOrEqual(19.9);
      expect(y).toBeLessThanOrEqual(180.1);
    }
  });
});

describe('pacerCue', () => {
  const base = { distanceKm: 3, targetPaceSecPerKm: 300 };
  it('stays silent without enough data', () => {
    expect(pacerCue({ ...base, distanceKm: 0.2, avgPaceSecPerKm: 290 })).toBeNull();
    expect(pacerCue({ ...base, avgPaceSecPerKm: null })).toBeNull();
  });
  it('reports ahead, behind, and on-target', () => {
    expect(pacerCue({ ...base, avgPaceSecPerKm: 290 })?.headline).toContain(
      '10 seconds per km ahead',
    );
    expect(pacerCue({ ...base, avgPaceSecPerKm: 312 })?.headline).toContain(
      '12 seconds per km behind',
    );
    expect(pacerCue({ ...base, avgPaceSecPerKm: 301 })?.headline).toBe('on target pace');
  });
});

describe('splitBarRatio', () => {
  it('maps the Stitch splits onto their reference bar widths (fastest ≈ 95%, slowest ≈ 72%)', () => {
    const { splitBarRatio } = jest.requireActual('@/features/activities/components/SplitsCard');
    expect(splitBarRatio(288, 288)).toBeCloseTo(0.95, 2);
    expect(splitBarRatio(304, 288)).toBeCloseTo(0.72, 1);
    expect(splitBarRatio(900, 288)).toBe(0.2);
  });
});
