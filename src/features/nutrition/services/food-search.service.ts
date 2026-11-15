import { Platform } from 'react-native';

import { env } from '@/config/env';
import { apiClient } from '@/services/api/api-client';

import type { FoodItem, FoodSearchFailure } from '../types/food.types';
import { isBarcode, toFoodItem } from '../utils/food.logic';

const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,brands,nutriments,serving_quantity,serving_size';
const TIMEOUT_MS = 12_000;
/** Open Food Facts asks apps to identify themselves; browsers set their own User-Agent. */
const USER_AGENT = 'FitSphere/1.0 (https://github.com/Venkat-Entropik/FitSphere)';

export class FoodSearchError extends Error {
  constructor(readonly kind: FoodSearchFailure) {
    super(
      kind === 'offline'
        ? 'Food search needs an internet connection. You can still add food manually.'
        : kind === 'rate_limited'
          ? 'Too many searches. Wait a minute and try again.'
          : 'The food database is not responding. Try again soon, or add the food manually.',
    );
    this.name = 'FoodSearchError';
  }
}

async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(Platform.OS !== 'web' && { 'User-Agent': USER_AGENT }),
      },
    });
    if (response.status === 429) throw new FoodSearchError('rate_limited');
    if (!response.ok) throw new FoodSearchError('unavailable');
    return await response.json();
  } catch (error) {
    if (error instanceof FoodSearchError) throw error;
    // fetch rejects with a TypeError when there is no connection, and with an abort when we time out.
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new FoodSearchError(aborted ? 'unavailable' : 'offline');
  } finally {
    clearTimeout(timer);
  }
}

async function getViaServer(text: string): Promise<unknown> {
  try {
    const { data } = await apiClient.get('/foods/search', { params: { q: text }, timeout: 15_000 });
    return data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 429) throw new FoodSearchError('rate_limited');
    if (status === undefined) throw new FoodSearchError('offline');
    throw new FoodSearchError('unavailable');
  }
}

export interface FoodSearchService {
  /** Packaged foods matching the text. Foods without usable nutrition data are left out. */
  search(query: string): Promise<FoodItem[]>;
  /** The product for a barcode, or null if the database doesn't know it or has no nutrition data. */
  byBarcode(barcode: string): Promise<FoodItem | null>;
}

/** Open Food Facts (https://world.openfoodfacts.org), a public database of packaged foods. */
export const foodSearchService: FoodSearchService = {
  async search(query) {
    const text = query.trim();
    if (text.length < 2) return [];
    // Browsers can't call the text search directly (no CORS), so the web build asks our server.
    const viaServer = Platform.OS === 'web' && !env.useMocks;
    const url = viaServer
      ? ''
      : `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(text)}&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
    const body = (viaServer ? await getViaServer(text) : await getJson(url)) as {
      products?: unknown[];
    } | null;
    const items = (body?.products ?? []).map(toFoodItem).filter((f): f is FoodItem => f !== null);
    // The same product can appear twice; keep the first of each barcode.
    return items.filter((f, i) => items.findIndex((x) => x.id === f.id) === i);
  },

  async byBarcode(barcode) {
    const code = barcode.trim();
    if (!isBarcode(code)) return null;
    const body = (await getJson(`${BASE}/api/v2/product/${code}?fields=${FIELDS}`)) as {
      status?: number;
      product?: unknown;
    } | null;
    if (!body || body.status !== 1 || !body.product) return null;
    return toFoodItem({ ...(body.product as object), code });
  },
};
