import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toApiError } from '@/services/api/api-error';
import { usePreferencesStore } from '@/store/preferences.store';
import { useTheme } from '@/theme';

import { BiometricMatrix } from '../components/BiometricMatrix';
import { CadenceCard } from '../components/CadenceCard';
import { GoalSelector } from '../components/GoalSelector';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { SynthesisPanel } from '../components/SynthesisPanel';
import { useOnboardingDraft, useSaveOnboarding } from '../hooks/useOnboarding';
import type { OnboardingDraft } from '../types/onboarding.types';
import {
  cadenceSummary,
  EXPERIENCE_OPTIONS,
  formatDelta,
  goalById,
  GOALS,
  synthesize,
  targetDelta,
} from '../utils/onboarding.logic';
import {
  onboardingSchema,
  previewProfile,
  toFormValues,
  toProfile,
  type OnboardingFormValues,
} from '../utils/onboarding.schema';

const TOTAL_STEPS = 4;

const COPY: Record<number, { title: string; body: string }> = {
  1: { title: 'What is your main goal?', body: 'We use it to set your calories and protein.' },
  2: { title: 'Tell us about you', body: 'This helps us estimate how much you should eat.' },
  3: {
    title: 'How do you train?',
    body: 'Pick your experience and how many days a week you can train.',
  },
  4: {
    title: 'Your plan is ready',
    body: 'This is where we start. You can change anything later in Profile.',
  },
};

function Summary({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <Card style={{ gap: 10 }}>
      {rows.map((r) => (
        <View
          key={r.label}
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
        >
          <AppText variant="bodyMd" color="onSurfaceVariant">
            {r.label}
          </AppText>
          <AppText variant="bodyMd" color="onSurface" weight="semibold">
            {r.value}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

function OnboardingForm({ draft }: { draft: OnboardingDraft }) {
  const router = useRouter();
  const theme = useTheme();
  const save = useSaveOnboarding();
  const skipOnboarding = usePreferencesStore((s) => s.skipOnboarding);
  const [step, setStep] = useState(1);
  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: toFormValues(draft.profile),
  });

  const values = useWatch({ control }) as OnboardingFormValues;
  const live = previewProfile(values, draft.profile);
  const synthesis = synthesize(live, draft.identity);
  const cadence = cadenceSummary(values.goal, values.daysPerWeek);
  const experience = EXPERIENCE_OPTIONS.find((o) => o.id === values.experience)!;
  const delta = targetDelta(live);

  const goHome = () => router.replace('/');
  const submit = handleSubmit(async (formValues) => {
    await save.mutateAsync(toProfile(formValues));
    goHome();
  });

  const next = async () => {
    if (step === 2 && !(await trigger(['heightCm', 'weightKg', 'targetKg']))) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
    else void submit();
  };
  const back = () => {
    if (step > 1) setStep(step - 1);
    else if (router.canGoBack()) router.back();
  };

  // heightCm / weightKg / targetKg are all string form fields.
  const field = (name: 'heightCm' | 'weightKg' | 'targetKg') => ({
    value: values[name],
    onChange: (v: string) =>
      setValue(name as 'heightCm', v, { shouldValidate: true, shouldDirty: true }),
    error: errors[name]?.message,
  });

  const last = step === TOTAL_STEPS;
  return (
    <Screen
      scroll
      footer={
        <View
          style={{
            gap: 10,
            paddingHorizontal: theme.spacing.gutterX,
            paddingTop: 12,
            paddingBottom: 16,
            backgroundColor: theme.colors.surfaceLowest,
          }}
        >
          {save.error ? (
            <AppText
              variant="bodySm"
              color="error"
              accessibilityRole="alert"
              style={{ textAlign: 'center' }}
            >
              {toApiError(save.error).message}
            </AppText>
          ) : null}
          <Button
            size="lg"
            label={last ? 'Start training' : 'Continue'}
            onPress={() => void next()}
            loading={save.isPending}
            rightContent={<Icon name="arrow_forward" size={20} color="onPrimary" />}
          />
        </View>
      }
    >
      <View style={{ paddingTop: 8 }}>
        <OnboardingHeader
          step={step}
          totalSteps={TOTAL_STEPS}
          onBack={step > 1 || router.canGoBack() ? back : undefined}
          onSkip={() => {
            skipOnboarding();
            goHome();
          }}
        />
      </View>

      <View style={{ gap: 6, paddingTop: 4 }}>
        <AppText variant="headlineLgMobile" color="onSurface" accessibilityRole="header">
          {COPY[step]!.title}
        </AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant">
          {COPY[step]!.body}
        </AppText>
      </View>

      {step === 1 ? (
        <Controller
          control={control}
          name="goal"
          render={({ field: f }) => (
            <GoalSelector goals={GOALS} value={f.value} onChange={f.onChange} />
          )}
        />
      ) : null}

      {step === 2 ? (
        <BiometricMatrix
          sex={values.sex}
          onChangeSex={(sex) => setValue('sex', sex)}
          height={field('heightCm')}
          weight={field('weightKg')}
          target={{
            ...field('targetKg'),
            badge: delta === 0 ? 'Maintain' : `${formatDelta(delta)} to go`,
          }}
        />
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 10 }}>
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Experience
            </AppText>
            <Controller
              control={control}
              name="experience"
              render={({ field: f }) => (
                <SegmentedControl
                  options={EXPERIENCE_OPTIONS.map((o) => o.label)}
                  value={experience.label}
                  onChange={(label) =>
                    f.onChange(EXPERIENCE_OPTIONS.find((o) => o.label === label)!.id)
                  }
                  accessibilityLabel="Experience level"
                  trackColor="surfaceLowest"
                />
              )}
            />
            <AppText variant="bodySm" color="onSurfaceVariant">
              {experience.years}
            </AppText>
          </View>
          <CadenceCard
            days={values.daysPerWeek}
            label={cadence.label}
            rest={cadence.rest}
            onChange={(days) => setValue('daysPerWeek', days, { shouldValidate: true })}
          />
        </View>
      ) : null}

      {step === 4 ? (
        <View style={{ gap: 16 }}>
          <SynthesisPanel synthesis={synthesis} />
          <Summary
            rows={[
              { label: 'Goal', value: goalById(values.goal).title },
              {
                label: 'Weight',
                value: `${live.weightKg} kg → ${live.targetKg} kg`,
              },
              { label: 'Experience', value: experience.label },
              { label: 'Training', value: `${values.daysPerWeek} days a week` },
            ]}
          />
        </View>
      ) : null}
    </Screen>
  );
}

export function OnboardingScreen() {
  const { data, isPending, error, refetch } = useOnboardingDraft();
  if (isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Preparing your profile" />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }
  return <OnboardingForm draft={data} />;
}
