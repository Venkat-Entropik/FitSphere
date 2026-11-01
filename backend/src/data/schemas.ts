import { z } from 'zod';

/** Zod mirrors of the app's feature types (src/features, each types folder). Bounds keep stored rows small. */

export const id = z
  .string()
  .min(1, 'Id is required')
  .max(64, 'Id is too long')
  .regex(/^[A-Za-z0-9_.:-]+$/, 'Id has invalid characters');

export const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-01')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }, 'Not a real date');

const epochMs = z.number().int().min(0).max(8_640_000_000_000_000);
const text = (max: number) => z.string().trim().min(1, 'Required').max(max, `Keep this under ${max} characters`);
const num = (min: number, max: number, label: string) =>
  z.number().min(min, `${label} must be at least ${min}`).max(max, `${label} must be at most ${max}`);

// ── Profile ──────────────────────────────────────────────────────────────────

export const onboardingProfileShape = {
  goal: z.enum(['muscle', 'fat_loss', 'endurance', 'athletic']),
  sex: z.enum(['male', 'female']),
  heightCm: num(120, 230, 'Height'),
  weightKg: num(30, 250, 'Weight'),
  targetKg: num(30, 250, 'Target'),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().int('Use a whole number of days').min(1, 'Train at least 1 day').max(7, 'At most 7 days'),
};

export const profileBody = z.object(onboardingProfileShape).strict();
export const profilePatchBody = z.object(onboardingProfileShape).partial().strict();

export const weightBody = z
  .object({
    id: id.optional(),
    dateKey: dateKey.optional(),
    kg: num(30, 250, 'Weight'),
    bodyFatPercent: num(2, 70, 'Body fat').optional(),
    muscleKg: num(10, 200, 'Muscle mass').optional(),
  })
  .strict();

// ── Workouts ─────────────────────────────────────────────────────────────────

const muscleGroup = z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core']);

export const workoutBody = z
  .object({
    id,
    planId: id.nullable(),
    title: text(120),
    startedAt: epochMs,
    endedAt: epochMs,
    durationSec: z.number().int().min(0).max(86_400),
    volumeKg: z.number().min(0).max(1_000_000),
    setsCompleted: z.number().int().min(0).max(1000),
    prCount: z.number().int().min(0).max(1000),
    kcal: z.number().min(0).max(20_000),
    exercises: z
      .array(
        z
          .object({
            exerciseId: id,
            name: text(120),
            muscleGroup,
            sets: z
              .array(
                z
                  .object({
                    kg: z.number().min(0).max(1000),
                    reps: z.number().int().min(0).max(1000),
                    isPersonalRecord: z.boolean(),
                  })
                  .strict(),
              )
              .max(100),
          })
          .strict(),
      )
      .max(50),
    source: z.enum(['user', 'sample']),
  })
  .strict()
  .refine((w) => w.endedAt >= w.startedAt, { message: 'A workout cannot end before it starts', path: ['endedAt'] });

// ── Activities ───────────────────────────────────────────────────────────────

export const activityBody = z
  .object({
    id,
    kind: z.enum(['run', 'cycle', 'walk', 'cardio', 'hiit']),
    title: text(120),
    startedAt: epochMs,
    endedAt: epochMs,
    distanceKm: z.number().min(0).max(1000),
    durationSec: z.number().int().min(0).max(172_800),
    movingSec: z.number().int().min(0).max(172_800),
    avgPaceSecPerKm: z.number().min(0).max(100_000).nullable(),
    kcal: z.number().min(0).max(50_000),
    elevationGainM: z.number().min(0).max(20_000),
    splits: z
      .array(
        z
          .object({
            km: z.number().min(0).max(1000),
            paceSecPerKm: z.number().min(0).max(100_000),
            isFastest: z.boolean(),
          })
          .strict(),
      )
      .max(1000),
    route: z
      .array(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).strict())
      .max(200, 'Routes are limited to 200 points'),
    source: z.enum(['user', 'sample']),
  })
  .strict()
  .refine((a) => a.endedAt >= a.startedAt, { message: 'An activity cannot end before it starts', path: ['endedAt'] });

// ── Nutrition ────────────────────────────────────────────────────────────────

export const foodBody = z
  .object({
    date: dateKey,
    id: id.optional(),
    loggedAt: epochMs.optional(),
    category: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
    title: text(120),
    kcal: num(0, 10_000, 'Calories'),
    protein: num(0, 2000, 'Protein'),
    carbs: num(0, 2000, 'Carbs'),
    fat: num(0, 2000, 'Fat'),
  })
  .strict();

export const waterBody = z
  .object({ date: dateKey, ml: z.number().int().min(-5000).max(5000), goalMl: z.number().int().min(0).max(20_000).optional() })
  .strict();

export const dateQuery = z.object({ date: dateKey });
export const idParams = z.object({ id });
export const MAX_MEALS_PER_DAY = 50;
export const MAX_WATER_ML = 10_000;
export const LIST_LIMIT = 1000;
