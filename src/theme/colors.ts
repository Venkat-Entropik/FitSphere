/**
 * Extracted from the Stitch "Athletic Precision" export (tailwind-config in each code.html).
 * The design only defines a dark theme, so FitSphere is dark-only for now.
 */
export const colors = {
  background: '#121416',
  surfaceLowest: '#0c0e10',
  surfaceLow: '#1a1c1e',
  /** "surface-container" — the standard card background. */
  surface: '#1e2022',
  surfaceHigh: '#282a2c',
  surfaceHighest: '#333537',
  surfaceBright: '#38393c',

  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c4c9b3',
  outline: '#8e937f',
  outlineVariant: '#444938',

  /** Electric lime (primary-fixed) — CTAs, active metrics. */
  primary: '#c5f26a',
  onPrimary: '#141f00',
  primaryDim: '#aad551',
  /** Cyan — hydration, pace, cardio. */
  secondary: '#7bd0ff',
  onSecondary: '#001e2c',
  secondaryContainer: '#00a6e0',
  /** Violet (tertiary-fixed-dim) — recovery, sleep, AI. */
  tertiary: '#cebdff',
  onTertiary: '#21005e',

  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  /** From DESIGN.md "Strain Warning". */
  warning: '#f4be62',

  overlay: 'rgba(12, 14, 16, 0.7)',
} as const;

export type ColorToken = keyof typeof colors;
export type ColorPalette = Record<ColorToken, string>;
