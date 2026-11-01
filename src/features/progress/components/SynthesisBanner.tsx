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
          {synthesis.weeklyVolumePercent === null ? (
            'Log a full week of training to see how your volume is trending. '
          ) : (
            <>
              Your weekly lifting volume is{' '}
              <AppText variant="bodyMd" color="primary" weight="semibold">
                {synthesis.weeklyVolumePercent >= 0 ? '+' : ''}
                {synthesis.weeklyVolumePercent}% vs last week
              </AppText>
              .{' '}
            </>
          )}
          {synthesis.weeksToMilestone === null ? (
            <>
              Keep logging your weight to estimate when you&apos;ll reach{' '}
              <AppText variant="bodyMd" color="secondary" weight="semibold">
                {synthesis.milestoneKg.toFixed(1)} kg
              </AppText>
              .
            </>
          ) : (
            <>
              At your current rate you&apos;ll reach{' '}
              <AppText variant="bodyMd" color="secondary" weight="semibold">
                {synthesis.milestoneKg.toFixed(1)} kg
              </AppText>{' '}
              in about {synthesis.weeksToMilestone}{' '}
              {synthesis.weeksToMilestone === 1 ? 'week' : 'weeks'}.
            </>
          )}
        </AppText>
      </View>
    </LinearGradient>
  );
}
