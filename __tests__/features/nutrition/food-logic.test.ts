import {
  foodTitle,
  isBarcode,
  mealFromFood,
  parseGrams,
  portionMacros,
  recentFoods,
  toFoodItem,
} from '@/features/nutrition/utils/food.logic';
import type { FoodItem } from '@/features/nutrition/types/food.types';
import type { Meal } from '@/features/nutrition/types/nutrition.types';

const nutella = {
  code: '3017624010701',
  product_name: 'Nutella',
  brands: 'Ferrero, Other',
  serving_quantity: '15',
  nutriments: {
    'energy-kcal_100g': 539,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    fat_100g: 30.9,
  },
};

describe('toFoodItem', () => {
  it('reads a product per 100 g with its first brand and serving size', () => {
    expect(toFoodItem(nutella)).toEqual({
      id: '3017624010701',
      name: 'Nutella',
      brand: 'Ferrero',
      basis: { amountG: 100, kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
      servingG: 15,
      adjustable: true,
    });
  });

  it('converts kilojoules when kilocalories are missing', () => {
    const item = toFoodItem({ ...nutella, nutriments: { energy_100g: 2255 } });
    expect(item?.basis.kcal).toBe(539);
    expect(item?.basis.protein).toBe(0);
  });

  it('accepts numbers sent as strings and ignores bad serving sizes', () => {
    const item = toFoodItem({
      ...nutella,
      serving_quantity: 'lots',
      nutriments: { 'energy-kcal_100g': '120', proteins_100g: '' },
    });
    expect(item?.basis).toMatchObject({ kcal: 120, protein: 0 });
    expect(item?.servingG).toBeUndefined();
  });

  it('drops products it cannot log: no name, no calories, impossible calories, or no barcode', () => {
    expect(toFoodItem({ ...nutella, product_name: '  ' })).toBeNull();
    expect(toFoodItem({ ...nutella, nutriments: {} })).toBeNull();
    expect(toFoodItem({ ...nutella, nutriments: { 'energy-kcal_100g': 5000 } })).toBeNull();
    expect(toFoodItem({ ...nutella, nutriments: { 'energy-kcal_100g': -1 } })).toBeNull();
    expect(toFoodItem({ ...nutella, code: undefined })).toBeNull();
    expect(toFoodItem('nonsense')).toBeNull();
    expect(toFoodItem(null)).toBeNull();
  });
});

describe('portions', () => {
  const basis = { amountG: 100, kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 };

  it('scales nutrition to the amount eaten', () => {
    expect(portionMacros(basis, 100)).toEqual({ kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 });
    expect(portionMacros(basis, 15)).toEqual({ kcal: 81, protein: 0.9, carbs: 8.6, fat: 4.6 });
    expect(portionMacros(basis, 250).kcal).toBe(1348);
  });

  it('reads a typed amount and rejects nonsense', () => {
    expect(parseGrams(' 30 ')).toBe(30);
    expect(parseGrams('12,5')).toBe(12.5);
    for (const bad of ['', '0', '-5', 'abc', '5001', '1.234', '1e3'])
      expect(parseGrams(bad)).toBeNull();
  });

  it('builds the meal to log, with the brand in the title', () => {
    const food = toFoodItem(nutella)!;
    expect(foodTitle(food)).toBe('Nutella (Ferrero)');
    expect(mealFromFood(food, 30, 'snack')).toEqual({
      category: 'snack',
      title: 'Nutella (Ferrero)',
      kcal: 162,
      protein: 1.9,
      carbs: 17.3,
      fat: 9.3,
    });
  });

  it('logs a recent meal again exactly as it was', () => {
    const meal: Meal = {
      id: 'm1',
      category: 'lunch',
      title: 'Chicken bowl',
      loggedAt: 1,
      kcal: 600,
      protein: 45,
      carbs: 60,
      fat: 15,
    };
    const [food] = recentFoods([meal]);
    expect(food).toMatchObject({ name: 'Chicken bowl', adjustable: false });
    expect(mealFromFood(food!, 999, 'dinner')).toEqual({
      category: 'dinner',
      title: 'Chicken bowl',
      kcal: 600,
      protein: 45,
      carbs: 60,
      fat: 15,
    });
  });
});

describe('recent foods', () => {
  const meal = (id: string, title: string, loggedAt: number, kcal = 500): Meal => ({
    id,
    category: 'lunch',
    title,
    loggedAt,
    kcal,
    protein: 1,
    carbs: 1,
    fat: 1,
  });

  it('lists newest first, once per meal, capped', () => {
    const meals = [
      meal('a', 'Oats', 1),
      meal('b', 'Rice', 3),
      meal('c', 'Oats', 2),
      meal('d', 'Oats', 5, 400),
    ];
    const out = recentFoods(meals);
    expect(out.map((f) => f.name)).toEqual(['Oats', 'Rice', 'Oats']);
    expect(out[0]!.basis.kcal).toBe(400);
    expect(
      recentFoods(
        Array.from({ length: 40 }, (_, i) => meal(`m${i}`, `Food ${i}`, i)),
        15,
      ),
    ).toHaveLength(15);
  });
});

describe('barcodes', () => {
  it('accepts 8 to 14 digits only', () => {
    expect(isBarcode('3017624010701')).toBe(true);
    expect(isBarcode(' 12345678 ')).toBe(true);
    for (const bad of ['1234567', '123456789012345', '30176240107O1', '', '1234 5678'])
      expect(isBarcode(bad)).toBe(false);
  });
});

describe('FoodItem shape', () => {
  it('is serialisable', () => {
    const item: FoodItem | null = toFoodItem(nutella);
    expect(JSON.parse(JSON.stringify(item))).toEqual(item);
  });
});
