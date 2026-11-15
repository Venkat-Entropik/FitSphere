import { applyChange, applyChanges, emptyLocalData } from '@/services/sync/local-state';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { describeChange, formatAgo } from '@/services/sync/describe';

const meal = {
  id: 'm1',
  category: 'lunch',
  title: 'Bowl',
  loggedAt: 1,
  kcal: 600,
  protein: 40,
  carbs: 60,
  fat: 15,
} as const;

describe('applyChange', () => {
  const base = emptyLocalData('Sam');

  it('is safe to apply twice: a replayed meal appears once', () => {
    const change = { type: 'meal.log', dateKey: '2026-11-04', meal } as const;
    const twice = applyChanges(base, [change, change]);
    expect(twice.nutritionDays['2026-11-04']!.meals).toHaveLength(1);
  });

  it('removes a meal and tolerates removing one that is gone', () => {
    const logged = applyChange(base, { type: 'meal.log', dateKey: '2026-11-04', meal });
    const removed = applyChange(logged, {
      type: 'meal.remove',
      dateKey: '2026-11-04',
      mealId: 'm1',
    });
    expect(removed.nutritionDays['2026-11-04']!.meals).toHaveLength(0);
    expect(() =>
      applyChange(removed, { type: 'meal.remove', dateKey: '2026-11-04', mealId: 'm1' }),
    ).not.toThrow();
  });

  it('adds water within the daily cap', () => {
    const a = applyChange(base, {
      type: 'water.add',
      dateKey: '2026-11-04',
      ml: 500,
      goalMl: 3500,
      eventId: 'e1',
    });
    expect(a.nutritionDays['2026-11-04']!.hydrationMl).toBe(500);
    const capped = applyChange(a, {
      type: 'water.add',
      dateKey: '2026-11-04',
      ml: 99_999,
      goalMl: 3500,
      eventId: 'e2',
    });
    expect(capped.nutritionDays['2026-11-04']!.hydrationMl).toBe(7000);
  });

  it('replaces a workout with the same id', () => {
    const w: WorkoutRecord = {
      id: 'w1',
      planId: null,
      title: 'A',
      startedAt: 1,
      endedAt: 2,
      durationSec: 1,
      volumeKg: 1,
      setsCompleted: 1,
      prCount: 0,
      kcal: 1,
      exercises: [],
      source: 'user',
    } as const;
    const out = applyChanges(base, [
      { type: 'workout.save', record: w },
      { type: 'workout.save', record: { ...w, title: 'B' } },
    ]);
    expect(out.workouts.map((x) => x.title)).toEqual(['B']);
  });

  it('a weigh-in updates current mass; a weight change in the profile adds one too', () => {
    const logged = applyChange(base, {
      type: 'weight.log',
      entry: { id: 'w', dateKey: '2026-11-04', kg: 72 },
      now: 5,
    });
    expect(logged.profile.profile.weightKg).toBe(72);
    expect(logged.weights).toHaveLength(1);
    const patched = applyChange(base, {
      type: 'profile.patch',
      patch: { weightKg: 75 },
      now: new Date('2026-11-04T10:00:00').getTime(),
    });
    expect(patched.profile.profile.weightKg).toBe(75);
    expect(patched.weights.map((x) => x.kg)).toEqual([75]);
  });

  it('saving the profile marks onboarding complete', () => {
    const saved = applyChange(base, {
      type: 'profile.save',
      profile: base.profile.profile,
      now: 1,
    });
    expect(saved.profile.onboardingComplete).toBe(true);
  });
});

describe('describing changes', () => {
  it('uses plain words', () => {
    expect(describeChange({ type: 'meal.log', dateKey: 'x', meal })).toBe('Meal: Bowl');
    expect(
      describeChange({ type: 'water.add', dateKey: 'x', ml: 250, goalMl: 1, eventId: 'e' }),
    ).toBe('Water +250 ml');
    expect(
      describeChange({ type: 'weight.log', entry: { id: 'w', dateKey: 'x', kg: 72 }, now: 1 }),
    ).toBe('Weight: 72 kg');
  });

  it('says how long ago something happened', () => {
    const now = 10_000_000;
    expect(formatAgo(now - 20_000, now)).toBe('just now');
    expect(formatAgo(now - 5 * 60_000, now)).toBe('5 min ago');
    expect(formatAgo(now - 3 * 3_600_000, now)).toBe('3 h ago');
    expect(formatAgo(now - 86_400_000, now)).toBe('1 day ago');
  });
});
