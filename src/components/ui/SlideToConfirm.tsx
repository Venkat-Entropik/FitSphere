import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  icon?: IconName;
}

const KNOB = 44;
const PADDING = 4;
const THRESHOLD = 0.85;

/** Slide-to-confirm control for irreversible actions (e.g. finishing a run). */
export function SlideToConfirm({ label, onConfirm, icon = 'stop' }: SlideToConfirmProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useSharedValue(0);
  const maxTravel = Math.max(0, trackWidth - KNOB - PADDING * 2);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = Math.min(maxTravel, Math.max(0, e.translationX));
    })
    .onEnd(() => {
      const confirmed = maxTravel > 0 && x.value >= maxTravel * THRESHOLD;
      x.value = withSpring(0);
      if (confirmed) scheduleOnRN(onConfirm);
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Slide right to confirm, or double tap to confirm"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => onConfirm()}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[
        styles.track,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill },
      ]}
    >
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase style={styles.label}>
        {label} →
      </AppText>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.knob, { backgroundColor: theme.colors.errorContainer }, knobStyle]}
        >
          <Icon name={icon} size={20} color="onErrorContainer" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: KNOB + PADDING * 2, justifyContent: 'center', padding: PADDING },
  label: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
