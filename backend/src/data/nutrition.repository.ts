import type { Db } from '../db.js';
import { MAX_MEALS_PER_DAY, MAX_WATER_ML } from './schemas.js';

export interface MealDto {
  id: string;
  category: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  title: string;
  loggedAt: number | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionDayDto {
  dateKey: string;
  meals: MealDto[];
  hydrationMl: number;
}

export type NutritionRepository = ReturnType<typeof createNutritionRepository>;

export function createNutritionRepository(db: Db) {
  async function day(q: Db, userId: string, dateKey: string): Promise<NutritionDayDto> {
    const meals = (
      await q.all<{ data: string }>(
        'SELECT data FROM nutrition_foods WHERE user_id = ? AND date_key = ? ORDER BY logged_at ASC, id ASC',
        [userId, dateKey],
      )
    ).map((r) => JSON.parse(r.data) as MealDto);
    const water = await q.get<{ ml: number }>('SELECT ml FROM nutrition_water WHERE user_id = ? AND date_key = ?', [userId, dateKey]);
    return { dateKey, meals, hydrationMl: water?.ml ?? 0 };
  }

  return {
    getDay: (userId: string, dateKey: string) => day(db, userId, dateKey),

    /**
     * Idempotent by meal id: re-posting an id replaces that meal (even if it moved days).
     * Returns null when the day is already full.
     */
    async logMeal(userId: string, dateKey: string, meal: MealDto): Promise<NutritionDayDto | null> {
      return db.transaction(async (tx) => {
        const existing = await tx.get('SELECT 1 AS one FROM nutrition_foods WHERE user_id = ? AND id = ?', [userId, meal.id]);
        if (!existing) {
          const row = await tx.get<{ n: number }>('SELECT COUNT(*) AS n FROM nutrition_foods WHERE user_id = ? AND date_key = ?', [userId, dateKey]);
          if ((row?.n ?? 0) >= MAX_MEALS_PER_DAY) return null;
        }
        await tx.run(
          `INSERT INTO nutrition_foods (user_id, id, date_key, logged_at, data) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (user_id, id) DO UPDATE SET date_key = excluded.date_key, logged_at = excluded.logged_at, data = excluded.data`,
          [userId, meal.id, dateKey, meal.loggedAt ?? 0, JSON.stringify(meal)],
        );
        return day(tx, userId, dateKey);
      });
    },

    /** Deleting something that is already gone is fine; the day is returned either way. */
    async removeMeal(userId: string, dateKey: string, mealId: string): Promise<NutritionDayDto> {
      await db.run('DELETE FROM nutrition_foods WHERE user_id = ? AND id = ? AND date_key = ?', [userId, mealId, dateKey]);
      return day(db, userId, dateKey);
    },

    /**
     * Adds (or, if negative, removes) water, clamped to 0..MAX_WATER_ML. With an `eventId`, a repeat of the
     * same event changes nothing, so a request retried after a dropped connection is not counted twice.
     */
    async addWater(userId: string, dateKey: string, ml: number, eventId?: string): Promise<NutritionDayDto> {
      return db.transaction(async (tx) => {
        if (eventId) {
          const fresh = await tx.run(
            'INSERT INTO nutrition_water_events (user_id, id) VALUES (?, ?) ON CONFLICT (user_id, id) DO NOTHING',
            [userId, eventId],
          );
          if (fresh === 0) return day(tx, userId, dateKey);
        }
        await tx.run(
          `INSERT INTO nutrition_water (user_id, date_key, ml) VALUES (?, ?, LEAST(?, GREATEST(0, ?)))
           ON CONFLICT (user_id, date_key) DO UPDATE SET ml = LEAST(?, GREATEST(0, nutrition_water.ml + ?))`,
          [userId, dateKey, MAX_WATER_ML, ml, MAX_WATER_ML, ml],
        );
        return day(tx, userId, dateKey);
      });
    },

    /** Every day in [from, to] that has food or water logged, oldest first. Used to catch a device up in one request. */
    async getRange(userId: string, from: string, to: string): Promise<NutritionDayDto[]> {
      const foods = await db.all<{ date_key: string; data: string }>(
        'SELECT date_key, data FROM nutrition_foods WHERE user_id = ? AND date_key >= ? AND date_key <= ? ORDER BY date_key ASC, logged_at ASC, id ASC',
        [userId, from, to],
      );
      const water = await db.all<{ date_key: string; ml: number }>(
        'SELECT date_key, ml FROM nutrition_water WHERE user_id = ? AND date_key >= ? AND date_key <= ?',
        [userId, from, to],
      );
      const days = new Map<string, NutritionDayDto>();
      const ensure = (dateKey: string) => {
        let d = days.get(dateKey);
        if (!d) days.set(dateKey, (d = { dateKey, meals: [], hydrationMl: 0 }));
        return d;
      };
      for (const f of foods) ensure(f.date_key).meals.push(JSON.parse(f.data) as MealDto);
      for (const w of water) ensure(w.date_key).hydrationMl = w.ml;
      return [...days.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    },
  };
}
