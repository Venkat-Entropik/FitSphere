import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MEAL_CATALOG } from '@/features/nutrition/services/meal-catalog.mock';
import { nutritionService } from '@/features/nutrition/services/nutrition.service';
import { NutritionScreen } from '@/features/nutrition/screens/NutritionScreen';
import type { Meal } from '@/features/nutrition/types/nutrition.types';
import {
  addWaterToRecord,
  composeDay,
  consumedKcal,
  consumedMacros,
  emptyDay,
  formatLitres,
  kcalLeft,
  loggedLabel,
  macroTip,
  nextMealCategory,
  percent,
  recommendMeal,
  removeMeal,
} from '@/features/nutrition/utils/nutrition.logic';
import { quickAddSchema, toNewMeal } from '@/features/nutrition/utils/quick-add.schema';
import { DEFAULT_DRAFT } from '@/services/mock-db/seed';
import { nutritionTargets } from '@/features/profile/utils/profile.logic';
import { dateKey } from '@/utils/date';

const profile = { ...DEFAULT_DRAFT, updatedAt: 0 };
const targets = nutritionTargets(profile.profile, profile.identity.age);

const meal = (
  id: string,
  category: Meal['category'],
  kcal: number,
  protein: number,
  carbs = 0,
  fat = 0,
): Meal => ({
  id,
  category,
  title: id,
  loggedAt: Number(id.replace(/\D/g, '')) || 1,
  kcal,
  protein,
  carbs,
  fat,
});

const threeMeals = [
  meal('m1', 'breakfast', 620, 42, 48, 18),
  meal('m2', 'lunch', 780, 52, 84, 16),
  meal('m3', 'snack', 280, 28, 32, 3),
];

describe('nutrition logic', () => {
  const day = composeDay({ dateKey: 'k', meals: threeMeals, hydrationMl: 2400 }, profile, targets);

  it('derives totals and targets from meals and the profile', () => {
    expect(day.budgetKcal).toBe(2600);
    expect(consumedKcal(day.meals)).toBe(1680);
    expect(consumedMacros(day.meals)).toEqual({ protein: 122, carbs: 164, fat: 37 });
    expect(kcalLeft(day)).toBe(920);
    expect(loggedLabel(day)).toBe('3 of 4 logged');
    expect(day.athleteName).toBe('Alex');
    expect(day.goalLabel).toBe('Muscle Hypertrophy');
  });

  it('caps percentages and tolerates a zero target', () => {
    expect(percent(150, 100)).toBe(100);
    expect(percent(5, 0)).toBe(0);
  });

  it('formats litres rounding half up', () => {
    expect(formatLitres(2650)).toBe('2.7');
    expect(formatLitres(2400)).toBe('2.4');
  });

  it('only reports a protein shortfall when meaningful', () => {
    expect(macroTip(day).shortfallG).toBe(18);
    expect(macroTip({ ...day, macroTargets: { ...day.macroTargets, protein: 125 } }).text).toMatch(
      /on target/,
    );
  });

  it('adds and removes entries immutably, bounding water', () => {
    const rec = { dateKey: 'k', meals: threeMeals, hydrationMl: 100 };
    expect(removeMeal(rec, 'm2').meals.map((m) => m.id)).toEqual(['m1', 'm3']);
    expect(rec.meals).toHaveLength(3);
    expect(addWaterToRecord(rec, -500, 3500).hydrationMl).toBe(0);
    expect(addWaterToRecord(rec, 99_999, 3500).hydrationMl).toBe(7000);
  });
});

