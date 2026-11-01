import { EXERCISE_CATALOG, WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { buildMockSession } from '@/features/workouts/services/workout.mock';
import type { ActiveSession } from '@/features/workouts/types/workout.types';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import {
  buildSessionFromPlan,
  buildWorkoutRecord,
  estimateOneRepMax,
  estimateWorkoutKcal,
  exerciseSessions,
  filterExercises,
  nextPlan,
  personalBests,
  suggestOverload,
  volumeByMuscle,
} from '@/features/workouts/utils/workout-history.logic';
import { adjustActiveSet, logActiveSet } from '@/features/workouts/utils/workout.logic';

const NOW = new Date(2026, 10, 4, 12).getTime();
const incline = EXERCISE_CATALOG.find((e) => e.id === 'incline-db-press')!; // reps 8–10, +2 kg, start 24

const setsOf = (kg: number, reps: number[]) =>
  reps.map((r) => ({ kg, reps: r, isPersonalRecord: false }));

const record = (over: Partial<WorkoutRecord> & { endedAt: number }): WorkoutRecord => ({
  id: `r-${over.endedAt}`,
  planId: null,
  title: 't',
  startedAt: over.endedAt - 3_000_000,
  durationSec: 3000,
  volumeKg: 0,
  setsCompleted: 0,
  prCount: 0,
  kcal: 0,
  exercises: [],
  source: 'user',
  ...over,
});

const withSets = (
  endedAt: number,
  exerciseId: string,
  sets: ReturnType<typeof setsOf>,
  planId: string | null = null,
) =>
  record({
    endedAt,
    planId,
    exercises: [{ exerciseId, name: exerciseId, muscleGroup: 'chest', sets }],
  });

describe('estimateOneRepMax / kcal', () => {
  it('uses the Epley formula and returns the weight for a single', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 5)).toBe(116.7);
  });
  it('estimates energy from MET 5', () => {
    expect(estimateWorkoutKcal(3600, 70)).toBe(350);
  });
});

describe('personalBests', () => {
  it('keeps the heaviest set per exercise, breaking ties on reps', () => {
    const bests = personalBests([
      withSets(1000, 'incline-db-press', setsOf(30, [10, 8])),
      withSets(2000, 'incline-db-press', setsOf(32, [8])),
      withSets(3000, 'incline-db-press', setsOf(32, [10])),
      withSets(4000, 'incline-db-press', setsOf(28, [12])),
    ]);
    const best = bests.get('incline-db-press')!;
    expect(best).toMatchObject({ kg: 32, reps: 10, achievedAt: 3000 });
    expect(best.estimatedOneRepMax).toBe(42.7);
  });
});

describe('suggestOverload (double progression)', () => {
  it('starts at the exercise starting weight with no history', () => {
    expect(suggestOverload(incline, [])).toEqual({
      exerciseId: incline.id,
      kg: 24,
      reps: 8,
      reason: 'start',
    });
  });

  it('adds weight once every set reaches the top of the range', () => {
    expect(suggestOverload(incline, [setsOf(30, [10, 10, 10])])).toMatchObject({
      kg: 32,
      reps: 8,
      reason: 'progress',
    });
  });

  it('repeats the weight and targets one more rep otherwise', () => {
    expect(suggestOverload(incline, [setsOf(30, [9, 8, 8])])).toMatchObject({
      kg: 30,
      reps: 10,
      reason: 'repeat',
    });
    expect(suggestOverload(incline, [setsOf(30, [8, 8, 8])])).toMatchObject({
      kg: 30,
      reps: 9,
      reason: 'repeat',
    });
  });

  it('deloads about 10% after two sessions under the range', () => {
    const missed = setsOf(30, [6, 6, 5]);
    expect(suggestOverload(incline, [missed, missed])).toMatchObject({
      kg: 28,
      reps: 8,
      reason: 'deload',
    });
    expect(suggestOverload(incline, [missed])).toMatchObject({ reason: 'repeat' });
  });

  it('progresses from the heaviest working weight of the last session', () => {
    expect(
      suggestOverload(incline, [[...setsOf(30, [10]), ...setsOf(32, [10, 10])]]),
    ).toMatchObject({ kg: 34, reason: 'progress' });
  });
});

