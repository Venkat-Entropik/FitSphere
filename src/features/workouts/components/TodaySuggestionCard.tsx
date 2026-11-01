import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/theme';

import type { Exercise } from '../types/workout-record.types';
import type { TodaySuggestion } from '../utils/today-suggestion';
import { formatKg } from '../utils/workout.logic';

export interface TodaySuggestionCardProps {
  suggestion: TodaySuggestion;
  onStart: () => void;
  onShowVideo: (exercise: Exercise) => void;
}

export function TodaySuggestionCard({
  suggestion,
  onStart,
  onShowVideo,
}: TodaySuggestionCardProps) {
  const theme = useTheme();
  const { plan, reason, items } = suggestion;
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <AppText variant="labelCaps" color="primary" uppercase>
          Today&apos;s suggestion
        </AppText>
        <AppText variant="headlineMd" accessibilityRole="header">
          {plan.name}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {reason}
        </AppText>
      </View>

      <View style={{ gap: 8 }}>
        {items.map(({ exercise, sets, kg, reps, note }) => (
          <View
            key={exercise.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surfaceLow,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMd" weight="semibold">
                {exercise.name}
              </AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {sets} × {reps} · {formatKg(kg)} kg · {note}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`How to do ${exercise.name}`}
              onPress={() => onShowVideo(exercise)}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surface,
              })}
            >
              <Icon name="play_circle" size={26} color="primary" />
            </Pressable>
          </View>
        ))}
      </View>

      <PrimaryButton label={`Start ${plan.name.split(' –')[0]}`} onPress={onStart} fullWidth />
      <AppText variant="bodySm" color="onSurfaceVariant">
        Targets are estimates from your recent sessions, not medical advice.
      </AppText>
    </Card>
  );
}
