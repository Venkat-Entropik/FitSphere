import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

import type { ProgressOverview } from '../types/progress.types';

export function SynthesisBanner({ synthesis }: { synthesis: ProgressOverview['synthesis'] }) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.colors.surfaceHigh, theme.colors.surface, theme.colors.surfaceHigh]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        borderRadius: theme.radius.md,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <View
        style={[
          {
            width: 32,
            height: 32,
            borderRadius: 16,
            marginTop: 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(206, 189, 255, 0.2)',
          },
          glow(theme.colors.tertiary, 0.4, 16),
        ]}
      >
        <Icon name="auto_awesome" size={18} color="tertiary" />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText
            variant="labelCaps"
            color="secondary"
            uppercase
            weight="semibold"
            style={{ flexShrink: 1 }}
          >
            FitSphere Autonomous Synthesis
          </AppText>
          <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
            Live
          </AppText>
        </View>
        <AppText variant="bodyMd" style={{ marginTop: 4, lineHeight: 20 }}>
          Your progressive overload rate (
          <AppText variant="bodyMd" color="primary" weight="semibold">
            +{synthesis.weeklyVolumePercent}% weekly volume
          </AppText>
          ) is within optimal recovery boundaries. Current velocity places you on track to achieve
          your{' '}
          <AppText variant="bodyMd" color="secondary" weight="semibold">
            {synthesis.milestoneKg.toFixed(1)} kg
          </AppText>{' '}
          milestone in {synthesis.weeksToMilestone} weeks.
        </AppText>
      </View>
    </LinearGradient>
  );
}
