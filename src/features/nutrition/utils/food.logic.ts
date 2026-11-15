import { z } from 'zod';

import type { FoodBasis, FoodItem } from '../types/food.types';
import type { Meal, Macros, NewMealInput } from '../types/nutrition.types';

export const MAX_PORTION_G = 5000;
const KJ_PER_KCAL = 4.184;

/** Open Food Facts sends numbers as numbers or strings, and leaves many fields out. */
const maybeNumber = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  // A field that isn't a number is treated as missing, so one bad value never discards a whole product.
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

export const productSchema = z
  .object({
    code: z.string().optional(),
    product_name: z.string().optional(),
    brands: z.string().optional(),
    serving_size: z.string().optional(),
    serving_quantity: maybeNumber,
    nutriments: z
      .object({
        'energy-kcal_100g': maybeNumber,
        energy_100g: maybeNumber,
        proteins_100g: maybeNumber,
        carbohydrates_100g: maybeNumber,
        fat_100g: maybeNumber,
      })
      .partial()
      .optional(),
  })
  .loose();

const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Turns a database product into something loggable. Returns null when there is no usable name or
 * calorie figure, so the list never shows a food the user cannot log.
 */
export function toFoodItem(raw: unknown): FoodItem | null {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;
  const name = clean(p.product_name);
  const n = p.nutriments ?? {};
  const kcal =
    n['energy-kcal_100g'] ??
    (n.energy_100g !== undefined ? n.energy_100g / KJ_PER_KCAL : undefined);
  if (!name || kcal === undefined || kcal < 0 || kcal > 1000 || !p.code) return null;
  const serving = p.serving_quantity;
  const brand = clean(p.brands?.split(',')[0]);
  return {
    id: p.code,
    name: name.slice(0, 80),
    ...(brand && { brand: brand.slice(0, 40) }),
    basis: {
      amountG: 100,
      kcal: Math.round(kcal),
      protein: round1(Math.max(0, n.proteins_100g ?? 0)),
      carbs: round1(Math.max(0, n.carbohydrates_100g ?? 0)),
      fat: round1(Math.max(0, n.fat_100g ?? 0)),
    },
    ...(serving !== undefined && serving > 0 && serving <= 2000 && { servingG: serving }),
    adjustable: true,
  };
}

/** The nutrition for an amount of food, rounded the way the log shows it. */
export function portionMacros(basis: FoodBasis, grams: number): Macros & { kcal: number } {
  const k = basis.amountG > 0 ? grams / basis.amountG : 0;
  return {
    kcal: Math.round(basis.kcal * k),
    protein: round1(basis.protein * k),
    carbs: round1(basis.carbs * k),
    fat: round1(basis.fat * k),
  };
}

/** Parses an amount typed by the user. Null for blank, negative, zero or absurd values. */
export function parseGrams(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n <= MAX_PORTION_G ? n : null;
}

export const foodTitle = (food: FoodItem): string =>
  (food.brand ? `${food.name} (${food.brand})` : food.name).slice(0, 120);

/** The meal to log for an amount of a food. */
export function mealFromFood(
  food: FoodItem,
  grams: number,
  category: NewMealInput['category'],
): NewMealInput {
  const m = food.adjustable ? portionMacros(food.basis, grams) : food.basis;
  return {
    category,
    title: foodTitle(food),
    kcal: m.kcal,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
  };
}

/** A meal logged before, offered again as one tap. Newest first, one per title and calorie count. */
export function recentFoods(
  meals: readonly (Meal & { dateKey?: string })[],
  limit = 15,
): FoodItem[] {
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const meal of [...meals].sort((a, b) => (b.loggedAt ?? 0) - (a.loggedAt ?? 0))) {
    const key = `${meal.title}|${meal.kcal}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `recent-${meal.id}`,
      name: meal.title,
      basis: {
        amountG: 1,
        kcal: meal.kcal,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
      adjustable: false,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Barcodes are 8 to 14 digits (EAN-8, UPC-A/E, EAN-13, ITF-14). */
export const isBarcode = (raw: string): boolean => /^\d{8,14}$/.test(raw.trim());
