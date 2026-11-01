import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

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

import { AdaptationBanner } from '../components/AdaptationBanner';
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
  GOALS,
  recommendedGoal,
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

const STEP = 3;
const TOTAL_STEPS = 4;

function OnboardingForm({ draft }: { draft: OnboardingDraft }) {
  const router = useRouter();
  const theme = useTheme();
  const save = useSaveOnboarding();
  const skipOnboarding = usePreferencesStore((s) => s.skipOnboarding);
  const {
    control,
    handleSubmit,
    setValue,
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

  const goHome = () => router.replace('/');
  const submit = handleSubmit(async (formValues) => {
    await save.mutateAsync(toProfile(formValues));
    goHome();
  });

  // heightCm / weightKg / targetKg are all string form fields.
  const field = (name: 'heightCm' | 'weightKg' | 'targetKg') => ({
    value: values[name],
    onChange: (v: string) =>
      setValue(name as 'heightCm', v, { shouldValidate: true, shouldDirty: true }),
    error: errors[name]?.message,
  });

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
            label="Complete Setup & Launch Dashboard"
            onPress={() => void submit()}
            loading={save.isPending}
            rightContent={<Icon name="arrow_forward" size={20} color="onPrimary" />}
          />
          <AppText variant="bodySm" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
            You can fine-tune biometrics, calorie margins, and target split anytime in Profile
            settings.
          </AppText>
        </View>
      }
    >
      <View style={{ paddingTop: 8 }}>
        <OnboardingHeader
          step={STEP}
          totalSteps={TOTAL_STEPS}
          onBack={() => {
            if (router.canGoBack()) router.back();
          }}
          onSkip={() => {
            skipOnboarding();
            goHome();
          }}
        />
      </View>

      <View style={{ gap: 6, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="auto_awesome" size={14} color="primary" />
          <AppText variant="labelCaps" color="primary" uppercase style={{ letterSpacing: 1.6 }}>
            Target Calibration Engine
          </AppText>
        </View>
        <AppText variant="headlineLgMobile" color="onSurface" accessibilityRole="header">
          Tailor Your Sphere.
        </AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant">
          Precision AI tuning adapts your volume, recovery, and macro targets directly to your
          physiological baseline.
        </AppText>
      </View>

      <View style={{ gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Primary Directive
          </AppText>
          <AppText variant="bodySm" color="primary">
            Adaptive Macro Adjuster Active
          </AppText>
        </View>
        <Controller
          control={control}
          name="goal"
          render={({ field: f }) => (
            <GoalSelector
              goals={GOALS}
              value={f.value}
              recommended={recommendedGoal(live.weightKg, live.targetKg)}
              onChange={f.onChange}
            />
          )}
        />
      </View>

      <BiometricMatrix
        idLabel={`ID: ${draft.identity.name.toUpperCase()} · ${draft.identity.age}Y`}
        sex={values.sex}
        onToggleSex={() => setValue('sex', values.sex === 'male' ? 'female' : 'male')}
        height={field('heightCm')}
        weight={field('weightKg')}
        target={{ ...field('targetKg'), badge: formatDelta(targetDelta(live)) }}
      />

      <View style={{ gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Experience Calibration
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {experience.years}
          </AppText>
        </View>
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
              glowing
            />
          )}
        />
        <CadenceCard
          days={values.daysPerWeek}
          label={cadence.label}
          rest={cadence.rest}
          onChange={(days) => setValue('daysPerWeek', days, { shouldValidate: true })}
        />
      </View>

      <SynthesisPanel synthesis={synthesis} />
      <AdaptationBanner />
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
