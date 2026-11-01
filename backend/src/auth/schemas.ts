import { z } from 'zod';

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .pipe(z.email('Enter a valid email address'));

export const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Use at most 128 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');
