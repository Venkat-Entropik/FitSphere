import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import { formatClock } from '../utils/workout.logic';

export interface RestTimerCardProps {
  remainingSeconds: number;
  totalSeconds: number;
  onAdd: () => void;
  onSkip: () => void;
}

export function RestTimerCard({
  remainingSeconds,
  totalSeconds,
  onAdd,
  onSkip,
}: RestTimerCardProps) {
  const theme = useTheme();
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  return (
    <Card
      tone="low"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexShrink: 1 }}>
        <ProgressRing
          rings={[{ progress, color: 'secondary' }]}
          size={64}
          strokeWidth={4}
          accessibilityLabel={`Rest ${formatClock(remainingSeconds)} remaining`}
        >
          <Icon name="snooze" size={20} color="secondary" />
        </ProgressRing>
        <View style={{ gap: 2 }}>
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Rest Period
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <AppText variant="headlineLgMobile" tabular>
              {formatClock(remainingSeconds)}
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              left
            </AppText>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add 30 seconds"
          onPress={onAdd}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            height: 40,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Icon name="add" size={16} color="secondary" />
          <AppText variant="labelCaps" weight="semibold">
            30s
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          onPress={onSkip}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            height: 40,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
          }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Skip
          </AppText>
          <Icon name="skip_next" size={16} color="onSurfaceVariant" />
        </Pressable>
      </View>
    </Card>
  );
}
