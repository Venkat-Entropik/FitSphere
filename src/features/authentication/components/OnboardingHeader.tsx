import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  /** Hidden on the first step when there is nowhere to go back to. */
  onBack?: () => void;
  onSkip: () => void;
}

export function OnboardingHeader({ step, totalSteps, onBack, onSkip }: OnboardingHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 }}>
        <View style={{ width: 40 }}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceHigh,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Icon name="arrow_back" size={20} />
            </Pressable>
          ) : null}
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step} of ${totalSteps}`}
          accessibilityValue={{ min: 1, max: totalSteps, now: step }}
          style={{ flex: 1, flexDirection: 'row', gap: 6 }}
        >
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                backgroundColor: i < step ? theme.colors.primary : theme.colors.surfaceHighest,
              }}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip"
          onPress={onSkip}
          hitSlop={8}
          style={{ minWidth: 40, minHeight: 40, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <AppText variant="labelUi" color="onSurfaceVariant">
            Skip
          </AppText>
        </Pressable>
      </View>
      <AppText variant="labelCaps" color="primary" uppercase style={{ letterSpacing: 1.2 }}>
        Step {step} of {totalSteps}
      </AppText>
    </View>
  );
}
