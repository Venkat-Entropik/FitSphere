import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { glow, useTheme, type ColorToken } from '@/theme';

export interface ProgressBarProps {
  /** 0–1; values outside the range are clamped. */
  progress: number;
  color?: ColorToken;
  /** Overrides `color` with a horizontal gradient (e.g. recovery bar). */
  gradient?: readonly [string, string, ...string[]];
  height?: number;
  withGlow?: boolean;
  accessibilityLabel?: string;
}

export function ProgressBar({
  progress,
  color = 'primary',
  gradient,
  height = 8,
  withGlow = false,
  accessibilityLabel,
}: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const fill = {
    width: `${clamped * 100}%` as `${number}%`,
    height,
    borderRadius: height / 2,
  };
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: theme.colors.surfaceHigh },
      ]}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[fill, withGlow && glow(theme.colors.primary, 0.5, 12)]}
        />
      ) : (
        <View
          style={[
            fill,
            { backgroundColor: theme.colors[color] },
            withGlow && glow(theme.colors[color], 0.5, 12),
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ track: { overflow: 'hidden', alignSelf: 'stretch' } });
