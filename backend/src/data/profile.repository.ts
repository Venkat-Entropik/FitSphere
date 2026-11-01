import type { z } from 'zod';

import type { Db } from '../db.js';
import type { profileBody, profilePatchBody } from './schemas.js';

export type ProfileFields = z.infer<typeof profileBody>;
export type ProfilePatchFields = z.infer<typeof profilePatchBody>;

export interface UserProfileDto {
  identity: { name: string; age: number };
  profile: ProfileFields;
  onboardingComplete: boolean;
  updatedAt: number;
}

export interface WeightDto {
  id: string;
  dateKey: string;
  kg: number;
  bodyFatPercent?: number;
  muscleKg?: number;
}

export interface WeightInput {
  id: string;
  dateKey: string;
  kg: number;
  bodyFatPercent?: number;
  muscleKg?: number;
}

/** Used until onboarding replaces it. Age is not collected anywhere yet, so it stays at this value. */
const DEFAULT_PROFILE: ProfileFields = {
  goal: 'muscle',
  sex: 'male',
  heightCm: 175,
  weightKg: 70,
  targetKg: 70,
  experience: 'beginner',
  daysPerWeek: 3,
};
const DEFAULT_AGE = 30;

interface ProfileRow {
  name: string;
  age: number;
  goal: ProfileFields['goal'];
  sex: ProfileFields['sex'];
  height_cm: number;
  weight_kg: number;
  target_kg: number;
  experience: ProfileFields['experience'];
  days_per_week: number;
  onboarding_complete: number;
  updated_at: number;
}

interface WeightRow {
  id: string;
  date_key: string;
  kg: number;
  body_fat: number | null;
  muscle_kg: number | null;
}

const toWeight = (r: WeightRow): WeightDto => ({
  id: r.id,
  dateKey: r.date_key,
  kg: r.kg,
  ...(r.body_fat !== null && { bodyFatPercent: r.body_fat }),
  ...(r.muscle_kg !== null && { muscleKg: r.muscle_kg }),
});

export type ProfileRepository = ReturnType<typeof createProfileRepository>;

/**
 * Every query is scoped by `userId`, which always comes from the verified access token.
 * Helpers take the handle to use (`q`) so work inside a transaction stays on the transaction's connection.
 */
export function createProfileRepository(db: Db) {
  async function ensure(q: Db, userId: string, now: number): Promise<void> {
    await q.run(
      `INSERT INTO profiles (user_id, age, goal, sex, height_cm, weight_kg, target_kg, experience, days_per_week, onboarding_complete, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        userId,
        DEFAULT_AGE,
        DEFAULT_PROFILE.goal,
        DEFAULT_PROFILE.sex,
        DEFAULT_PROFILE.heightCm,
        DEFAULT_PROFILE.weightKg,
        DEFAULT_PROFILE.targetKg,
        DEFAULT_PROFILE.experience,
        DEFAULT_PROFILE.daysPerWeek,
        now,
      ],
    );
  }

  async function read(q: Db, userId: string): Promise<UserProfileDto> {
    const r = await q.get<ProfileRow>(
      `SELECT u.name, p.age, p.goal, p.sex, p.height_cm, p.weight_kg, p.target_kg, p.experience,
              p.days_per_week, p.onboarding_complete, p.updated_at
       FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?`,
      [userId],
    );
    if (!r) throw new Error('Profile missing');
    return {
      identity: { name: r.name, age: r.age },
      profile: {
        goal: r.goal,
        sex: r.sex,
        heightCm: r.height_cm,
        weightKg: r.weight_kg,
        targetKg: r.target_kg,
        experience: r.experience,
        daysPerWeek: r.days_per_week,
      },
      onboardingComplete: r.onboarding_complete === 1,
      updatedAt: r.updated_at,
    };
  }

  async function upsertWeightRow(q: Db, userId: string, w: WeightInput): Promise<void> {
    await q.run('DELETE FROM weights WHERE user_id = ? AND (date_key = ? OR id = ?)', [userId, w.dateKey, w.id]);
    await q.run('INSERT INTO weights (user_id, id, date_key, kg, body_fat, muscle_kg) VALUES (?, ?, ?, ?, ?, ?)', [
      userId,
      w.id,
      w.dateKey,
      w.kg,
      w.bodyFatPercent ?? null,
      w.muscleKg ?? null,
    ]);
  }

  async function listWeights(q: Db, userId: string): Promise<WeightDto[]> {
    const rows = await q.all<WeightRow>(
      'SELECT id, date_key, kg, body_fat, muscle_kg FROM weights WHERE user_id = ? ORDER BY date_key ASC LIMIT 2000',
      [userId],
    );
    return rows.map(toWeight);
  }

  async function write(
    userId: string,
    fields: ProfilePatchFields,
    now: number,
    today: string,
    weightId: string,
    completeOnboarding: boolean,
  ): Promise<UserProfileDto> {
    return db.transaction(async (tx) => {
      await ensure(tx, userId, now);
      const current = await read(tx, userId);
      const next = { ...current.profile, ...fields };
      await tx.run(
        `UPDATE profiles SET goal = ?, sex = ?, height_cm = ?, weight_kg = ?, target_kg = ?, experience = ?,
           days_per_week = ?, onboarding_complete = ?, updated_at = ? WHERE user_id = ?`,
        [
          next.goal,
          next.sex,
          next.heightCm,
          next.weightKg,
          next.targetKg,
          next.experience,
          next.daysPerWeek,
          completeOnboarding || current.onboardingComplete ? 1 : 0,
          now,
          userId,
        ],
      );
      if (fields.weightKg !== undefined && fields.weightKg !== current.profile.weightKg) {
        await upsertWeightRow(tx, userId, { id: weightId, dateKey: today, kg: fields.weightKg });
      }
      return read(tx, userId);
    });
  }

  return {
    /** Creates the default profile if missing (new and pre-existing accounts alike). */
    ensure: (userId: string, now: number) => ensure(db, userId, now),

    async get(userId: string, now: number): Promise<UserProfileDto> {
      await ensure(db, userId, now);
      return read(db, userId);
    },

    /**
     * PUT: replaces the body/goal profile and marks onboarding complete.
     * A changed body weight is a weigh-in, so the weight log stays consistent with the profile.
     */
    replace: (userId: string, fields: ProfileFields, now: number, today: string, weightId: string) =>
      write(userId, fields, now, today, weightId, true),

    /** PATCH: merges a partial update; does not change the onboarding flag. */
    patch: (userId: string, patch: ProfilePatchFields, now: number, today: string, weightId: string) =>
      write(userId, patch, now, today, weightId, false),

    listWeights: (userId: string) => listWeights(db, userId),

    /** One entry per day (latest wins). Current body weight follows the newest dated entry. */
    async logWeight(userId: string, input: WeightInput, now: number): Promise<WeightDto[]> {
      return db.transaction(async (tx) => {
        await ensure(tx, userId, now);
        await upsertWeightRow(tx, userId, input);
        const latest = await tx.get<{ kg: number }>('SELECT kg FROM weights WHERE user_id = ? ORDER BY date_key DESC LIMIT 1', [userId]);
        if (latest) {
          await tx.run('UPDATE profiles SET weight_kg = ?, updated_at = ? WHERE user_id = ?', [latest.kg, now, userId]);
        }
        return listWeights(tx, userId);
      });
    },
  };
}
