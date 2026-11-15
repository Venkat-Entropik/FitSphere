import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomInput } from '@/components/ui/CustomInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useTheme } from '@/theme';

import { ExercisePicker } from '../components/ExercisePicker';
import { ExerciseVideoSheet } from '../components/ExerciseVideoSheet';
import {
  useDeleteRoutine,
  useExerciseCatalog,
  useRoutines,
  useSaveCustomExercise,
  useSaveRoutine,
} from '../hooks/useWorkoutData';
import { newCustomId } from '../services/workout.service';
import type { Exercise } from '../types/workout-record.types';
import {
  addExercises,
  buildRoutine,
  changeSets,
  MAX_SETS,
  moveSlot,
  removeSlot,
  validateRoutine,
  type RoutineDraft,
  type RoutineErrors,
} from '../utils/routine.logic';

function IconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
        backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surfaceHigh,
      })}
    >
      <Icon name={icon} size={20} color="onSurface" />
    </Pressable>
  );
}

/** Build or edit a routine: name it, add exercises, set sets, reorder. Saved on the phone, synced later. */
export function RoutineEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routines = useRoutines();
  const catalog = useExerciseCatalog();
  const saveRoutine = useSaveRoutine();
  const deleteRoutine = useDeleteRoutine();
  const saveExercise = useSaveCustomExercise();

  const existing = id ? routines.data?.find((r) => r.id === id) : undefined;
  const [edits, setEdits] = useState<RoutineDraft | null>(null);
  const [errors, setErrors] = useState<RoutineErrors>({});
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null);
  const [routineId] = useState(() => id ?? newCustomId('routine'));

  const draft: RoutineDraft = edits ?? {
    name: existing?.name ?? '',
    slots: existing ? existing.exercises.map((s) => ({ ...s })) : [],
  };
  const update = (patch: Partial<RoutineDraft>) => setEdits({ ...draft, ...patch });

  const byId = useMemo(() => new Map((catalog.data ?? []).map((e) => [e.id, e])), [catalog.data]);
  const inRoutine = useMemo(() => new Set(draft.slots.map((s) => s.exerciseId)), [draft.slots]);

  if (routines.isPending || catalog.isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading routine" />
      </Screen>
    );
  }
  if (routines.error || catalog.error) {
    return (
      <Screen>
        <ErrorState
          error={routines.error ?? catalog.error}
          onRetry={() => {
            void routines.refetch();
            void catalog.refetch();
          }}
        />
      </Screen>
    );
  }
  if (id && !existing) {
    return (
      <Screen>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}
        >
          <AppText variant="headlineMd">Routine not found</AppText>
          <AppText variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
            It may have been deleted on another device.
          </AppText>
          <PrimaryButton label="Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const save = async () => {
    const found = validateRoutine(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await saveRoutine.mutateAsync(
      buildRoutine(draft, { id: routineId, now: Date.now(), existing }),
    );
    router.back();
  };

  return (
    <Screen
      scroll
      footer={
        <View style={{ padding: 16, gap: 8 }}>
          <PrimaryButton
            label="Save routine"
            onPress={() => void save()}
            loading={saveRoutine.isPending}
          />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        <IconButton icon="arrow_back" label="Back" onPress={() => router.back()} />
        <AppText variant="headlineMd" accessibilityRole="header">
          {existing ? 'Edit routine' : 'New routine'}
        </AppText>
      </View>

      <CustomInput
        label="Routine name"
        placeholder="e.g. Push day A"
        value={draft.name}
        onChangeText={(name) => update({ name })}
        error={errors.name}
        maxLength={60}
      />

      <View style={{ gap: 8 }}>
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          Exercises ({draft.slots.length})
        </AppText>
        {draft.slots.length === 0 ? (
          <AppText variant="bodyMd" color="onSurfaceVariant">
            No exercises yet. Add some from the library, or create your own.
          </AppText>
        ) : null}
        {draft.slots.map((slot, index) => {
          const exercise = byId.get(slot.exerciseId);
          return (
            <Card key={slot.exerciseId} tone="low" style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyMd" weight="semibold">
                    {exercise?.name ?? 'Removed exercise'}
                  </AppText>
                  <AppText variant="bodySm" color="onSurfaceVariant">
                    {exercise ? exercise.muscles : 'This exercise no longer exists. Remove it.'}
                  </AppText>
                </View>
                {exercise?.video ? (
                  <IconButton
                    icon="play_circle"
                    label={`How to do ${exercise.name}`}
                    onPress={() => setVideoExercise(exercise)}
                  />
                ) : null}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <IconButton
                    icon="remove"
                    label={`Fewer sets for ${exercise?.name ?? 'exercise'}`}
                    onPress={() => update({ slots: changeSets(draft.slots, index, -1) })}
                    disabled={slot.sets <= 1}
                  />
                  <AppText
                    variant="bodyMd"
                    weight="semibold"
                    accessibilityLabel={`${slot.sets} sets`}
                  >
                    {slot.sets} {slot.sets === 1 ? 'set' : 'sets'}
                  </AppText>
                  <IconButton
                    icon="add"
                    label={`More sets for ${exercise?.name ?? 'exercise'}`}
                    onPress={() => update({ slots: changeSets(draft.slots, index, 1) })}
                    disabled={slot.sets >= MAX_SETS}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <IconButton
                    icon="arrow_upward"
                    label={`Move ${exercise?.name ?? 'exercise'} up`}
                    onPress={() => update({ slots: moveSlot(draft.slots, index, -1) })}
                    disabled={index === 0}
                  />
                  <IconButton
                    icon="arrow_downward"
                    label={`Move ${exercise?.name ?? 'exercise'} down`}
                    onPress={() => update({ slots: moveSlot(draft.slots, index, 1) })}
                    disabled={index === draft.slots.length - 1}
                  />
                  <IconButton
                    icon="delete_outline"
                    label={`Remove ${exercise?.name ?? 'exercise'}`}
                    onPress={() => update({ slots: removeSlot(draft.slots, index) })}
                  />
                </View>
              </View>
            </Card>
          );
        })}
        {errors.slots ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {errors.slots}
          </AppText>
        ) : null}
        <SecondaryButton
          label="Add exercises"
          onPress={() => setPicking(true)}
          leftIcon={<Icon name="add" size={18} color="primary" />}
        />
      </View>

      {saveRoutine.error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {saveRoutine.error.message}
        </AppText>
      ) : null}

      {existing ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmDelete(true)}
          style={{ alignItems: 'center', padding: 12 }}
        >
          <AppText variant="bodyMd" color="error" weight="semibold">
            Delete routine
          </AppText>
        </Pressable>
      ) : null}

      <ExercisePicker
        visible={picking}
        onClose={() => setPicking(false)}
        exercises={catalog.data ?? []}
        alreadyAdded={inRoutine}
        onConfirm={(ids) => {
          update({ slots: addExercises(draft.slots, ids) });
          setPicking(false);
        }}
        onSaveCustom={(exercise) => saveExercise.mutateAsync(exercise)}
      />
      <ExerciseVideoSheet exercise={videoExercise} onClose={() => setVideoExercise(null)} />
      <ConfirmationModal
        visible={confirmDelete}
        title="Delete this routine?"
        message="Your logged workouts stay in your history."
        confirmLabel="Delete"
        destructive
        loading={deleteRoutine.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return;
          deleteRoutine.mutate(existing.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.back();
            },
          });
        }}
      />
    </Screen>
  );
}
