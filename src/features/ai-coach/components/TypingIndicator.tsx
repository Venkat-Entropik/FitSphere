import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

function Dot({ delay }: { delay: number }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
        style,
      ]}
    />
  );
}

export function TypingIndicator() {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="FitSphere Engine is typing"
      style={{ gap: 6 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(197, 242, 106, 0.2)',
          }}
        >
          <Icon name="auto_awesome" size={13} color="primary" />
        </View>
        <AppText variant="labelCaps" color="primary" weight="semibold">
          FitSphere Engine
        </AppText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 5,
          alignSelf: 'flex-start',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          borderTopLeftRadius: 4,
        }}
      >
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}
