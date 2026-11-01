/** Stitch spacing scale (rem × 16). */
export const spacing = {
  xs: 4,
  sm: 8,
  /** Tailwind p-3, used heavily inside cards. */
  compact: 12,
  md: 16,
  gutterX: 20,
  lg: 24,
  xl: 40,
} as const;

/** Minimum accessible touch target. */
export const MIN_TOUCH_TARGET = 44;

export type SpacingToken = keyof typeof spacing;
