import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { SessionExercise } from '../types/workout.types';
import { formatKg } from '../utils/workout.logic';
import { SetLogTable } from './SetLogTable';

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: 'remove' | 'add';
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surfaceHigh,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Icon name={icon} size={22} color="onSurface" />
    </Pressable>
  );
}

/** "Weight  [-]  12.5 kg  [+]": one target, one row, big touch targets. */
function AdjustRow({
  name,
  value,
  unit,
  onMinus,
  onPlus,
}: {
  name: string;
  value: string;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
      }}
    >
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
        {name}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RoundButton icon="remove" label={`Decrease ${name.toLowerCase()}`} onPress={onMinus} />
        <View style={{ minWidth: 44, alignItems: 'center' }}>
          <AppText variant="headlineMd" tabular numberOfLines={1}>
            {value}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {unit}
          </AppText>
        </View>
        <RoundButton icon="add" label={`Increase ${name.toLowerCase()}`} onPress={onPlus} />
      </View>
    </View>
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
  const activeSet = exercise.sets.find((x) => x.number === activeSetNumber);
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

      {canAdjust && activeSet ? (
        <View style={{ gap: 8 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Adjust set {activeSetNumber}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AdjustRow
              name="Weight"
              value={formatKg(activeSet.kg)}
              unit="kg"
              onMinus={() => onAdjustWeight(-1)}
              onPlus={() => onAdjustWeight(1)}
            />
            <AdjustRow
              name="Reps"
              value={String(activeSet.reps)}
              unit="reps"
              onMinus={() => onAdjustReps(-1)}
              onPlus={() => onAdjustReps(1)}
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
