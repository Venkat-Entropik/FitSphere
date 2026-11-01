import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import type { ActivityRecord } from '@/features/activities/types/activity.types';
import { ProgressScreen } from '@/features/progress/screens/ProgressScreen';
import {
  badges,
  bestWeeklyVolume,
  buildProgress,
  heatmap,
  personalRecordCards,
} from '@/features/progress/utils/progress.aggregate';
import {
  adherencePercent,
  badgeProgressLabel,
  badgeProgressRatio,
  bodyDelta,
  countUnlocked,
  signedDelta,
  weeksToTarget,
} from '@/features/progress/utils/progress.logic';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { buildSeed } from '@/services/mock-db/seed';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const NOW = new Date(2026, 10, 4, 12).getTime(); // Wed 4 Nov 2026
const seed = buildSeed(NOW);
const input = {
  now: NOW,
  profile: seed.profile,
  workouts: seed.workouts,
  activities: seed.activities,
  weights: seed.weights,
};

const workout = (
  daysAgo: number,
  volumeKg: number,
  extra: Partial<WorkoutRecord> = {},
): WorkoutRecord => ({
  ...seed.workouts[0]!,
  id: `w-${daysAgo}-${volumeKg}`,
  startedAt: NOW - daysAgo * 86_400_000,
  endedAt: NOW - daysAgo * 86_400_000 + 3_000_000,
  volumeKg,
  exercises: [],
  source: 'user',
  ...extra,
});

describe('progress logic', () => {
  it('computes body deltas from baseline to current', () => {
    expect(
      bodyDelta(
        { kg: 67.2, bodyFatPercent: 15.2, muscleKg: 33.3 },
        { kg: 68.5, bodyFatPercent: 13.8, muscleKg: 34.2 },
      ),
    ).toEqual({
      weightKg: 1.3,
      bodyFatPercent: -1.4,
      muscleKg: 0.9,
    });
    expect(signedDelta(1.3)).toBe('+1.3');
    expect(signedDelta(-1.4)).toBe('-1.4');
  });

  it('computes adherence, ignoring rest cells', () => {
    expect(adherencePercent([])).toBe(0);
    expect(
      adherencePercent([
        { day: 1, kind: 'strength' },
        { day: 2, kind: 'rest' },
        { day: 3, kind: 'cardio' },
        { day: 4, kind: 'rest' },
      ]),
    ).toBe(50);
  });

  it('projects weeks to target in either direction and refuses wrong-way trends', () => {
    expect(weeksToTarget(68.5, 70, 0.3)).toBe(5);
    expect(weeksToTarget(80, 74, -1)).toBe(6);
    expect(weeksToTarget(68.5, 70, 0)).toBeNull();
    expect(weeksToTarget(71, 70, 0.3)).toBeNull();
    expect(weeksToTarget(70, 70, 0)).toBe(0);
  });
});

describe('heatmap / weekly volume', () => {
  it('shows the last 14 days oldest first, marking rest days', () => {
    const cells = heatmap(
      NOW,
      [workout(0, 100)],
      [{ startedAt: NOW - 86_400_000 } as ActivityRecord],
    );
    expect(cells).toHaveLength(14);
    expect(cells.at(-1)).toMatchObject({ day: 14, kind: 'strength' });
    expect(cells.at(-2)?.kind).toBe('cardio');
    expect(cells[0]?.kind).toBe('rest');
  });

  it('finds the heaviest rolling week', () => {
    expect(
      bestWeeklyVolume([
        workout(0, 10_000),
        workout(3, 8_000),
        workout(20, 30_000),
        workout(21, 1_000),
      ]),
    ).toBe(31_000);
    expect(bestWeeklyVolume([])).toBe(0);
  });
});

describe('personalRecordCards', () => {
  it('marks recent lifts as new and older ones as confirmed, newest first', () => {
    const recentSet = {
      exerciseId: 'bench-press',
      name: 'Barbell Bench Press',
      muscleGroup: 'chest' as const,
      sets: [{ kg: 80, reps: 5, isPersonalRecord: true }],
    };
    const oldSet = {
      ...recentSet,
      exerciseId: 'squat',
      name: 'Back Squat',
      sets: [{ kg: 120, reps: 5, isPersonalRecord: false }],
    };
    const { items, totalCount } = personalRecordCards(
      [workout(2, 5000, { exercises: [recentSet] }), workout(30, 6000, { exercises: [oldSet] })],
      [],
      NOW,
    );
    expect(totalCount).toBe(2);
    expect(items[0]).toMatchObject({
      exercise: 'Barbell Bench Press',
      value: '80 kg',
      detail: '× 5 reps',
    });
    expect(items[0]!.chip.label).toBe('NEW PR · 2D AGO');
    expect(items[1]!.chip.label).toBe('CONFIRMED · 30D AGO');
    expect(items[0]!.footLeft.text).toBe('1RM Est: 93.3 kg');
  });

  it('adds run records and caps the list', () => {
    const run = {
      id: 'r',
      kind: 'run',
      title: 'Run',
      startedAt: NOW,
      endedAt: NOW,
      distanceKm: 10,
      durationSec: 3000,
      movingSec: 3000,
      avgPaceSecPerKm: 300,
      kcal: 600,
      elevationGainM: 55,
      splits: [{ km: 1, paceSecPerKm: 280, isFastest: true }],
      route: [],
      source: 'user',
    } as ActivityRecord;
    const { items } = personalRecordCards([], [run], NOW);
    // Same run, same timestamp: the order falls back to insertion (longest first).
    expect(items.map((i) => i.exercise)).toEqual(['Longest Run', 'Fastest Kilometre']);
    expect(items[0]).toMatchObject({ value: '10.0 km', detail: '5\'00" /km' });
    expect(personalRecordCards(seed.workouts, seed.activities, NOW, 2).items).toHaveLength(2);
  });
});

