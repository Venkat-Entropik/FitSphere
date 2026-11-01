import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CustomInput } from '@/components/ui/CustomInput';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/theme';
import type {
  Experience,
  GoalId,
  OnboardingProfile,
} from '@/features/authentication/types/onboarding.types';
import { EXPERIENCE_OPTIONS, GOALS } from '@/features/authentication/utils/onboarding.logic';

import type { ProfilePatch } from '../types/profile.types';
import { parseNumberInput } from '../utils/profile.view';

export type FieldErrors = Partial<Record<keyof OnboardingProfile, string>>;

const SHORT_GOAL: Record<GoalId, string> = {
  muscle: 'Build Muscle',
  fat_loss: 'Fat Loss',
  endurance: 'Endurance',
  athletic: 'Performance',
};

function DaysStepper({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  const theme = useTheme();
  const button = (label: string, delta: number, disabled: boolean, icon: 'remove' | 'add') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onChange(value + delta)}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surfaceHigh,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {button('Fewer training days', -1, value <= 1, 'remove')}
      <AppText
        variant="headlineMd"
        tabular
        accessibilityLabel={`${value} days per week`}
        style={{ minWidth: 28, textAlign: 'center' }}
      >
        {value}
      </AppText>
      {button('More training days', 1, value >= 7, 'add')}
    </View>
  );
}

export interface EditProfileSheetProps {
  visible: boolean;
  profile: OnboardingProfile;
  onClose: () => void;
  /** Resolves to per-field errors, or null once everything was accepted. */
  onSave: (patch: ProfilePatch) => Promise<FieldErrors | null>;
}

/** Edits goal, experience, training days and body metrics in one place; saves only what changed. */
export function EditProfileSheet({ visible, profile, onClose, onSave }: EditProfileSheetProps) {
  const [goal, setGoal] = useState<GoalId>(profile.goal);
  const [experience, setExperience] = useState<Experience>(profile.experience);
  const [days, setDays] = useState(profile.daysPerWeek);
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [target, setTarget] = useState(String(profile.targetKg));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = {
      heightCm: parseNumberInput(height),
      weightKg: parseNumberInput(weight),
      targetKg: parseNumberInput(target),
    };
    const labels = { heightCm: 'Height', weightKg: 'Weight', targetKg: 'Target' } as const;
    const local: FieldErrors = {};
    for (const key of Object.keys(parsed) as (keyof typeof parsed)[]) {
      if (parsed[key] === null) local[key] = `${labels[key]} must be a number`;
    }
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    const next: OnboardingProfile = {
      ...profile,
      goal,
      experience,
      daysPerWeek: days,
      heightCm: parsed.heightCm!,
      weightKg: parsed.weightKg!,
      targetKg: parsed.targetKg!,
    };
    const patch = (Object.keys(next) as (keyof OnboardingProfile)[]).reduce<
      Record<string, unknown>
    >((acc, key) => {
      if (next[key] !== profile[key]) acc[key] = next[key];
      return acc;
    }, {}) as ProfilePatch;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    const problems = await onSave(patch);
    setSaving(false);
    if (problems) setErrors(problems);
    else onClose();
  };

  const numeric = (
    label: string,
    value: string,
    set: (v: string) => void,
    key: 'heightCm' | 'weightKg' | 'targetKg',
  ) => (
    <View style={{ flex: 1 }}>
      <CustomInput
        label={label}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={(v) => {
          set(v);
          setErrors((e) => ({ ...e, [key]: undefined }));
        }}
        error={errors[key]}
        selectTextOnFocus
      />
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit profile">
      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Goal
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map((g) => (
              <Chip
                key={g.id}
                size="lg"
                label={SHORT_GOAL[g.id]}
                selected={goal === g.id}
                onPress={() => setGoal(g.id)}
              />
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Experience
          </AppText>
          <SegmentedControl
            options={EXPERIENCE_OPTIONS.map((o) => o.label)}
            value={EXPERIENCE_OPTIONS.find((o) => o.id === experience)!.label}
            onChange={(label) =>
              setExperience(EXPERIENCE_OPTIONS.find((o) => o.label === label)!.id)
            }
            accessibilityLabel="Experience level"
          />
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <AppText variant="bodyMd" weight="medium">
              Training days / week
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {7 - days} rest days
            </AppText>
          </View>
          <DaysStepper value={days} onChange={setDays} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {numeric('Height (cm)', height, setHeight, 'heightCm')}
          {numeric('Weight (kg)', weight, setWeight, 'weightKg')}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {numeric('Target (kg)', target, setTarget, 'targetKg')}
        </View>
        {(errors.goal ?? errors.experience ?? errors.daysPerWeek) ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {errors.goal ?? errors.experience ?? errors.daysPerWeek}
          </AppText>
        ) : null}
        <PrimaryButton label="Save changes" onPress={() => void save()} loading={saving} />
      </View>
    </BottomSheet>
  );
}
