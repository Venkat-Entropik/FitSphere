import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { RichText } from '@/components/common/RichText';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { WeeklyAnalysis } from '../types/coach.types';

export function AnalysisCard({ analysis }: { analysis: WeeklyAnalysis }) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.colors.surfaceHigh, theme.colors.surface, theme.colors.surfaceLow]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: theme.radius.md, padding: theme.spacing.md, overflow: 'hidden' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <Icon name="show_chart" size={16} color="primary" />
          </View>
          <AppText variant="labelCaps" color="primary" uppercase style={{ flexShrink: 1 }}>
            Weekly Hypertrophy Analysis
          </AppText>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHighest,
          }}
        >
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            weight="medium"
            style={{ fontSize: 12 }}
          >
            {analysis.windowLabel}
          </AppText>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginVertical: 8,
          padding: 10,
          borderRadius: theme.radius.sm,
          backgroundColor: 'rgba(12, 14, 16, 0.6)',
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant">
            {analysis.recoveryLabel}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <AppText variant="headlineMd" tabular>
              {analysis.recoveryPercent}%
            </AppText>
            <AppText variant="labelCaps" color="primary" style={{ fontSize: 10 }}>
              {analysis.recoveryTarget}
            </AppText>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant">
            Volume Overload
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <AppText variant="headlineMd" color="secondary" tabular>
              +{analysis.volumeOverloadPercent}%
            </AppText>
            <AppText variant="labelCaps" color="onSurfaceVariant" style={{ fontSize: 10 }}>
              vs last wk
            </AppText>
          </View>
        </View>
      </View>
      <RichText
        text={analysis.summary}
        variant="bodySm"
        color="onSurfaceVariant"
        emphasisColor="onSurface"
        style={{ lineHeight: 19.5 }}
      />
    </LinearGradient>
  );
}
