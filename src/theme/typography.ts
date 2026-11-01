import type { TextStyle } from 'react-native';

export type FontAssetName =
  | 'Inter_400Regular'
  | 'Inter_500Medium'
  | 'Inter_600SemiBold'
  | 'PlusJakartaSans_600SemiBold'
  | 'PlusJakartaSans_700Bold'
  | 'PlusJakartaSans_800ExtraBold';

export type FontFamily = 'jakarta' | 'inter';
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

const FAMILIES: Record<FontFamily, Partial<Record<FontWeight, FontAssetName>>> = {
  jakarta: {
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extrabold: 'PlusJakartaSans_800ExtraBold',
  },
  inter: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' },
};

/** Falls back to the nearest available weight, since each weight is a separate font file. */
export function fontFor(family: FontFamily, weight: FontWeight): string {
  const order: FontWeight[] = ['regular', 'medium', 'semibold', 'bold', 'extrabold'];
  const available = FAMILIES[family];
  const target = order.indexOf(weight);
  const candidates = order
    .filter((w) => available[w])
    .sort((a, b) => Math.abs(order.indexOf(a) - target) - Math.abs(order.indexOf(b) - target));
  return available[candidates[0]!]!;
}

export type TypographyVariant =
  | 'displayHeroMobile'
  | 'headlineLgMobile'
  | 'headlineMd'
  | 'metricXl'
  | 'metricLg'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'labelCaps'
  | 'labelUi';

export interface TypographySpec {
  family: FontFamily;
  weight: FontWeight;
  fontSize: number;
  lineHeight: number;
  /** Absolute px (design letter-spacing is in em). */
  letterSpacing: number;
}

const em = (size: number, value: number) => Math.round(size * value * 100) / 100;

/** From the Stitch tailwind fontSize config. Headline/metric weights follow the `font-bold` used in markup. */
export const typography: Record<TypographyVariant, TypographySpec> = {
  displayHeroMobile: {
    family: 'jakarta',
    weight: 'extrabold',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: em(36, -0.025),
  },
  headlineLgMobile: {
    family: 'jakarta',
    weight: 'bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: em(26, -0.02),
  },
  headlineMd: {
    family: 'jakarta',
    weight: 'bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: em(22, -0.015),
  },
  metricXl: {
    family: 'jakarta',
    weight: 'extrabold',
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: em(44, -0.03),
  },
  metricLg: {
    family: 'jakarta',
    weight: 'bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: em(28, -0.02),
  },
  bodyLg: {
    family: 'inter',
    weight: 'regular',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: em(16, -0.01),
  },
  bodyMd: {
    family: 'inter',
    weight: 'regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: em(14, -0.005),
  },
  bodySm: { family: 'inter', weight: 'regular', fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  labelCaps: {
    family: 'inter',
    weight: 'semibold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: em(11, 0.06),
  },
  labelUi: { family: 'inter', weight: 'medium', fontSize: 13, lineHeight: 18, letterSpacing: 0 },
};

/** Numeric/telemetry text must use tabular figures (DESIGN.md). */
export const tabularNums: Pick<TextStyle, 'fontVariant'> = { fontVariant: ['tabular-nums'] };