describe('recommendMeal', () => {
  it('fills the first open slot in order', () => {
    expect(nextMealCategory([])).toBe('breakfast');
    expect(nextMealCategory(threeMeals)).toBe('dinner');
    expect(nextMealCategory([...threeMeals, meal('m4', 'dinner', 600, 40)])).toBeNull();
  });

  it('recommends a dinner sized to what is left, and none once everything is logged', () => {
    const rec = recommendMeal(threeMeals, targets)!;
    expect(rec.category).toBe('dinner');
    // Only 18 g of protein is still needed, so the lowest-protein dinner fits best.
    expect(rec.id).toBe('cat-tofu');
    expect(recommendMeal([...threeMeals, meal('m4', 'dinner', 600, 40)], targets)).toBeNull();
  });

  it('picks a protein-rich meal when a lot of protein is still needed', () => {
    const rec = recommendMeal([meal('m1', 'breakfast', 400, 20)], targets)!;
    expect(rec.category).toBe('lunch');
    expect(rec.id).toBe('cat-wrap'); // closest to ~733 kcal and ~40 g protein per remaining slot
  });

  it('prefers a lighter option when little of the budget remains', () => {
    const heavyDay = [
      meal('m1', 'breakfast', 900, 40),
      meal('m2', 'lunch', 900, 40),
      meal('m3', 'snack', 300, 20),
    ];
    const rec = recommendMeal(heavyDay, targets)!;
    expect(rec.kcal).toBeLessThanOrEqual(650);
  });

  it('only suggests meals from the catalog for that category', () => {
    const rec = recommendMeal([], targets)!;
    expect(MEAL_CATALOG.some((m) => m.id === rec.id && m.category === 'breakfast')).toBe(true);
  });
});

describe('nutritionService (mock database)', () => {
  const key = dateKey(Date.now());

  it('returns an empty day when nothing is logged and persists writes', async () => {
    expect(await nutritionService.getDay('2000-01-01')).toEqual(emptyDay('2000-01-01'));
    const after = await nutritionService.logMeal(
      '2000-01-01',
      { category: 'lunch', title: 'Soup', kcal: 300, protein: 10, carbs: 40, fat: 8 },
      5,
    );
    expect(after.meals).toHaveLength(1);
    expect((await nutritionService.getDay('2000-01-01')).meals[0]).toMatchObject({
      title: 'Soup',
      loggedAt: 5,
    });
  });

  it('removes meals and adds water to today', async () => {
    const day = await nutritionService.getDay(key);
    const after = await nutritionService.removeMeal(key, day.meals[0]!.id);
    expect(after.meals).toHaveLength(day.meals.length - 1);
    expect((await nutritionService.addWater(key, 250, 3400)).hydrationMl).toBe(
      day.hydrationMl + 250,
    );
  });
});

describe('quick add schema', () => {
  const valid = {
    title: 'Greek yogurt',
    category: 'snack',
    kcal: '150',
    protein: '15',
    carbs: '',
    fat: '',
  };

  it('accepts a valid entry and converts blanks to 0', () => {
    expect(toNewMeal(quickAddSchema.parse(valid))).toEqual({
      title: 'Greek yogurt',
      category: 'snack',
      kcal: 150,
      protein: 15,
      carbs: 0,
      fat: 0,
    });
  });

  it.each([
    [{ title: 'x' }, 'title'],
    [{ kcal: '' }, 'kcal'],
    [{ kcal: '0' }, 'kcal'],
    [{ kcal: '12abc' }, 'kcal'],
    [{ kcal: '9000' }, 'kcal'],
    [{ protein: '-5' }, 'protein'],
  ])('rejects %p', (override, field) => {
    const result = quickAddSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path[0] === field)).toBe(true);
  });
});

describe('NutritionScreen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <NutritionScreen />
      </QueryClientProvider>,
    );
  };

  it('adds water and persists it', async () => {
    await renderScreen();
    expect(await screen.findByLabelText('2.4 litres')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add 250 millilitres of water' }));
    expect(await screen.findByLabelText('2.7 litres')).toBeTruthy();
  });

  it('logs the recommended meal, updating totals and clearing the suggestion', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Log Recommended Dinner' }));
    await waitFor(() => expect(screen.getByText('4 of 4 logged')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Log Recommended Dinner' })).toBeNull();
  });

  it('validates the quick-add form before saving', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Quick Add Food' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to today' }));
    expect(await screen.findByText('Enter a food name')).toBeTruthy();
    expect(screen.getByText('Enter calories')).toBeTruthy();
    expect(screen.getByText('3 of 4 logged')).toBeTruthy();
  });

  it('saves a valid quick-add entry', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Quick Add Food' }));
    await fireEvent.changeText(await screen.findByLabelText('Food'), 'Greek yogurt');
    await fireEvent.changeText(screen.getByLabelText('Calories'), '150');
    await fireEvent.press(screen.getByRole('button', { name: 'Add to today' }));
    await waitFor(() => expect(screen.getByText('Greek yogurt')).toBeTruthy());
  });
});
