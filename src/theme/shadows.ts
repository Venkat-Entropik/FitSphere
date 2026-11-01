import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/** Neon-style glow (DESIGN.md "Luminescence"): a colored, zero-offset shadow. */
export function glow(color: string, opacity = 0.4, radius = 12): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  };
}

export const shadows = {
  none: {} as ViewStyle,
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  } as ViewStyle,
  primaryGlow: glow(colors.primary, 0.4, 24),
  softPrimaryGlow: glow(colors.primary, 0.25, 8),
};
