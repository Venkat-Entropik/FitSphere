import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useMotionEnabled } from '@/components/motion/useReducedMotion';
import { AppText } from '@/components/ui/AppText';
import { useTheme, type ColorToken } from '@/theme';

export interface RangeBarProps {
  value: number;
  /** The right edge of the scale. */
  max: number;
  /** The healthy band, drawn behind the fill. */
  band: readonly [number, number];
  color: ColorToken;
  index?: number;
  accessibilityLabel?: string;
}

/** A progress bar with a shaded target band, so "enough" is visible without reading numbers. */
export function RangeBar({
  value,
  max,
  band,
  color,
  index = 0,
  accessibilityLabel,
}: RangeBarProps) {
  const theme = useTheme();
  const motion = useMotionEnabled();
  const ratio = Math.min(1, Math.max(0, value / max));
  const shown = useSharedValue(motion ? 0 : ratio);
  useEffect(() => {
    shown.value = motion
      ? withDelay(
          index * 60,
          withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) }),
        )
      : ratio;
  }, [motion, ratio, index, shown]);
  const fill = useAnimatedStyle(() => ({ width: `${shown.value * 100}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: value }}
      style={{
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.surfaceHigh,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${(band[0] / max) * 100}%`,
          width: `${((band[1] - band[0]) / max) * 100}%`,
          backgroundColor: 'rgba(197, 242, 106, 0.16)',
        }}
      />
      <Animated.View
        style={[{ height: '100%', borderRadius: 5, backgroundColor: theme.colors[color] }, fill]}
      />
    </View>
  );
}

export function RangeScale({ band, max }: { band: readonly [number, number]; max: number }) {
  return (
    <View style={{ height: 14 }}>
      {band.map((n) => (
        <AppText
          key={n}
          variant="labelCaps"
          color="onSurfaceVariant"
          style={{
            position: 'absolute',
            left: `${(n / max) * 100}%`,
            fontSize: 10,
            transform: [{ translateX: -6 }],
          }}
        >
          {n}
        </AppText>
      ))}
    </View>
  );
}
