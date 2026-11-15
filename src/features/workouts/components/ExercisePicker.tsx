import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/common/Chip';
import { AppText } from '@/components/ui/AppText';
import { CustomInput } from '@/components/ui/CustomInput';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useTheme } from '@/theme';

import type { Exercise, MuscleGroup } from '../types/workout-record.types';
import { CustomExerciseSheet } from './CustomExerciseSheet';
import { ExerciseVideoSheet } from './ExerciseVideoSheet';
import { filterExercises } from '../utils/workout-history.logic';
import { isCustomExercise, MUSCLE_GROUPS } from '../utils/routine.logic';

export interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  exercises: readonly Exercise[];
  /** Exercises already in the routine; shown as added and not selectable again. */
  alreadyAdded: ReadonlySet<string>;
  onConfirm: (exerciseIds: string[]) => void;
  /** Saves an exercise the user created inside the picker; it is ticked automatically. */
  onSaveCustom: (exercise: Exercise) => Promise<unknown>;
}

/** Full-screen exercise library: search, filter by muscle, tick several, add them in one go. */
export function ExercisePicker({
  visible,
  onClose,
  exercises,
  alreadyAdded,
  onConfirm,
  onSaveCustom,
}: ExercisePickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | undefined>();
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null);

  const selected = useMemo(() => new Set(picked), [picked]);
  const visibleList = useMemo(
    () => filterExercises(exercises, { query, muscleGroup: muscle }),
    [exercises, query, muscle],
  );

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = () => {
    onConfirm([...selected].filter((id) => !alreadyAdded.has(id)));
    setPicked([]);
    setQuery('');
    setMuscle(undefined);
  };
  const count = [...selected].filter((id) => !alreadyAdded.has(id)).length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AppText variant="headlineMd" accessibilityRole="header">
              Add exercises
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
            >
              <Icon name="close" size={24} color="onSurfaceVariant" />
            </Pressable>
          </View>
          <CustomInput
            label="Search"
            placeholder="Search by name or muscle"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip
              label="All"
              selected={muscle === undefined}
              onPress={() => setMuscle(undefined)}
            />
            {MUSCLE_GROUPS.map((g) => (
              <Chip
                key={g.id}
                label={g.label}
                selected={muscle === g.id}
                onPress={() => setMuscle(muscle === g.id ? undefined : g.id)}
              />
            ))}
          </View>
        </View>

        <FlatList
          data={visibleList}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ gap: 12, paddingVertical: 24 }}>
              <AppText variant="bodyMd" color="onSurfaceVariant">
                No exercise matches. Create it yourself instead.
              </AppText>
              <SecondaryButton
                label="Create exercise"
                onPress={() => setCreating(true)}
                size="md"
              />
            </View>
          }
          ListHeaderComponent={
            visibleList.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create your own exercise"
                onPress={() => setCreating(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
              >
                <Icon name="add_circle" size={20} color="primary" />
                <AppText variant="bodyMd" color="primary" weight="semibold">
                  Create your own exercise
                </AppText>
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => {
            const added = alreadyAdded.has(item.id);
            const isSelected = selected.has(item.id);
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  borderRadius: theme.radius.sm,
                  backgroundColor:
                    isSelected && !added ? 'rgba(197, 242, 106, 0.15)' : theme.colors.surface,
                  opacity: added ? 0.5 : 1,
                }}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={item.name}
                  accessibilityState={{ checked: isSelected || added, disabled: added }}
                  disabled={added}
                  onPress={() => toggle(item.id)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Icon
                    name={isSelected || added ? 'check_circle' : 'radio_button_unchecked'}
                    size={22}
                    color={isSelected || added ? 'primary' : 'outline'}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyMd" weight="semibold">
                      {item.name}
                    </AppText>
                    <AppText variant="bodySm" color="onSurfaceVariant">
                      {isCustomExercise(item.id) ? 'Yours · ' : ''}
                      {item.muscles} · {item.equipment}
                      {added ? ' · Already added' : ''}
                    </AppText>
                  </View>
                </Pressable>
                {item.video ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`How to do ${item.name}`}
                    onPress={() => setVideoExercise(item)}
                    hitSlop={8}
                  >
                    <Icon name="play_circle" size={26} color="primary" />
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />

        <View style={{ padding: 20, paddingBottom: 20 + insets.bottom, gap: 8 }}>
          <PrimaryButton
            label={
              count > 0
                ? `Add ${count} ${count === 1 ? 'exercise' : 'exercises'}`
                : 'Select exercises to add'
            }
            onPress={finish}
            disabled={count === 0}
          />
        </View>
        <ExerciseVideoSheet exercise={videoExercise} onClose={() => setVideoExercise(null)} />
        <CustomExerciseSheet
          visible={creating}
          onClose={() => setCreating(false)}
          existingNames={exercises.map((e) => e.name)}
          onSave={async (exercise) => {
            await onSaveCustom(exercise);
            setPicked((p) => [...p, exercise.id]);
          }}
        />
      </View>
    </Modal>
  );
}
