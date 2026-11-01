import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { buildMockDay } from '@/features/nutrition/services/nutrition.mock';
import { resetMockNutrition } from '@/features/nutrition/services/nutrition.service';
import { NutritionScreen } from '@/features/nutrition/screens/NutritionScreen';
import {
  addWater,
  consumedKcal,
  consumedMacros,
  formatLitres,
  kcalLeft,
  logRecommendation,
  loggedLabel,
  macroTip,
  percent,
} from '@/features/nutrition/utils/nutrition.logic';
import { quickAddSchema, toNewMeal } from '@/features/nutrition/utils/quick-add.schema';

describe('nutrition logic', () => {
  const day = buildMockDay();

  it('derives totals from logged meals', () => {
    expect(consumedKcal(day.meals)).toBe(1680);
    expect(consumedMacros(day.meals)).toEqual({ protein: 122, carbs: 164, fat: 37 });
    expect(kcalLeft(day)).toBe(920);
    expect(loggedLabel(day)).toBe('3 of 4 logged');
  });

  it('caps percentages and tolerates a zero target', () => {
    expect(percent(150, 100)).toBe(100);
    expect(percent(5, 0)).toBe(0);
  });

  it('logging the recommendation adds the meal and clears the upcoming slot', () => {
    const next = logRecommendation(day, 123);
    expect(next.recommendation).toBeNull();
    expect(consumedKcal(next.meals)).toBe(2150);
    expect(next.meals.at(-1)).toMatchObject({
      title: 'Salmon Fillet with Sweet Potato',
      loggedAt: 123,
    });
    expect(loggedLabel(next)).toBe('4 of 4 logged');
    expect(logRecommendation(next, 456)).toBe(next);
  });

  it('adds water within sane bounds', () => {
    expect(formatLitres(addWater(day, 250).hydrationMl)).toBe('2.7');
    expect(addWater(day, -10_000).hydrationMl).toBe(0);
    expect(addWater(day, 99_999).hydrationMl).toBe(day.hydrationGoalMl * 2);
  });

  it('only reports a protein shortfall when it is meaningful', () => {
    expect(macroTip(day).shortfallG).toBe(18);
    const met = { ...day, macroTargets: { ...day.macroTargets, protein: 125 } };
    expect(macroTip(met).shortfallG).toBe(3);
    expect(macroTip(met).text).toMatch(/on target/);
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
    const parsed = quickAddSchema.parse(valid);
    expect(toNewMeal(parsed)).toEqual({
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
  beforeEach(() => resetMockNutrition());

  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <NutritionScreen />
      </QueryClientProvider>,
    );
  };

  it('adds water', async () => {
    await renderScreen();
    expect(await screen.findByLabelText('2.4 litres')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add 250 millilitres of water' }));
    expect(await screen.findByLabelText('2.7 litres')).toBeTruthy();
  });

  it('logs the recommended dinner and updates totals', async () => {
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
