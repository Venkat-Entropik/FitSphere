import type { ColorToken } from '@/theme';

import type { Tone } from '../types/progress.types';

export const TONE_COLOR: Record<Tone, ColorToken> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  neutral: 'onSurfaceVariant',
};

export const TONE_BG: Record<Tone, string> = {
  primary: 'rgba(197, 242, 106, 0.2)',
  secondary: 'rgba(123, 208, 255, 0.2)',
  tertiary: 'rgba(206, 189, 255, 0.2)',
  neutral: '#1e2022',
};
