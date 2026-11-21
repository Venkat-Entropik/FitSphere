import { buildMockSession } from '@/features/workouts/services/workout.mock';
import type { ActiveSession } from '@/features/workouts/types/workout.types';
import {
  activeSet,
  adjustActiveSet,
  completedSetCount,
  currentExercise,
  formatClock,
  timerStart,
  formatKg,
  logActiveSet,
  reopenSet,
  restRemainingSeconds,
  sessionVolumeKg,
  totalSetCount,
} from '@/features/workouts/utils/workout.logic';

const make = (): ActiveSession => {
  const { rest: _rest, ...session } = buildMockSession(0);
  return session;
};

describe('session totals', () => {
  it('matches the reference: 11/16 sets and 6,420 kg', () => {
    const s = make();
    expect(completedSetCount(s)).toBe(11);
    expect(totalSetCount(s)).toBe(16);
    expect(sessionVolumeKg(s)).toBe(6420);
  });
});

describe('adjustActiveSet', () => {
  it('changes only the active set', () => {
    const s = adjustActiveSet(make(), { kg: 2.5, reps: 1 });
    expect(activeSet(currentExercise(s)!)).toMatchObject({ kg: 34.5, reps: 9 });
    expect(currentExercise(s)!.sets[0]).toMatchObject({ kg: 30, reps: 10 });
  });

  it('never goes below 0 kg or 1 rep', () => {
    let s = make();
    for (let i = 0; i < 20; i++) s = adjustActiveSet(s, { kg: -2.5, reps: -1 });
    expect(activeSet(currentExercise(s)!)).toMatchObject({ kg: 0, reps: 1 });
  });
});

describe('logActiveSet', () => {
  it('completes the active set, activates the next, and adds to volume', () => {
    const s = logActiveSet(make());
    const exercise = currentExercise(s)!;
    expect(exercise.sets.map((x) => x.status)).toEqual(['done', 'done', 'done', 'active']);
    expect(completedSetCount(s)).toBe(12);
    expect(sessionVolumeKg(s)).toBe(6420 + 32 * 8);
  });

  it('flags a personal record only when the weight beats the best', () => {
    const heavier = logActiveSet(adjustActiveSet(make(), { kg: 2.5 }));
    expect(currentExercise(heavier)!.sets[2]!.isPersonalRecord).toBe(true);
    expect(currentExercise(heavier)!.personalBestKg).toBe(34.5);

    const first = make();
    first.exercises[0]!.personalBestKg = 40;
    expect(currentExercise(logActiveSet(first))!.sets[2]!.isPersonalRecord).toBe(false);
  });

  it('moves to the next exercise after the last set', () => {
    let s = make();
    s = logActiveSet(s);
    s = logActiveSet(s);
    expect(s.currentExerciseIndex).toBe(1);
    expect(activeSet(currentExercise(s)!)).toMatchObject({ number: 1 });
  });

  it('does nothing when every set is done', () => {
    let s = make();
    for (let i = 0; i < 5; i++) s = logActiveSet(s);
    const before = sessionVolumeKg(s);
    expect(sessionVolumeKg(logActiveSet(s))).toBe(before);
  });
});

describe('formatting', () => {
  it('formats clocks and weights', () => {
    expect(formatClock(75)).toBe('01:15');
    expect(formatClock(-5)).toBe('00:00');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatKg(32)).toBe('32');
    expect(formatKg(34.5)).toBe('34.5');
  });

  it('computes rest remaining, rounding up and clamping at zero', () => {
    expect(restRemainingSeconds(10_500, 0)).toBe(11);
    expect(restRemainingSeconds(1_000, 5_000)).toBe(0);
  });
});

describe('timerStart', () => {
  it('is null until the timer is started, and falls back to the start for older sessions', () => {
    expect(timerStart({ startedAt: 100, timerStartedAt: null })).toBeNull();
    expect(timerStart({ startedAt: 100, timerStartedAt: 250 })).toBe(250);
    expect(timerStart({ startedAt: 100 })).toBe(100);
  });
});

describe('reopenSet', () => {
  it('reopens a logged set, parks the active one, and lets the reps be corrected and re-logged', () => {
    let s = logActiveSet(make()); // set 3 done at its planned reps, set 4 active
    const planned = currentExercise(s)!.sets[2]!;
    expect(planned.status).toBe('done');

    s = reopenSet(s, 3);
    const ex = currentExercise(s)!;
    expect(ex.sets[2]!.status).toBe('active');
    expect(ex.sets[3]!.status).toBe('upcoming');
    expect(activeSet(ex)!.number).toBe(3);

    s = logActiveSet(adjustActiveSet(s, { reps: -2 })); // only managed fewer reps
    const after = currentExercise(s)!;
    expect(after.sets[2]).toMatchObject({ status: 'done', reps: planned.reps - 2 });
    expect(activeSet(after)!.number).toBe(4);
  });

  it('takes the reopened set out of the volume until it is logged again', () => {
    const logged = logActiveSet(make());
    const before = sessionVolumeKg(logged);
    const reopened = reopenSet(logged, 3);
    expect(sessionVolumeKg(reopened)).toBeLessThan(before);
    expect(completedSetCount(reopened)).toBe(completedSetCount(logged) - 1);
  });

  it('removes a PR flag when the weight is lowered, and keeps it when the weight stays', () => {
    const pr = logActiveSet(adjustActiveSet(make(), { kg: 2.5 }));
    expect(currentExercise(pr)!.sets[2]!.isPersonalRecord).toBe(true);

    const lowered = logActiveSet(adjustActiveSet(reopenSet(pr, 3), { kg: -2.5 }));
    expect(currentExercise(lowered)!.sets[2]!.isPersonalRecord).toBe(false);
    expect(currentExercise(lowered)!.personalBestKg).toBe(32); // the heaviest of the other logged sets

    const kept = logActiveSet(reopenSet(pr, 3));
    expect(currentExercise(kept)!.sets[2]!.isPersonalRecord).toBe(true);
  });

  it('ignores sets that are not logged yet and unknown numbers', () => {
    const s = make();
    expect(reopenSet(s, 4)).toBe(s);
    expect(reopenSet(s, 99)).toBe(s);
  });
});
