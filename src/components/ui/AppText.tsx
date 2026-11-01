import { Text, type TextProps } from 'react-native';

import {
  fontFor,
  tabularNums,
  useTheme,
  type ColorToken,
  type FontWeight,
  type TypographyVariant,
} from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  /** Overrides the variant's default weight (the design adds font-semibold/bold on top of tokens). */
  weight?: FontWeight;
  uppercase?: boolean;
  /** Tabular figures for numbers/telemetry. */
  tabular?: boolean;
}

export function AppText({
  variant = 'bodyMd',
  color = 'onSurface',
  weight,
  uppercase = false,
  tabular = false,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const spec = theme.typography[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fontFor(spec.family, weight ?? spec.weight),
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          color: theme.colors[color],
        },
        uppercase && { textTransform: 'uppercase' },
        tabular && tabularNums,
        style,
      ]}
    />
  );
}
