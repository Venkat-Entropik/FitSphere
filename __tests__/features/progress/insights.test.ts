import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { MuscleGroup, WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import {
  buildInsights,
  changeVs,
  formatMinutes,
  formatVolume,
  oneRepMax,
  paceLabel,
  WEEKS,
} from '@/features/progress/utils/insights.logic';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 20, 12).getTime(); // a Friday

const workout = (
  daysAgo: number,
  over: Partial<WorkoutRecord> = {},
  sets: { kg: number; reps: number }[] = [{ kg: 80, reps: 5 }],
  exercise: { id: string; name: string; muscle: MuscleGroup } = {
    id: 'bench',
    name: 'Bench Press',
    muscle: 'chest',
  },
): WorkoutRecord => ({
  id: `w-${daysAgo}-${exercise.id}`,
  planId: null,
  title: 't',
  startedAt: NOW - daysAgo * DAY,
  endedAt: NOW - daysAgo * DAY + 3_000_000,
  durationSec: 3000,
  volumeKg: 4000,
  setsCompleted: sets.length,
  prCount: 0,
  kcal: 300,
  exercises: [
    {
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscle,
      sets: sets.map((s) => ({ ...s, isPersonalRecord: false })),
    },
  ],
  source: 'user',
  ...over,
});

const run = (daysAgo: number, km: number, pace: number | null = 330): ActivityRecord => ({
  id: `a-${daysAgo}`,
  kind: 'run',
  title: 'Run',
  startedAt: NOW - daysAgo * DAY,
  endedAt: NOW - daysAgo * DAY + 1_800_000,
  distanceKm: km,
  durationSec: 1800,
  movingSec: 1700,
  avgPaceSecPerKm: pace,
  kcal: 300,
  elevationGainM: 0,
  splits: [],
  route: [],
  source: 'user',
});

const build = (workouts: WorkoutRecord[], activities: ActivityRecord[] = [], targetDays = 3) =>
  buildInsights({ now: NOW, workouts, activities, targetDays });

describe('weekly buckets', () => {
  it('makes eight rolling weeks and puts each record in the right one', () => {
    const i = build([workout(1), workout(3), workout(9)], [run(2, 5)]);
    expect(i.weeks).toHaveLength(WEEKS);
    expect(i.weeks.at(-1)!.label).toBe('Now');
    expect(i.thisWeek.sessions).toBe(3); // two lifts and a run, last 7 days
    expect(i.weeks.at(-2)!.sessions).toBe(1);
    expect(i.thisWeek.distanceKm).toBe(5);
    expect(i.thisWeek.volumeKg).toBe(8000);
  });

  it('ignores records older than the window and anything in the future', () => {
    const i = build([workout(70), workout(-1)]);
    expect(i.hasData).toBe(false);
  });

  it('averages the four weeks before this one', () => {
    const i = build([workout(8), workout(15), workout(22), workout(29), workout(1)]);
    expect(i.average.sessions).toBe(1);
    expect(i.average.volumeKg).toBe(4000);
  });
});

describe('training load', () => {
  it('has no verdict without history', () => {
    expect(build([workout(1)]).load).toEqual({ ratio: null, status: 'baseline' });
  });

  it('flags a sharp jump, a light week, and a steady one', () => {
    const history = [workout(8), workout(15), workout(22), workout(29)];
    expect(build([...history, workout(1, { volumeKg: 9000 })]).load.status).toBe('ramping');
    expect(build([...history, workout(1, { volumeKg: 1000 })]).load.status).toBe('light');
    expect(build([...history, workout(1)]).load.status).toBe('steady');
  });
});

