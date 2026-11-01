import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { Chip } from '@/components/common/Chip';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { ScheduledWorkout } from '../types/dashboard.types';

const VISIBLE_EXERCISES = 3;

function Dot() {
  const theme = useTheme();
  return (
    <View
      style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.surfaceHighest }}
    />
  );
}

export function ScheduledWorkoutCard({ workout }: { workout: ScheduledWorkout }) {
  const theme = useTheme();
  const extra = workout.exercises.length - VISIBLE_EXERCISES;
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* The Stitch export references a remote hero photo that is not bundled; a tonal gradient stands in. */}
      <View style={{ height: 144, backgroundColor: theme.colors.surfaceHigh }}>
        <LinearGradient
          colors={[theme.colors.surfaceHighest, theme.colors.surface]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(30, 32, 34, 0.6)', theme.colors.surface]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(12, 14, 16, 0.8)',
          }}
        >
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }}
          />
          <AppText variant="labelCaps" color="primary" uppercase>
            Scheduled Today
          </AppText>
        </View>
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <AppText variant="headlineMd">{workout.name}</AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              Focus: {workout.focus}
            </AppText>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: theme.radius.xs,
              backgroundColor: 'rgba(12, 14, 16, 0.7)',
            }}
          >
            <AppText variant="labelUi" color="secondary" weight="semibold">
              {workout.durationMinutes} min
            </AppText>
          </View>
        </View>
      </View>
      <View style={{ padding: theme.spacing.md, gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="format_list_bulleted" size={16} color="onSurfaceVariant" />
            <AppText variant="bodySm" color="onSurfaceVariant">
              {workout.compoundSets} compound sets
            </AppText>
          </View>
          <Dot />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="local_fire_department" size={16} color="onSurfaceVariant" />
            <AppText variant="bodySm" weight="medium">
              Est. {workout.estimatedKcal} kcal
            </AppText>
          </View>
          <Dot />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="speed" size={16} color="onSurfaceVariant" />
            <AppText variant="bodySm" color="onSurfaceVariant">
              RPE {workout.rpe}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
          {workout.exercises.slice(0, VISIBLE_EXERCISES).map((name) => (
            <Chip key={name} label={name} />
          ))}
          {extra > 0 ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.surfaceLow,
              }}
            >
              <AppText variant="labelCaps" color="primary">
                +{extra} more
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
