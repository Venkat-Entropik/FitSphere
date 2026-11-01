import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { glow, useTheme, type ColorToken } from '@/theme';

export interface BarSpec {
  /** Bottom label, e.g. "M". */
  label: string;
  /** 0–1 of the chart's bar area height. */
  ratio: number;
  /** Small label above the bar, e.g. "65m". */
  topLabel?: string;
  /**
   * solid = lime bar with glow, partial = in-progress bar (translucent with a solid lower half),
   * muted = empty/rest bar.
   */
  variant?: 'solid' | 'partial' | 'muted';
  /** Highlights the labels in lime (current day). */
  highlighted?: boolean;
  /** Overrides the bar color (any variant), e.g. cyan or a muted surface tone. */
  fill?: ColorToken;
  /** Add a glow to the bar regardless of variant. */
  glowing?: boolean;
}

export interface BarChartProps {
  bars: readonly BarSpec[];
  /** Height of the bar area (excluding labels). */
  barAreaHeight?: number;
  gap?: number;
  accessibilityLabel?: string;
}

const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

/** Equal-width column chart used for weekly frequency (and reusable for volume/strain charts). */
export function BarChart({ bars, barAreaHeight = 96, gap = 8, accessibilityLabel }: BarChartProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap, paddingTop: theme.spacing.sm }}
    >
      {bars.map((bar, i) => {
        const variant = bar.variant ?? 'solid';
        const height = Math.max(4, Math.round(clamp(bar.ratio) * barAreaHeight));
        const labelColor: ColorToken = bar.highlighted ? 'primary' : 'onSurface';
        return (
          <View key={`${bar.label}-${i}`} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
            {bar.topLabel ? (
              <AppText
                variant="labelCaps"
                color={
                  bar.highlighted ? 'primary' : variant === 'muted' ? 'outline' : 'onSurfaceVariant'
                }
                style={{ fontSize: 10, lineHeight: 14 }}
              >
                {bar.topLabel}
              </AppText>
            ) : null}
            <View
              style={[
                {
                  width: '100%',
                  height,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  overflow: 'hidden',
                },
                variant === 'solid' && {
                  backgroundColor: theme.colors[bar.fill ?? 'primary'],
                  ...glow(theme.colors[bar.fill ?? 'primary'], 0.25, 8),
                },
                variant === 'muted' && bar.fill && { backgroundColor: theme.colors[bar.fill] },
                bar.glowing && glow(theme.colors[bar.fill ?? 'primary'], 0.9, 10),
                variant === 'partial' && { backgroundColor: 'rgba(197, 242, 106, 0.4)' },
                variant === 'muted' && !bar.fill && { backgroundColor: theme.colors.surfaceHigh },
              ]}
            >
              {variant === 'partial' ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: '50%',
                    backgroundColor: theme.colors.primary,
                  }}
                />
              ) : null}
            </View>
            <AppText
              variant="labelCaps"
              color={variant === 'muted' ? 'onSurfaceVariant' : labelColor}
              weight={bar.highlighted ? 'bold' : 'semibold'}
            >
              {bar.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
