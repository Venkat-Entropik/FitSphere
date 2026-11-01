import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme, type ColorToken } from '@/theme';

type MaterialName = ComponentProps<typeof MaterialIcons>['name'];
type CommunityName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * The design uses Google Material Symbols. These 8 have no MaterialIcons glyph, so they map to
 * the closest MaterialCommunityIcons glyph; everything else uses the same-named MaterialIcons glyph.
 */
const COMMUNITY_FALLBACKS = {
  barcode_scanner: 'barcode-scan',
  ecg_heart: 'heart-pulse',
  exercise: 'dumbbell',
  monitoring: 'chart-line',
  neurology: 'brain',
  nutrition: 'food-apple-outline',
  sprint: 'run-fast',
  vital_signs: 'pulse',
} as const satisfies Record<string, CommunityName>;

export type IconName = keyof typeof COMMUNITY_FALLBACKS | (string & {});

export interface IconProps {
  /** Material Symbols ligature name, e.g. `fitness_center`. */
  name: IconName;
  size?: number;
  color?: ColorToken;
}

export function Icon({ name, size = 24, color = 'onSurface' }: IconProps) {
  const theme = useTheme();
  const tint = theme.colors[color];
  if (name in COMMUNITY_FALLBACKS) {
    const mapped = COMMUNITY_FALLBACKS[name as keyof typeof COMMUNITY_FALLBACKS];
    return <MaterialCommunityIcons name={mapped} size={size} color={tint} />;
  }
  return <MaterialIcons name={name.replace(/_/g, '-') as MaterialName} size={size} color={tint} />;
}
