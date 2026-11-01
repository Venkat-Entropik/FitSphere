import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { AiInsight } from '../types/dashboard.types';

export interface AiInsightCardProps {
  insight: AiInsight;
  onViewSession: () => void;
}

export function AiInsightCard({ insight, onViewSession }: AiInsightCardProps) {
  const theme = useTheme();
  return (
    <Card tone="low" style={{ gap: 8, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <Icon name="auto_awesome" size={14} color="tertiary" />
          <AppText variant="labelCaps" color="tertiary" uppercase>
            AI Coach Insight
          </AppText>
        </View>
        <AppText variant="labelCaps" color="onSurfaceVariant">
          {insight.syncedMinutesAgo < 1
            ? 'Updated just now'
            : `Synced ${insight.syncedMinutesAgo}m ago`}
        </AppText>
      </View>
      <AppText variant="bodyMd" style={{ lineHeight: 23, marginTop: 4 }}>
        You&apos;re building consistency! You&apos;ve completed{' '}
        <AppText variant="bodyMd" color="primary" weight="semibold" style={{ lineHeight: 23 }}>
          {insight.completedWorkouts} of {insight.targetWorkouts} workouts
        </AppText>{' '}
        this week. Recovery score is{' '}
        <AppText variant="bodyMd" color="secondary" weight="semibold" style={{ lineHeight: 23 }}>
          {insight.recoveryScore}%
        </AppText>
        . {insight.suggestion}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onViewSession}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <AppText variant="labelUi" color="primary" weight="semibold">
            View Recommended Session
          </AppText>
          <Icon name="trending_flat" size={16} color="primary" />
        </Pressable>
        <Icon name="verified" size={18} color="onSurfaceVariant" />
      </View>
    </Card>
  );
}
