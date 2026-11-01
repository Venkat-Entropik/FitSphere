import type { DatabaseSync } from 'node:sqlite';

import { transaction } from '../db.js';
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

export function createNutritionRepository(db: DatabaseSync) {
  function day(userId: string, dateKey: string): NutritionDayDto {
    const meals = (
      db
        .prepare('SELECT data FROM nutrition_foods WHERE user_id = ? AND date_key = ? ORDER BY logged_at ASC, id ASC')
        .all(userId, dateKey) as { data: string }[]
    ).map((r) => JSON.parse(r.data) as MealDto);
    const water = db.prepare('SELECT ml FROM nutrition_water WHERE user_id = ? AND date_key = ?').get(userId, dateKey) as
      | { ml: number }
      | undefined;
    return { dateKey, meals, hydrationMl: water?.ml ?? 0 };
  }

  return {
    getDay: day,

    /**
     * Idempotent by meal id: re-posting an id replaces that meal (even if it moved days).
     * Returns null when the day is already full.
     */
    logMeal(userId: string, dateKey: string, meal: MealDto): NutritionDayDto | null {
      return transaction(db, () => {
        const existing = db.prepare('SELECT 1 FROM nutrition_foods WHERE user_id = ? AND id = ?').get(userId, meal.id);
        if (!existing) {
          const { n } = db
            .prepare('SELECT COUNT(*) AS n FROM nutrition_foods WHERE user_id = ? AND date_key = ?')
            .get(userId, dateKey) as { n: number };
          if (n >= MAX_MEALS_PER_DAY) return null;
        }
        db.prepare(
          `INSERT INTO nutrition_foods (user_id, id, date_key, logged_at, data) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (user_id, id) DO UPDATE SET date_key = excluded.date_key, logged_at = excluded.logged_at, data = excluded.data`,
        ).run(userId, meal.id, dateKey, meal.loggedAt ?? 0, JSON.stringify(meal));
        return day(userId, dateKey);
      });
    },

    /** Deleting something that is already gone is fine; the day is returned either way. */
    removeMeal(userId: string, dateKey: string, mealId: string): NutritionDayDto {
      db.prepare('DELETE FROM nutrition_foods WHERE user_id = ? AND id = ? AND date_key = ?').run(userId, mealId, dateKey);
      return day(userId, dateKey);
    },

    /** Adds (or, if negative, removes) water, clamped to 0..MAX_WATER_ML. */
    addWater(userId: string, dateKey: string, ml: number): NutritionDayDto {
      return transaction(db, () => {
        const current = db.prepare('SELECT ml FROM nutrition_water WHERE user_id = ? AND date_key = ?').get(userId, dateKey) as
          | { ml: number }
          | undefined;
        const next = Math.min(MAX_WATER_ML, Math.max(0, (current?.ml ?? 0) + ml));
        db.prepare(
          `INSERT INTO nutrition_water (user_id, date_key, ml) VALUES (?, ?, ?)
           ON CONFLICT (user_id, date_key) DO UPDATE SET ml = excluded.ml`,
        ).run(userId, dateKey, next);
        return day(userId, dateKey);
      });
    },
  };
}
