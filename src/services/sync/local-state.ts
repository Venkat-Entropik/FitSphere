import {
  addMealToRecord,
  addWaterToRecord,
  emptyDay,
  removeMeal,
} from '@/features/nutrition/utils/nutrition.logic';
import type { UserProfile } from '@/features/profile/types/profile.types';
import { upsertWeight } from '@/features/profile/utils/profile.logic';
import type { MockDbState } from '@/services/mock-db/mock-db';
import { dateKey } from '@/utils/date';

import type { SyncChange } from './types';

/** The part of the local database that mirrors the server. */
export type LocalData = Pick<
  MockDbState,
  | 'profile'
  | 'weights'
  | 'workouts'
  | 'activities'
  | 'nutritionDays'
  | 'routines'
  | 'customExercises'
>;

/** A blank account, matching the server's default profile until the first sync fills in the real one. */
export function emptyLocalData(name: string): LocalData {
  return {
    profile: {
      identity: { name, age: 30 },
      profile: {
        goal: 'muscle',
        sex: 'male',
        heightCm: 175,
        weightKg: 70,
        targetKg: 70,
        experience: 'beginner',
        daysPerWeek: 3,
      },
      updatedAt: 0,
    },
    weights: [],
    workouts: [],
    activities: [],
    nutritionDays: {},
    routines: [],
    customExercises: [],
  };
}

/** A profile change also records today's weigh-in when the body weight moved, like the server does. */
function withWeighIn(
  data: LocalData,
  next: UserProfile,
  now: number,
): Pick<LocalData, 'profile' | 'weights'> {
  const changed = next.profile.weightKg !== data.profile.profile.weightKg;
  return {
    profile: next,
    weights: changed
      ? upsertWeight(data.weights, {
          id: `weight-${now}`,
          dateKey: dateKey(now),
          kg: next.profile.weightKg,
        })
      : data.weights,
  };
}

/**
 * Applies one change to the local data. Pure, and idempotent for records with ids, because the same
 * changes are re-applied on top of fresh server data after every sync.
 */
export function applyChange(data: LocalData, change: SyncChange): LocalData {
  switch (change.type) {
    case 'workout.save':
      return {
        ...data,
        workouts: [...data.workouts.filter((w) => w.id !== change.record.id), change.record],
      };
    case 'activity.save':
      return {
        ...data,
        activities: [...data.activities.filter((a) => a.id !== change.record.id), change.record],
      };
    case 'meal.log': {
      const day = data.nutritionDays[change.dateKey] ?? emptyDay(change.dateKey);
      const withoutOld = { ...day, meals: day.meals.filter((m) => m.id !== change.meal.id) };
      return {
        ...data,
        nutritionDays: {
          ...data.nutritionDays,
          [change.dateKey]: addMealToRecord(withoutOld, change.meal),
        },
      };
    }
    case 'meal.remove': {
      const day = data.nutritionDays[change.dateKey] ?? emptyDay(change.dateKey);
      return {
        ...data,
        nutritionDays: { ...data.nutritionDays, [change.dateKey]: removeMeal(day, change.mealId) },
      };
    }
    case 'water.add': {
      const day = data.nutritionDays[change.dateKey] ?? emptyDay(change.dateKey);
      return {
        ...data,
        nutritionDays: {
          ...data.nutritionDays,
          [change.dateKey]: addWaterToRecord(day, change.ml, change.goalMl),
        },
      };
    }
    case 'weight.log':
      return {
        ...data,
        weights: upsertWeight(data.weights, change.entry),
        profile: {
          ...data.profile,
          profile: { ...data.profile.profile, weightKg: change.entry.kg },
          updatedAt: change.now,
        },
      };
    case 'profile.save':
      return {
        ...data,
        ...withWeighIn(
          data,
          {
            ...data.profile,
            profile: change.profile,
            updatedAt: change.now,
            onboardingComplete: true,
          },
          change.now,
        ),
      };
    case 'routine.save':
      return {
        ...data,
        routines: [
          ...(data.routines ?? []).filter((r) => r.id !== change.routine.id),
          change.routine,
        ],
      };
    case 'routine.delete':
      return { ...data, routines: (data.routines ?? []).filter((r) => r.id !== change.routineId) };
    case 'exercise.save':
      return {
        ...data,
        customExercises: [
          ...(data.customExercises ?? []).filter((e) => e.id !== change.exercise.id),
          change.exercise,
        ],
      };
    case 'exercise.delete':
      return {
        ...data,
        customExercises: (data.customExercises ?? []).filter((e) => e.id !== change.exerciseId),
      };
    case 'profile.patch':
      return {
        ...data,
        ...withWeighIn(
          data,
          {
            ...data.profile,
            profile: { ...data.profile.profile, ...change.patch },
            updatedAt: change.now,
          },
          change.now,
        ),
      };
  }
}

export const applyChanges = (data: LocalData, changes: readonly SyncChange[]): LocalData =>
  changes.reduce(applyChange, data);