describe('strength trends', () => {
  it('tracks the best estimated 1RM per session and the direction', () => {
    const i = build([
      workout(21, {}, [{ kg: 80, reps: 5 }]),
      workout(14, {}, [{ kg: 82.5, reps: 5 }]),
      workout(7, {}, [{ kg: 85, reps: 5 }]),
    ]);
    const bench = i.strength[0]!;
    expect(bench.sessions).toBe(3);
    expect(bench.points).toEqual([oneRepMax(80, 5), oneRepMax(82.5, 5), oneRepMax(85, 5)]);
    expect(bench.status).toBe('improving');
    expect(bench.changePercent).toBeGreaterThan(0);
    expect(bench.bestSet).toEqual({ kg: 85, reps: 5 });
  });

  it('reports a dip, a plateau, and a single session as a baseline', () => {
    const lift = (kgs: number[]) =>
      build(kgs.map((kg, i) => workout((kgs.length - i) * 7 - 1, {}, [{ kg, reps: 5 }])));
    expect(lift([90, 85]).strength[0]!.status).toBe('dipping');
    expect(lift([80, 80]).strength[0]!.status).toBe('steady');
    expect(lift([80]).strength[0]!.status).toBe('baseline');
  });

  it('keeps the five most-trained lifts', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({
      id,
      name: id,
      muscle: 'back' as const,
    }));
    const many = ids.flatMap((e, n) => [workout(2 + n, {}, [{ kg: 50, reps: 5 }], e)]);
    expect(build(many).strength).toHaveLength(5);
  });
});

describe('muscle balance', () => {
  it('counts sets from the last 7 days and grades them against 10 to 20', () => {
    const sets = (n: number) => Array.from({ length: n }, () => ({ kg: 50, reps: 8 }));
    const i = build([
      workout(1, {}, sets(12)), // chest, good
      workout(2, {}, sets(25), { id: 'row', name: 'Row', muscle: 'back' }), // high
      workout(3, {}, sets(4), { id: 'sq', name: 'Squat', muscle: 'legs' }), // low
      workout(10, {}, sets(30), { id: 'ohp', name: 'OHP', muscle: 'shoulders' }), // too old
    ]);
    const by = Object.fromEntries(i.muscles.map((m) => [m.id, m]));
    expect(by.chest).toMatchObject({ sets: 12, status: 'good' });
    expect(by.back).toMatchObject({ sets: 25, status: 'high' });
    expect(by.legs).toMatchObject({ sets: 4, status: 'low' });
    expect(by.shoulders).toMatchObject({ sets: 0, status: 'none' });
  });
});

describe('cardio', () => {
  it('totals distance and compares the recent pace with the earlier one', () => {
    const i = build([], [run(3, 5, 300), run(10, 8, 320), run(40, 10, 360)]);
    expect(i.cardio.totalKm).toBe(23);
    expect(i.cardio.sessions).toBe(3);
    expect(i.cardio.longestKm).toBe(10);
    expect(i.cardio.paceNow).toBe(310);
    expect(i.cardio.pacePrev).toBe(360);
  });

  it('leaves pace empty when no run recorded one', () => {
    const i = build([], [run(2, 3, null)]);
    expect(i.cardio.paceNow).toBeNull();
  });
});

describe('consistency', () => {
  it('counts distinct active days per week against the target', () => {
    const i = build([workout(1), workout(1.1), workout(3), workout(5), workout(8)], [], 3);
    expect(i.consistency.perWeek.at(-1)).toBe(3);
    expect(i.consistency.weeksHit).toBe(1);
  });

  it('names the weekday trained most often', () => {
    const i = build([workout(7), workout(14), workout(3)]);
    expect(i.consistency.bestWeekday).toBe('Friday');
  });
});

describe('helpers', () => {
  it('compares against a baseline', () => {
    expect(changeVs(120, 100)).toEqual({ percent: 20, direction: 'up' });
    expect(changeVs(80, 100)).toEqual({ percent: -20, direction: 'down' });
    expect(changeVs(101, 100).direction).toBe('flat');
    expect(changeVs(5, 0)).toEqual({ percent: null, direction: 'none' });
  });

  it('formats paces, volumes and durations', () => {
    expect(paceLabel(312)).toBe(`5'12"`);
    expect(paceLabel(null)).toBe('--');
    expect(formatVolume(4200)).toBe('4,200');
    expect(formatVolume(12_500.4)).toBe('12,500');
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(125)).toBe('2 h 5 min');
    expect(formatMinutes(120)).toBe('2 h');
  });
});