describe('badges', () => {
  it('earns badges from real thresholds and shows progress on locked ones', () => {
    const list = badges(seed.workouts, seed.activities);
    const iron = list.find((b) => b.id === 'iron')!;
    expect(iron.status).toBe('earned'); // seeded 14-day streak
    const centurion = list.find((b) => b.id === 'centurion')!;
    expect(centurion.status).toBe('locked');
    expect(centurion.progress).toEqual({ current: seed.workouts.length, target: 100, unit: '' });
    expect(badgeProgressLabel(centurion)).toBe(`${seed.workouts.length} / 100`);
    expect(badgeProgressRatio(centurion)).toBeCloseTo(seed.workouts.length / 100, 5);
  });

  it('starts empty for a new athlete and earns the weekly-volume badge from one huge week', () => {
    const fresh = badges([], []);
    expect(countUnlocked(fresh)).toBe(0);
    expect(fresh.find((b) => b.id === 'iron')!.progress).toEqual({
      current: 0,
      target: 14,
      unit: 'days',
    });
    expect(badges([workout(0, 26_000)], []).find((b) => b.id === 'titan')!.status).toBe('earned');
  });

  it('unlocks the pace badge only for a sub-4:50 split', () => {
    const run = (pace: number) =>
      ({
        distanceKm: 5,
        splits: [{ km: 1, paceSecPerKm: pace, isFastest: true }],
        startedAt: NOW,
      }) as unknown as ActivityRecord;
    expect(badges([], [run(285)]).find((b) => b.id === 'pace')!.status).toBe('earned');
    expect(badges([], [run(295)]).find((b) => b.id === 'pace')!.status).toBe('locked');
  });
});

describe('buildProgress', () => {
  it('derives streak, week, body change and milestone estimate from history', () => {
    const p = buildProgress(input);
    expect(p.streak.days).toBe(14);
    expect(p.streak.bestStreak).toBe(14);
    expect(p.streak.weekTarget).toBe(5);
    expect(p.streak.heatmap).toHaveLength(14);
    expect(p.transformation.baseline.kg).toBe(67.2);
    expect(p.transformation.current.kg).toBe(68.5);
    expect(p.transformation.trajectory.points).toHaveLength(seed.weights.length);
    expect(p.macrocycleLabel).toContain('Build Muscle');
    // 4-week gain rate is positive and the target (72) is above current, so there is an estimate.
    expect(p.synthesis.weeksToMilestone).toBeGreaterThan(0);
  });

  it('has no estimate when there is no weight trend, and handles an empty history', () => {
    const p = buildProgress({ ...input, workouts: [], activities: [], weights: [] });
    expect(p.streak.days).toBe(0);
    expect(p.streak.heatmap.every((c) => c.kind === 'rest')).toBe(true);
    expect(p.synthesis.weeklyVolumePercent).toBeNull();
    expect(p.synthesis.weeksToMilestone).toBeNull();
    expect(p.personalRecords).toEqual({ items: [], totalCount: 0 });
    expect(p.transformation.dayNumber).toBe(1);
  });

  it('reflects a newly finished workout today', () => {
    const before = buildProgress(input);
    const after = buildProgress({ ...input, workouts: [...seed.workouts, workout(0, 12_000)] });
    expect(after.streak.days).toBe(before.streak.days + 1);
    expect(after.streak.heatmap.at(-1)!.kind).toBe('strength');
    expect(after.streak.weekDone).toBe(before.streak.weekDone + 1);
  });
});

describe('ProgressScreen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <ProgressScreen />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders streak, records, transformation and badges from stored data', async () => {
    await renderScreen();
    expect(await screen.findByText('14-Day Streak')).toBeTruthy();
    expect(screen.getByText(/Longest streak: 14 days/)).toBeTruthy();
    expect(screen.getByText('Centurion Club')).toBeTruthy();
    expect(screen.getByText('Iron Discipline')).toBeTruthy();
    expect(screen.getByText('68.5 kg (+1.3)')).toBeTruthy();
  });

  it('explains when camera permission is denied and never opens the camera', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Log Progress Photo & InBody Scan' }),
    );
    await waitFor(() => expect(screen.getByText(/Camera access is off/)).toBeTruthy());
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('shows the captured photo in the current panel', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Log Progress Photo & InBody Scan' }),
    );
    await waitFor(() => expect(screen.getByLabelText('Progress photo')).toBeTruthy());
  });
});
