import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import type { PlanExercise, WorkoutPlanSuggestion } from '../types/coach.types';

const LOAD_COLOR: Record<PlanExercise['tone'], ColorToken> = {
  progress: 'primary',
  neutral: 'onSurface',
  cue: 'onSurface',
};
const NOTE_COLOR: Record<PlanExercise['tone'], ColorToken> = {
  progress: 'primaryDim',
  neutral: 'onSurfaceVariant',
  cue: 'secondary',
};

export interface WorkoutPlanCardProps {
  plan: WorkoutPlanSuggestion;
  onLoad: () => void;
  onModify: () => void;
}

export function WorkoutPlanCard({ plan, onLoad, onModify }: WorkoutPlanCardProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12, marginLeft: 8 }}>
      <View
        style={{
          gap: 12,
          padding: 14,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceLow,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText variant="labelCaps" color="secondary" uppercase weight="semibold">
            Target Overload Targets
          </AppText>
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            weight="regular"
            style={{ fontSize: 10 }}
          >
            RPE {plan.rpe}
          </AppText>
        </View>
        <View style={{ gap: 8 }}>
          {plan.exercises.map((exercise) => (
            <View
              key={exercise.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 8,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <AppText variant="bodyMd" weight="semibold" numberOfLines={1}>
                  {exercise.name}
                </AppText>
                <AppText variant="bodySm" color="onSurfaceVariant">
                  {exercise.prescription}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="bodyMd" weight="bold" color={LOAD_COLOR[exercise.tone]} tabular>
                  {exercise.load}
                </AppText>
                <AppText
                  variant="labelCaps"
                  color={NOTE_COLOR[exercise.tone]}
                  weight="medium"
                  style={{ fontSize: 10 }}
                >
                  {exercise.loadNote}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Button
          label="Load into Workout"
          onPress={onLoad}
          fullWidth={false}
          style={{ height: 36, paddingHorizontal: 12 }}
          leftIcon={<Icon name="play_arrow" size={16} color="onPrimary" />}
        />
        <Button
          variant="secondary"
          label="Modify"
          onPress={onModify}
          fullWidth={false}
          style={{ height: 36, paddingHorizontal: 10 }}
          leftIcon={<Icon name="tune" size={16} color="onSurfaceVariant" />}
        />
      </View>
    </View>
  );
}
