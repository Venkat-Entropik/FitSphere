import type { Macros } from './nutrition.types';

/** What a food's nutrition numbers are measured over. */
export interface FoodBasis extends Macros {
  /** The amount these numbers describe, in grams (100 for packaged foods). */
  amountG: number;
  kcal: number;
}

/** Something the user can log: a packaged food from the database, or a meal they logged before. */
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  basis: FoodBasis;
  /** One serving in grams, when the product says so. */
  servingG?: number;
  /** False for "log it again as it was": the amount can't be changed. */
  adjustable: boolean;
}

export type FoodSearchFailure = 'offline' | 'rate_limited' | 'unavailable';
