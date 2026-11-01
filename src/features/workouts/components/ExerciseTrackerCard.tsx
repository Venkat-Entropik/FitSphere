import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { SessionExercise } from '../types/workout.types';
import { formatKg } from '../utils/workout.logic';
import { SetLogTable } from './SetLogTable';

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.sm,
        backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surface,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <AppText variant="labelUi" weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

export interface ExerciseTrackerCardProps {
  exercise: SessionExercise;
  position: number;
  total: number;
  activeSetNumber: number | null;
  onAdjustWeight: (direction: 1 | -1) => void;
  onAdjustReps: (direction: 1 | -1) => void;
  /** Opens the how-to video for this exercise. */
  onShowVideo?: () => void;
}

export function ExerciseTrackerCard({
  exercise,
  position,
  total,
  activeSetNumber,
  onAdjustWeight,
  onAdjustReps,
  onShowVideo,
}: ExerciseTrackerCardProps) {
  const theme = useTheme();
  const canAdjust = activeSetNumber !== null;
  return (
    <Card tone="low" style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: theme.radius.pill,
                backgroundColor: 'rgba(0, 166, 224, 0.2)',
              }}
            >
              <AppText variant="labelCaps" color="secondary">
                Ex {position} of {total}
              </AppText>
            </View>
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              {exercise.category}
            </AppText>
          </View>
          <AppText variant="headlineMd" style={{ lineHeight: 26 }} accessibilityRole="header">
            {exercise.name}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {exercise.muscles}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`How to do ${exercise.name}`}
          disabled={!onShowVideo}
          onPress={onShowVideo}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: theme.radius.sm,
            backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Icon name={onShowVideo ? 'play_circle' : 'fitness_center'} size={28} color="primary" />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: 10,
          borderRadius: theme.radius.sm,
          backgroundColor: 'rgba(30, 32, 34, 0.6)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="tune" size={16} color="secondary" />
          <AppText variant="bodySm" color="onSurfaceVariant">
            {exercise.equipment}
          </AppText>
        </View>
        {exercise.lastWeek ? (
          <>
            <AppText color="surfaceBright">•</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="history" size={16} color="primary" />
              <AppText variant="bodySm" color="onSurfaceVariant">
                Last week:{' '}
                <AppText variant="bodySm" weight="semibold">
                  {formatKg(exercise.lastWeek.kg)}kg × {exercise.lastWeek.reps.join(', ')}
                </AppText>
              </AppText>
            </View>
          </>
        ) : null}
      </View>

      <SetLogTable sets={exercise.sets} />

      {canAdjust ? (
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              uppercase
              style={{ letterSpacing: 0.9 }}
            >
              Quick Adjust Target Set {activeSetNumber}
            </AppText>
            <AppText variant="labelCaps" color="secondary">
              Touch Steppers
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stepper label="-2.5 kg" onPress={() => onAdjustWeight(-1)} />
            <Stepper label="+2.5 kg" onPress={() => onAdjustWeight(1)} />
            <Stepper label="-1 rep" onPress={() => onAdjustReps(-1)} />
            <Stepper label="+1 rep" onPress={() => onAdjustReps(1)} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
