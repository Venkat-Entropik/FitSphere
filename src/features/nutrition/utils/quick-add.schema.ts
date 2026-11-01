import { z } from 'zod';

import type { MealCategory, NewMealInput } from '../types/nutrition.types';

const whole = (label: string, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d*$/, `${label} must be a whole number`)
    .refine((v) => v === '' || Number(v) <= max, `${label} can't exceed ${max}`);

export const quickAddSchema = z.object({
  title: z.string().trim().min(2, 'Enter a food name').max(60, 'Keep the name under 60 characters'),
  category: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
  kcal: whole('Calories', 5000).refine((v) => v !== '' && Number(v) > 0, 'Enter calories'),
  protein: whole('Protein', 500),
  carbs: whole('Carbs', 800),
  fat: whole('Fat', 400),
});

export type QuickAddValues = z.infer<typeof quickAddSchema>;

export const quickAddDefaults: QuickAddValues = {
  title: '',
  category: 'snack',
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
};

/** Form strings → typed meal input (blank macros count as 0). */
export function toNewMeal(values: QuickAddValues): NewMealInput {
  return {
    title: values.title.trim(),
    category: values.category as MealCategory,
    kcal: Number(values.kcal),
    protein: Number(values.protein || 0),
    carbs: Number(values.carbs || 0),
    fat: Number(values.fat || 0),
  };
}
