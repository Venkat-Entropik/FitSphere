import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useMotionEnabled } from './useReducedMotion';

/**
 * Fades and lifts its child into place when the screen opens; `index` staggers a list of sections.
 * Only opacity and a transform animate, so layout is never affected (Android's layout animations
 * could leave following sections overlapping).
 */
export function Reveal({ index = 0, children }: { index?: number; children: React.ReactNode }) {
  const enabled = useMotionEnabled();
  const progress = useSharedValue(enabled ? 0 : 1);
  useEffect(() => {
    progress.value = enabled
      ? withDelay(
          60 + index * 70,
          withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
        )
      : 1;
  }, [enabled, index, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
