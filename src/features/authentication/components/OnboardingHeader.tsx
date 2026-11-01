import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

export interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingHeader({ step, totalSteps, onBack, onSkip }: OnboardingHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceHigh,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Icon name="arrow_back" size={16} />
          </Pressable>
          <AppText variant="headlineMd" color="onSurface" accessibilityRole="header">
            FitSphere
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <AppText variant="labelCaps" color="primary" uppercase>
              Step {step} of {totalSteps}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            onPress={onSkip}
            hitSlop={8}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <AppText variant="labelUi" color="onSurfaceVariant">
              Skip
            </AppText>
          </Pressable>
        </View>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Onboarding progress"
        accessibilityValue={{ min: 1, max: totalSteps, now: step }}
        style={{ flexDirection: 'row', gap: 6, paddingTop: 4 }}
      >
        {Array.from({ length: totalSteps }, (_, i) => {
          const filled = i < step;
          const current = i === step - 1;
          return (
            <View
              key={i}
              style={[
                {
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: filled ? theme.colors.primary : theme.colors.surfaceHighest,
                },
                current && glow(theme.colors.primary, 0.8, 12),
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}
