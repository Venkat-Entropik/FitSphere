import {
  FoodSearchError,
  foodSearchService,
} from '@/features/nutrition/services/food-search.service';

const ok = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;
const product = (code: string, name: string, kcal: number) => ({
  code,
  product_name: name,
  nutriments: { 'energy-kcal_100g': kcal, proteins_100g: 5, carbohydrates_100g: 10, fat_100g: 2 },
});

let fetchMock: jest.SpiedFunction<typeof fetch>;
beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});
afterEach(() => jest.restoreAllMocks());

describe('foodSearchService.search', () => {
  it('asks the Open Food Facts search with the typed words and returns loggable foods once each', async () => {
    fetchMock.mockResolvedValue(
      ok({
        products: [
          product('111', 'Greek Yogurt', 60),
          product('111', 'Greek Yogurt', 60),
          { code: '222', product_name: 'No energy' },
        ],
      }),
    );
    const out = await foodSearchService.search('  greek yogurt ');
    expect(out.map((f) => f.id)).toEqual(['111']);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain('https://world.openfoodfacts.org/cgi/search.pl');
    expect(url).toContain('search_terms=greek%20yogurt');
    expect(url).toContain('fields=code,product_name,brands,nutriments');
  });

  it('does not call the network for a one-letter query', async () => {
    expect(await foodSearchService.search('a')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('copes with an empty or odd response', async () => {
    fetchMock.mockResolvedValue(ok({}));
    expect(await foodSearchService.search('milk')).toEqual([]);
    fetchMock.mockResolvedValue(ok(null));
    expect(await foodSearchService.search('milk')).toEqual([]);
  });

  it('explains each way it can fail', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(foodSearchService.search('milk')).rejects.toMatchObject({ kind: 'offline' });
    fetchMock.mockResolvedValue(ok({}, 429));
    await expect(foodSearchService.search('milk')).rejects.toMatchObject({ kind: 'rate_limited' });
    fetchMock.mockResolvedValue(ok({}, 503));
    await expect(foodSearchService.search('milk')).rejects.toMatchObject({ kind: 'unavailable' });
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    fetchMock.mockRejectedValue(abort);
    await expect(foodSearchService.search('milk')).rejects.toBeInstanceOf(FoodSearchError);
    await expect(foodSearchService.search('milk')).rejects.toMatchObject({ kind: 'unavailable' });
  });
});

describe('foodSearchService.byBarcode', () => {
  it('finds a product by its barcode', async () => {
    fetchMock.mockResolvedValue(ok({ status: 1, product: product('ignored', 'Nutella', 539) }));
    const food = await foodSearchService.byBarcode('3017624010701');
    expect(food).toMatchObject({ id: '3017624010701', name: 'Nutella' });
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/api/v2/product/3017624010701?fields=');
  });

  it('returns null for an unknown product, one without nutrition data, or a malformed code', async () => {
    fetchMock.mockResolvedValue(ok({ status: 0 }));
    expect(await foodSearchService.byBarcode('3017624010701')).toBeNull();
    fetchMock.mockResolvedValue(
      ok({ status: 1, product: { product_name: 'Mystery', nutriments: {} } }),
    );
    expect(await foodSearchService.byBarcode('3017624010701')).toBeNull();
    fetchMock.mockClear();
    expect(await foodSearchService.byBarcode('abc')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws a readable error when offline', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(foodSearchService.byBarcode('3017624010701')).rejects.toThrow(
      /internet connection/,
    );
  });
});
