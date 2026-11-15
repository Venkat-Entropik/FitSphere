import { useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { newCustomId } from '../services/workout.service';
import type { Equipment, Exercise, MuscleGroup } from '../types/workout-record.types';
import {
  EQUIPMENT,
  MUSCLE_GROUPS,
  validateCustomExercise,
  type CustomExerciseErrors,
} from '../utils/routine.logic';

export interface CustomExerciseSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Names already in the library, to stop duplicates. */
  existingNames: readonly string[];
  /** Saves the exercise (queued for sync). Resolves when it is stored on the phone. */
  onSave: (exercise: Exercise) => Promise<unknown>;
}

const EMPTY = { name: '', minReps: '8', maxReps: '12', startKg: '0' };

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <AppText variant="bodySm" color="error" accessibilityRole="alert">
      {message}
    </AppText>
  ) : null;
}

/** Create your own exercise: name, muscle, equipment, rep range and starting weight. */
export function CustomExerciseSheet({
  visible,
  onClose,
  existingNames,
  onSave,
}: CustomExerciseSheetProps) {
  const [form, setForm] = useState(EMPTY);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [errors, setErrors] = useState<CustomExerciseErrors>({});
  const [saving, setSaving] = useState(false);

  const close = () => {
    setForm(EMPTY);
    setMuscleGroup(null);
    setEquipment(null);
    setErrors({});
    onClose();
  };

  const save = async () => {
    const result = validateCustomExercise(
      { ...form, muscleGroup, equipment },
      newCustomId('custom'),
      existingNames,
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.exercise);
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="New exercise">
      <View style={{ gap: 12 }}>
        <CustomInput
          label="Name"
          placeholder="e.g. Landmine press"
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          error={errors.name}
          maxLength={60}
        />
        <View style={{ gap: 6 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Main muscle
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MUSCLE_GROUPS.map((g) => (
              <Chip
                key={g.id}
                label={g.label}
                selected={muscleGroup === g.id}
                onPress={() => setMuscleGroup(g.id)}
              />
            ))}
          </View>
          <ErrorText message={errors.muscleGroup} />
        </View>
        <View style={{ gap: 6 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Equipment
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EQUIPMENT.map((e) => (
              <Chip
                key={e.id}
                label={e.label}
                selected={equipment === e.id}
                onPress={() => setEquipment(e.id)}
              />
            ))}
          </View>
          <ErrorText message={errors.equipment} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <CustomInput
              label="Min reps"
              keyboardType="number-pad"
              value={form.minReps}
              onChangeText={(minReps) => setForm((f) => ({ ...f, minReps }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomInput
              label="Max reps"
              keyboardType="number-pad"
              value={form.maxReps}
              onChangeText={(maxReps) => setForm((f) => ({ ...f, maxReps }))}
            />
          </View>
        </View>
        <ErrorText message={errors.reps} />
        <CustomInput
          label="Starting weight (kg)"
          helperText="Use 0 for bodyweight. The app raises it when you hit the top of your rep range."
          keyboardType="decimal-pad"
          value={form.startKg}
          onChangeText={(startKg) => setForm((f) => ({ ...f, startKg }))}
          error={errors.startKg}
        />
        <PrimaryButton label="Save exercise" onPress={() => void save()} loading={saving} />
        <SecondaryButton label="Cancel" onPress={close} size="md" />
      </View>
    </BottomSheet>
  );
}