describe('plans and sessions', () => {
  it('rotates to the plan after the one trained last', () => {
    expect(nextPlan([], WORKOUT_PLANS).id).toBe('push-day');
    const records = [
      record({ endedAt: 1000, planId: 'push-day' }),
      record({ endedAt: 2000, planId: 'pull-day' }),
    ];
    expect(nextPlan(records, WORKOUT_PLANS).id).toBe('leg-day');
    expect(nextPlan([record({ endedAt: 9, planId: 'upper-body' })], WORKOUT_PLANS).id).toBe(
      'push-day',
    );
  });

  it('finds recent sessions newest first and skips ones without the exercise', () => {
    const records = [
      withSets(1000, 'squat', setsOf(60, [5])),
      withSets(3000, 'incline-db-press', setsOf(30, [10])),
      withSets(2000, 'incline-db-press', setsOf(28, [10])),
    ];
    expect(exerciseSessions(records, 'incline-db-press').map((s) => s[0]!.kg)).toEqual([30, 28]);
  });

  it('builds a runnable session with history-based loads', () => {
    const history = [withSets(1000, 'incline-db-press', setsOf(30, [10, 10, 10, 10]))];
    const session = buildSessionFromPlan(WORKOUT_PLANS[0]!, EXERCISE_CATALOG, history, NOW);
    const first = session.exercises[0]!;
    expect(session.planId).toBe('push-day');
    expect(session.totalExerciseCount).toBe(5);
    expect(first.sets).toHaveLength(4);
    expect(first.sets.map((s) => s.status)).toEqual(['active', 'upcoming', 'upcoming', 'upcoming']);
    expect(first.sets[0]).toMatchObject({ kg: 32, reps: 8 });
    expect(first.personalBestKg).toBe(30);
    expect(first.lastWeek).toEqual({ kg: 30, reps: [10, 10, 10, 10] });
    expect(session.exercises[1]!.sets.every((s) => s.status === 'upcoming')).toBe(true);
    expect(session.exercises[1]!.lastWeek).toBeNull();
  });
});

describe('buildWorkoutRecord', () => {
  const session = (): ActiveSession => {
    const { rest: _r, ...s } = buildMockSession(NOW); // started 42:15 before NOW
    return s;
  };

  it('keeps only logged sets and totals volume, sets, PRs and duration', () => {
    let s = adjustActiveSet(session(), { kg: 2.5 });
    s = logActiveSet(s); // set 3 → 34.5 × 8 = new PR vs best 30
    const rec = buildWorkoutRecord(s, { now: NOW, weightKg: 68.5, catalog: EXERCISE_CATALOG });
    expect(rec.durationSec).toBe(42 * 60 + 15);
    expect(rec.setsCompleted).toBe(12);
    expect(rec.volumeKg).toBe(Math.round(5800 + 30 * 10 + 32 * 10 + 34.5 * 8));
    expect(rec.prCount).toBe(2);
    expect(rec.exercises).toHaveLength(1);
    expect(rec.exercises[0]!.sets).toHaveLength(3);
    expect(rec.exercises[0]!.muscleGroup).toBe('chest');
    expect(rec.kcal).toBe(estimateWorkoutKcal(42 * 60 + 15, 68.5));
    expect(rec.source).toBe('user');
  });

  it('omits exercises with nothing logged', () => {
    const fresh = buildSessionFromPlan(WORKOUT_PLANS[0]!, EXERCISE_CATALOG, [], NOW);
    const { rest: _r, ...s } = fresh;
    const rec = buildWorkoutRecord(s, {
      now: NOW + 60_000,
      weightKg: 70,
      catalog: EXERCISE_CATALOG,
    });
    expect(rec.exercises).toEqual([]);
    expect(rec.setsCompleted).toBe(0);
    expect(rec.volumeKg).toBe(0);
  });
});

describe('library and volume helpers', () => {
  it('filters by text, muscle and equipment', () => {
    expect(filterExercises(EXERCISE_CATALOG, { query: 'press' }).map((e) => e.id)).toEqual(
      expect.arrayContaining(['incline-db-press', 'bench-press', 'overhead-press', 'leg-press']),
    );
    expect(
      filterExercises(EXERCISE_CATALOG, { muscleGroup: 'legs', equipment: 'machine' }).every(
        (e) => e.equipment === 'machine',
      ),
    ).toBe(true);
    expect(filterExercises(EXERCISE_CATALOG, { query: '  TRICEPS ' }).length).toBeGreaterThan(0);
    expect(filterExercises(EXERCISE_CATALOG, { query: 'zzz' })).toEqual([]);
  });

  it('sums tonnage by muscle', () => {
    const totals = volumeByMuscle([withSets(1, 'incline-db-press', setsOf(30, [10, 10]))]);
    expect(totals.chest).toBe(600);
    expect(totals.legs).toBe(0);
  });
});
