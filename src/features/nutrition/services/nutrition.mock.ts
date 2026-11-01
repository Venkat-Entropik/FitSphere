import type { DailyNutrition } from '../types/nutrition.types';

/** Sample day mirroring the Stitch reference. `at(h, m)` builds today's timestamps. */
export function buildMockDay(now = new Date()): DailyNutrition {
  const at = (h: number, m: number) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  return {
    athleteName: 'Alex',
    weightKg: 68.5,
    goalLabel: 'Muscle Hypertrophy',
    budgetKcal: 2600,
    macroTargets: { protein: 140, carbs: 310, fat: 70 },
    hydrationMl: 2400,
    hydrationGoalMl: 3500,
    plannedMeals: 4,
    meals: [
      {
        id: 'm1',
        category: 'breakfast',
        title: 'Egg White Omelet & Avocado Toast',
        loggedAt: at(8, 15),
        kcal: 620,
        protein: 42,
        carbs: 48,
        fat: 18,
      },
      {
        id: 'm2',
        category: 'lunch',
        title: 'Grilled Chicken Breast & Brown Rice',
        loggedAt: at(13, 30),
        kcal: 780,
        protein: 52,
        carbs: 84,
        fat: 16,
      },
      {
        id: 'm3',
        category: 'snack',
        title: 'Whey Isolate Shake & Banana',
        loggedAt: at(16, 45),
        kcal: 280,
        protein: 28,
        carbs: 32,
        fat: 3,
      },
    ],
    recommendation: {
      id: 'rec-dinner',
      category: 'dinner',
      title: 'Salmon Fillet with Sweet Potato',
      kcal: 470,
      protein: 36,
      carbs: 44,
      fat: 14,
    },
  };
}
