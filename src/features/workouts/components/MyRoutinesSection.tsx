import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { useRoutines } from '../hooks/useWorkoutData';

export interface MyRoutinesSectionProps {
  onStart: (routineId: string) => void;
}

/** The user's own routines: start one, edit one, or build a new one. */
export function MyRoutinesSection({ onStart }: MyRoutinesSectionProps) {
  const router = useRouter();
  const { data: routines } = useRoutines();

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="headlineMd" accessibilityRole="header">
          My routines
        </AppText>
        <SecondaryButton
          label="New routine"
          size="md"
          fullWidth={false}
          leftIcon={<Icon name="add" size={18} color="primary" />}
          onPress={() => router.push('/routine-editor')}
        />
      </View>
      {routines && routines.length > 0 ? (
        routines.map((routine) => {
          const sets = routine.exercises.reduce((n, s) => n + s.sets, 0);
          return (
            <Card key={routine.id} style={{ gap: 10 }}>
              <View style={{ gap: 2 }}>
                <AppText variant="bodyLg" weight="semibold">
                  {routine.name}
                </AppText>
                <AppText variant="bodySm" color="onSurfaceVariant">
                  {routine.exercises.length}{' '}
                  {routine.exercises.length === 1 ? 'exercise' : 'exercises'} · {sets}{' '}
                  {sets === 1 ? 'set' : 'sets'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Start" onPress={() => onStart(routine.id)} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    label="Edit"
                    onPress={() =>
                      router.push({ pathname: '/routine-editor', params: { id: routine.id } })
                    }
                  />
                </View>
              </View>
            </Card>
          );
        })
      ) : (
        <AppText variant="bodyMd" color="onSurfaceVariant">
          Build your own workout from the exercise library, with your own order and sets.
        </AppText>
      )}
    </View>
  );
}
