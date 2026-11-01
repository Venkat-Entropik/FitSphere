import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { OnboardingDraft } from '@/features/authentication/types/onboarding.types';
import type { Meal } from '@/features/nutrition/types/nutrition.types';
import type { NutritionDayRecord } from '@/features/nutrition/types/nutrition-record.types';
import type { UserProfile, WeightEntry } from '@/features/profile/types/profile.types';
import { EXERCISE_CATALOG, WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import type {
  RecordedExercise,
  WorkoutRecord,
} from '@/features/workouts/types/workout-record.types';
import { addDays, dateKey } from '@/utils/date';

export const DEFAULT_DRAFT: OnboardingDraft = {
  identity: { name: 'Alex Chen', age: 28 },
  profile: {
    goal: 'muscle',
    sex: 'male',
    heightCm: 175,
    weightKg: 68.5,
    targetKg: 72,
    experience: 'intermediate',
    daysPerWeek: 5,
  },
};

const at = (day: Date, hour: number, minute = 0) => {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
};

function sampleWorkout(day: Date, planIndex: number, weeksAgo: number): WorkoutRecord {
  const plan = WORKOUT_PLANS[planIndex % WORKOUT_PLANS.length]!;
  const startedAt = at(day, 7, 30);
  const exercises: RecordedExercise[] = plan.exercises.map((slot) => {
    const info = EXERCISE_CATALOG.find((e) => e.id === slot.exerciseId)!;
    // Older weeks lifted a little lighter, so the sample history shows progression.
    const kg = Math.max(
      info.incrementKg,
      info.startKg + info.incrementKg * Math.max(0, 4 - weeksAgo),
    );
    return {
      exerciseId: info.id,
      name: info.name,
      muscleGroup: info.muscleGroup,
      sets: Array.from({ length: slot.sets }, () => ({
        kg,
        reps: info.repRange[1] - 1,
        isPersonalRecord: false,
      })),
    };
  });
  const sets = exercises.flatMap((e) => e.sets);
  const durationSec = 55 * 60;
  return {
    id: `sample-w-${dateKey(day)}`,
    planId: plan.id,
    title: plan.name,
    startedAt,
    endedAt: startedAt + durationSec * 1000,
    durationSec,
    volumeKg: sets.reduce((s, x) => s + x.kg * x.reps, 0),
    setsCompleted: sets.length,
    prCount: 0,
    kcal: 380,
    exercises,
    source: 'sample',
  };
}

function sampleRun(day: Date, distanceKm: number, paceSecPerKm: number): ActivityRecord {
  const startedAt = at(day, 18);
  const durationSec = Math.round(distanceKm * paceSecPerKm);
  return {
    id: `sample-a-${dateKey(day)}`,
    kind: 'run',
    title: 'Outdoor Run',
    startedAt,
    endedAt: startedAt + durationSec * 1000,
    distanceKm,
    durationSec,
    movingSec: durationSec - 40,
    avgPaceSecPerKm: paceSecPerKm,
    kcal: Math.round(68.5 * distanceKm * 1.04),
    elevationGainM: Math.round(distanceKm * 9),
    splits: Array.from({ length: Math.floor(distanceKm) }, (_, i) => ({
      km: i + 1,
      paceSecPerKm: paceSecPerKm + (i % 2 === 0 ? 4 : -4),
      isFastest: false,
    })),
    route: [],
    source: 'sample',
  };
}

const meal = (
  id: string,
  category: Meal['category'],
  title: string,
  loggedAt: number,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
): Meal => ({ id, category, title, loggedAt, kcal, protein, carbs, fat });

/**
 * Sample history relative to `now`: a 14-day unbroken streak (lifting plus easy runs), a lighter
 * four weeks before it, a weight trend, and two days of food logs. Everything is flagged `sample`.
 */
export function buildSeed(now = Date.now()) {
  const today = new Date(now);
  const workouts: WorkoutRecord[] = [];
  const activities: ActivityRecord[] = [];
  let planIndex = 0;

  for (let ago = 1; ago <= 41; ago++) {
    const day = addDays(today, -ago);
    const inStreak = ago <= 14;
    const weekday = (day.getDay() + 6) % 7; // Mon = 0
    // Day 15 is a rest day so the sample streak is exactly 14 days.
    const trains = inStreak || (weekday <= 4 && ago !== 15);
    if (!trains) continue;
    const weeksAgo = Math.floor(ago / 7);
    if (inStreak && (ago === 6 || ago === 12)) {
      activities.push(sampleRun(day, 6.2 + (ago % 3) * 0.6, 296 - ago));
    } else if (inStreak && weekday >= 5) {
      activities.push(sampleRun(day, 5 + (ago % 4) * 0.5, 305));
    } else {
      workouts.push(sampleWorkout(day, planIndex++, weeksAgo));
    }
  }

  const weights: WeightEntry[] = [42, 35, 28, 21, 14, 7, 3, 0].map((ago, i) => ({
    id: `sample-weight-${ago}`,
    dateKey: dateKey(addDays(today, -ago)),
    kg: Math.round((67.2 + i * 0.19) * 10) / 10,
    bodyFatPercent: Math.round((15.2 - i * 0.2) * 10) / 10,
    muscleKg: Math.round((33.3 + i * 0.13) * 10) / 10,
  }));
  weights[weights.length - 1] = {
    ...weights[weights.length - 1]!,
    kg: 68.5,
    bodyFatPercent: 13.8,
    muscleKg: 34.2,
  };

  const yesterday = addDays(today, -1);
  const todayKey = dateKey(today);
  const yesterdayKey = dateKey(yesterday);
  const nutritionDays: Record<string, NutritionDayRecord> = {
    [todayKey]: {
      dateKey: todayKey,
      hydrationMl: 2400,
      meals: [
        meal(
          'm1',
          'breakfast',
          'Egg White Omelet & Avocado Toast',
          at(today, 8, 15),
          620,
          42,
          48,
          18,
        ),
        meal(
          'm2',
          'lunch',
          'Grilled Chicken Breast & Brown Rice',
          at(today, 13, 30),
          780,
          52,
          84,
          16,
        ),
        meal('m3', 'snack', 'Whey Isolate Shake & Banana', at(today, 16, 45), 280, 28, 32, 3),
      ],
    },
    [yesterdayKey]: {
      dateKey: yesterdayKey,
      hydrationMl: 3100,
      meals: [
        meal('y1', 'breakfast', 'Greek Yogurt Bowl', at(yesterday, 8), 480, 38, 52, 12),
        meal('y2', 'lunch', 'Turkey Wrap & Fruit', at(yesterday, 13), 700, 48, 74, 20),
        meal('y3', 'dinner', 'Salmon Fillet with Sweet Potato', at(yesterday, 19), 650, 46, 60, 22),
      ],
    },
  };

  const profile: UserProfile = { ...DEFAULT_DRAFT, updatedAt: now };
  return { profile, weights, workouts, activities, nutritionDays };
}
