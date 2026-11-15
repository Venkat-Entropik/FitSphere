import Animated, { FadeInDown } from 'react-native-reanimated';

import { useMotionEnabled } from './useReducedMotion';

/** Fades and lifts its child into place when the screen opens; `index` staggers a list of sections. */
export function Reveal({ index = 0, children }: { index?: number; children: React.ReactNode }) {
  const enabled = useMotionEnabled();
  return (
    <Animated.View entering={enabled ? FadeInDown.delay(60 + index * 70).duration(420) : undefined}>
      {children}
    </Animated.View>
  );
}
