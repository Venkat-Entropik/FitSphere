import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useLogWeight } from '@/features/profile/hooks/useProfile';
import { parseNumberInput } from '@/features/profile/utils/profile.view';

export interface LogWeighInSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Same limits the server enforces, so a value that passes here is never refused later. */
const LIMITS = {
  weight: { min: 30, max: 250 },
  bodyFat: { min: 2, max: 70 },
  muscle: { min: 10, max: 200 },
} as const;

type Errors = Partial<Record<'weight' | 'bodyFat' | 'muscle', string>>;

function check(raw: { weight: string; bodyFat: string; muscle: string }) {
  const errors: Errors = {};
  const weight = parseNumberInput(raw.weight);
  if (weight === null || weight < LIMITS.weight.min || weight > LIMITS.weight.max) {
    errors.weight = `Enter a weight between ${LIMITS.weight.min} and ${LIMITS.weight.max} kg`;
  }
  const optional = (value: string, key: 'bodyFat' | 'muscle', label: string) => {
    if (value.trim() === '') return undefined;
    const n = parseNumberInput(value);
    const { min, max } = LIMITS[key];
    if (n === null || n < min || n > max)
      errors[key] = `${label} must be between ${min} and ${max}`;
    return n ?? undefined;
  };
  const bodyFatPercent = optional(raw.bodyFat, 'bodyFat', 'Body fat');
  const muscleKg = optional(raw.muscle, 'muscle', 'Muscle mass');
  return { errors, weight, bodyFatPercent, muscleKg };
}

/** Logs today's weight, and optionally body fat and muscle mass. Saved on the phone first; syncs when online. */
export function LogWeighInSheet({ visible, onClose }: LogWeighInSheetProps) {
  const logWeight = useLogWeight();
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const close = () => {
    setWeight('');
    setBodyFat('');
    setMuscle('');
    setErrors({});
    logWeight.reset();
    onClose();
  };

  const save = () => {
    const result = check({ weight, bodyFat, muscle });
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0 || result.weight === null) return;
    logWeight.mutate(
      {
        kg: result.weight,
        ...(result.bodyFatPercent !== undefined && { bodyFatPercent: result.bodyFatPercent }),
        ...(result.muscleKg !== undefined && { muscleKg: result.muscleKg }),
      },
      { onSuccess: close },
    );
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Log weigh-in">
      <View style={{ gap: 12 }}>
        <AppText variant="bodySm" color="onSurfaceVariant">
          Logging again on the same day replaces that day&apos;s entry.
        </AppText>
        <CustomInput
          label="Weight (kg)"
          placeholder="e.g. 72.4"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
          error={errors.weight}
          autoFocus
        />
        <CustomInput
          label="Body fat % (optional)"
          placeholder="e.g. 15.5"
          keyboardType="decimal-pad"
          value={bodyFat}
          onChangeText={setBodyFat}
          error={errors.bodyFat}
        />
        <CustomInput
          label="Muscle mass, kg (optional)"
          placeholder="e.g. 34.2"
          keyboardType="decimal-pad"
          value={muscle}
          onChangeText={setMuscle}
          error={errors.muscle}
        />
        {logWeight.error ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {logWeight.error.message}
          </AppText>
        ) : null}
        <PrimaryButton label="Save weigh-in" onPress={save} loading={logWeight.isPending} />
        <SecondaryButton label="Cancel" onPress={close} size="md" />
      </View>
    </BottomSheet>
  );
}
