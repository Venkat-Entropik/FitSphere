import { z } from 'zod';

import type { OnboardingProfile } from '../types/onboarding.types';

/** Numeric fields are held as strings in the form (so typing "6" on the way to "68.5" is valid). */
const decimal = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+(\.\d{1,2})?$/, `${label} must be a number`)
    .refine(
      (v) => Number(v) >= min && Number(v) <= max,
      `${label} must be between ${min} and ${max}`,
    );

export const onboardingSchema = z.object({
  goal: z.enum(['muscle', 'fat_loss', 'endurance', 'athletic']),
  sex: z.enum(['male', 'female']),
  heightCm: decimal('Height', 120, 230),
  weightKg: decimal('Weight', 30, 250),
  targetKg: decimal('Target weight', 30, 250),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().int().min(1, 'Train at least 1 day').max(7, 'At most 7 days'),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const toFormValues = (p: OnboardingProfile): OnboardingFormValues => ({
  ...p,
  heightCm: String(p.heightCm),
  weightKg: String(p.weightKg),
  targetKg: String(p.targetKg),
});

export const toProfile = (v: OnboardingFormValues): OnboardingProfile => ({
  ...v,
  heightCm: Number(v.heightCm),
  weightKg: Number(v.weightKg),
  targetKg: Number(v.targetKg),
});

/** Best-effort numbers for live previews while the user is still typing (NaN-safe). */
export function previewProfile(
  values: OnboardingFormValues,
  fallback: OnboardingProfile,
): OnboardingProfile {
  const num = (raw: string, alt: number) => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : alt;
  };
  return {
    ...values,
    heightCm: num(values.heightCm, fallback.heightCm),
    weightKg: num(values.weightKg, fallback.weightKg),
    targetKg: num(values.targetKg, fallback.targetKg),
  };
}
