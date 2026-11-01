/** Stitch tailwind overrides: DEFAULT 4, lg 8, xl 12 (cards), full. */
export const radius = {
  xs: 4,
  sm: 8,
  /** Standard card radius (`rounded-xl`). */
  md: 12,
  lg: 16,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
