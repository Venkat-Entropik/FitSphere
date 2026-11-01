import { colors, type ColorPalette } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { MIN_TOUCH_TARGET, spacing } from './spacing';
import { typography } from './typography';

export interface Theme {
  colors: ColorPalette;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  minTouchTarget: number;
}

/** The Stitch design is dark-only, so there is a single theme. */
export const theme: Theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  minTouchTarget: MIN_TOUCH_TARGET,
};
