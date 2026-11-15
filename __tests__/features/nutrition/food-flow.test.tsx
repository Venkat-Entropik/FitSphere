import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { NutritionScreen } from '@/features/nutrition/screens/NutritionScreen';
import {
  FoodSearchError,
  foodSearchService,
} from '@/features/nutrition/services/food-search.service';
import type { FoodItem } from '@/features/nutrition/types/food.types';
import { useMockDb } from '@/services/mock-db/mock-db';
import { dateKey } from '@/utils/date';

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: false, canAskAgain: true }, jest.fn()],
}));

const yogurt: FoodItem = {
  id: '111',
  name: 'Greek Yogurt',
  brand: 'Fage',
  basis: { amountG: 100, kcal: 60, protein: 10, carbs: 4, fat: 0.5 },
  servingG: 170,
  adjustable: true,
};

const today = () => useMockDb.getState().nutritionDays[dateKey(Date.now())]?.meals ?? [];

const renderScreen = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <NutritionScreen />
    </QueryClientProvider>,
  );
};

const openAddFood = async () =>
  fireEvent.press(await screen.findByRole('button', { name: 'Add Food' }));

beforeEach(() => jest.restoreAllMocks());

describe('adding food from the database', () => {
  it('searches, shows the nutrition for the amount, and logs it under the next open meal', async () => {
    const search = jest.spyOn(foodSearchService, 'search').mockResolvedValue([yogurt]);
    await renderScreen();
    const before = today().length;
    await openAddFood();
    await fireEvent.changeText(await screen.findByLabelText('Search foods'), 'greek yogurt');
    await fireEvent.press(screen.getByRole('button', { name: 'Search' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Greek Yogurt, Fage' }));
    expect(search).toHaveBeenCalledWith('greek yogurt');

    // The sheet opens on one serving (170 g); change it to 150 g and watch the numbers follow.
    const amount = await screen.findByLabelText('Amount (grams)');
    expect(amount.props.value).toBe('170');
    await fireEvent.changeText(amount, '150');
    const nutrition = screen.getByLabelText('Nutrition for this amount');
    // Calories, protein, carbs, fat for 150 g of a food with 60 kcal / 10 g protein per 100 g.
    expect(nutrition).toHaveTextContent(/^90Calories15 gProtein6 gCarbs0\.8 gFat$/);

    // Dinner is the next slot still empty in the sample day.
    await fireEvent.press(screen.getByRole('button', { name: 'Add to today' }));
    await waitFor(() => expect(today()).toHaveLength(before + 1));
    expect(today().at(-1)).toMatchObject({
      title: 'Greek Yogurt (Fage)',
      category: 'dinner',
      kcal: 90,
      protein: 15,
      carbs: 6,
      fat: 0.8,
    });
  });

  it('refuses an impossible amount', async () => {
    jest.spyOn(foodSearchService, 'search').mockResolvedValue([yogurt]);
    await renderScreen();
    await openAddFood();
    await fireEvent.changeText(await screen.findByLabelText('Search foods'), 'yogurt');
    await fireEvent.press(screen.getByRole('button', { name: 'Search' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Greek Yogurt, Fage' }));
    await fireEvent.changeText(await screen.findByLabelText('Amount (grams)'), '0');
    expect(screen.getByText('Enter an amount from 1 to 5000 g')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Add to today' }).props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('says so when nothing matches, and when the database is unreachable', async () => {
    const search = jest.spyOn(foodSearchService, 'search').mockResolvedValue([]);
    await renderScreen();
    await openAddFood();
    await fireEvent.changeText(await screen.findByLabelText('Search foods'), 'zzzz');
    await fireEvent.press(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText(/No foods found/)).toBeTruthy();

    search.mockRejectedValue(new FoodSearchError('offline'));
    await fireEvent.changeText(screen.getByLabelText('Search foods'), 'milk');
    await fireEvent.press(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText(/needs an internet connection/)).toBeTruthy();
    // The other ways to add food are still offered.
    expect(screen.getByRole('button', { name: 'Add manually' })).toBeTruthy();
  });

  it('credits Open Food Facts', async () => {
    await renderScreen();
    await openAddFood();
    expect(await screen.findByText(/Open Food Facts \(ODbL\)/)).toBeTruthy();
  });
});

describe('recent meals', () => {
  it('offers meals from the log again, logged exactly as before', async () => {
    await renderScreen();
    const before = today().length;
    await openAddFood();
    expect(await screen.findByText('Recent meals')).toBeTruthy();
    const first = today()[0]!;
    await fireEvent.press(await screen.findByRole('button', { name: first.title }));
    expect(await screen.findByText('Logged again exactly as before.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add to today' }));
    await waitFor(() => expect(today()).toHaveLength(before + 1));
    expect(today().at(-1)).toMatchObject({
      title: first.title,
      kcal: first.kcal,
      protein: first.protein,
    });
  });
});

describe('barcode lookup', () => {
  const openScanner = async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Scan Barcode' }));
  };

  it('explains how to continue without camera access, and looks up a typed barcode', async () => {
    const lookup = jest.spyOn(foodSearchService, 'byBarcode').mockResolvedValue(yogurt);
    await openScanner();
    expect(await screen.findByText(/Allow camera access to scan a barcode/)).toBeTruthy();
    const lookupButton = screen.getByRole('button', { name: 'Look up barcode' });
    expect(lookupButton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(
      screen.getByLabelText('Or type the barcode number'),
      '3017624010701',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Look up barcode' }));
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('3017624010701'));
    expect(await screen.findByLabelText('Amount (grams)')).toBeTruthy();
  });

  it('tells the user when a product is not found, and keeps the form so they can retry', async () => {
    jest.spyOn(foodSearchService, 'byBarcode').mockResolvedValue(null);
    await openScanner();
    await fireEvent.changeText(
      await screen.findByLabelText('Or type the barcode number'),
      '3017624010701',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Look up barcode' }));
    expect(await screen.findByText(/No product with nutrition data was found/)).toBeTruthy();
    expect(screen.getByLabelText('Or type the barcode number')).toBeTruthy();
  });

  it('shows the connection problem instead of failing silently', async () => {
    jest.spyOn(foodSearchService, 'byBarcode').mockRejectedValue(new FoodSearchError('offline'));
    await openScanner();
    await fireEvent.changeText(
      await screen.findByLabelText('Or type the barcode number'),
      '3017624010701',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Look up barcode' }));
    expect(await screen.findByText(/internet connection/)).toBeTruthy();
  });
});

describe('removing a meal', () => {
  it('asks first, then takes the meal out of today', async () => {
    await renderScreen();
    const meal = today()[0]!;
    await fireEvent.press(await screen.findByRole('button', { name: `Remove ${meal.title}` }));
    expect(screen.getByText('Remove this meal?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(today().some((m) => m.id === meal.id)).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: `Remove ${meal.title}` }));
    await fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(today().some((m) => m.id === meal.id)).toBe(false));
  });
});
