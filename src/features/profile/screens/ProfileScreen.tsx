import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { env } from '@/config/env';
import { useActivityHistory } from '@/features/activities/hooks/useActivityHistory';
import { useLogout } from '@/features/authentication/hooks/useLogout';
import { goalById } from '@/features/authentication/utils/onboarding.logic';
import { useNutritionDay } from '@/features/nutrition/hooks/useNutrition';
import { consumedKcal } from '@/features/nutrition/utils/nutrition.logic';
import { useWorkoutHistory } from '@/features/workouts/hooks/useWorkoutData';
import { toApiError } from '@/services/api/api-error';
import { usePreferencesStore } from '@/store/preferences.store';

import { BaselineCard } from '../components/BaselineCard';
import { EditProfileSheet, type FieldErrors } from '../components/EditProfileSheet';
import { IdentityCard } from '../components/IdentityCard';
import { MembershipCard } from '../components/MembershipCard';
import { PreferencesCard } from '../components/PreferencesCard';
import { ProfileTopBar } from '../components/ProfileTopBar';
import { SecurityCard } from '../components/SecurityCard';
import { TelemetryCard } from '../components/TelemetryCard';
import { useExportTelemetry } from '../hooks/useExportTelemetry';
import { useNutritionTargets, useProfile, useUpdateProfile, useWeights } from '../hooks/useProfile';
import { useReminderSetting } from '../hooks/useReminderSetting';
import { useResetDemoData } from '../hooks/useResetDemoData';
import { sampleMembership, sampleSensors } from '../services/sample-account.mock';
import { ProfileValidationError } from '../services/profile.service';
import type { ProfilePatch } from '../types/profile.types';
import {
  cadenceSummary,
  goalTrajectory,
  headerStats,
  intakeSummary,
  proteinNote,
} from '../utils/profile.stats';

type Confirm = 'logout' | 'reset' | null;

export function ProfileScreen() {
  const profile = useProfile();
  const weights = useWeights();
  const workouts = useWorkoutHistory();
  const activities = useActivityHistory();
  const targets = useNutritionTargets();
  const day = useNutritionDay();
  const update = useUpdateProfile();
  const reminder = useReminderSetting();
  const logout = useLogout();
  const resetDemo = useResetDemoData();
  const exportTelemetry = useExportTelemetry();
  const autoOverload = usePreferencesStore((s) => s.autoProgressiveOverload);
  const setAutoOverload = usePreferencesStore((s) => s.setAutoProgressiveOverload);
  const restHaptics = usePreferencesStore((s) => s.restHaptics);
  const setRestHaptics = usePreferencesStore((s) => s.setRestHaptics);
  const units = usePreferencesStore((s) => s.units);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  if (profile.isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading your profile" />
      </Screen>
    );
  }
  if (profile.error || !profile.data) {
    return (
      <Screen>
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      </Screen>
    );
  }

  const data = profile.data;
  const p = data.profile;
  const stats = headerStats({
    now,
    profile: data,
    weights: weights.data ?? [],
    workouts: workouts.data ?? [],
    activities: activities.data ?? [],
  });
  const budget = targets.data?.budgetKcal ?? 0;
  const intake = intakeSummary(day.data ? consumedKcal(day.data.meals) : 0, budget);
  const cadence = cadenceSummary(data);

  const save = async (patch: ProfilePatch): Promise<FieldErrors | null> => {
    try {
      await update.mutateAsync(patch);
      return null;
    } catch (error) {
      if (error instanceof ProfileValidationError) return error.fieldErrors;
      return { weightKg: toApiError(error).message };
    }
  };

  const share = () => {
    setExportError(null);
    exportTelemetry().catch(() => setExportError("Couldn't open the share sheet on this device."));
  };

  return (
    <Screen scroll>
      <ProfileTopBar onShare={share} onEdit={() => setEditing(true)} />

      <IdentityCard
        name={data.identity.name}
        tierLabel={sampleMembership.tierLabel}
        subtitle={`${stats.goalSubtitle} • Phase ${stats.phase}`}
        massKg={stats.massKg}
        heightCm={stats.heightCm}
        bodyFatPercent={stats.bodyFatPercent}
        streak={stats.streak}
      />

      <BaselineCard
        trajectory={goalTrajectory(data, weights.data ?? [])}
        intake={{ ...intake, budgetKcal: budget }}
        proteinG={targets.data?.protein ?? 0}
        proteinNote={proteinNote(goalById(p.goal).proteinPerKg)}
        cadence={cadence}
        onEdit={() => setEditing(true)}
      />

      <TelemetryCard sensors={sampleSensors} />

      <PreferencesCard
        splitSubtitle={`${cadence.split} (${stats.goalSubtitle.split(' ')[0]})`}
        onEditSplit={() => setEditing(true)}
        autoOverload={{ value: autoOverload, onChange: setAutoOverload }}
        restHaptics={{ value: restHaptics, onChange: setRestHaptics }}
      />

      <MembershipCard membership={sampleMembership} />

      <SecurityCard
        units={units}
        reminder={{ ...reminder, onToggle: (next) => void reminder.toggle(next) }}
        onExport={share}
        onOpenSettings={() => void Linking.openSettings()}
      />
      {exportError ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {exportError}
        </AppText>
      ) : null}

      <View style={{ gap: 10 }}>
        {env.useMocks ? (
          <SecondaryButton label="Reset demo data" onPress={() => setConfirm('reset')} size="md" />
        ) : null}
        <SecondaryButton
          label="Log Out of FitSphere"
          onPress={() => setConfirm('logout')}
          leftIcon={<Icon name="logout" size={18} color="error" />}
        />
        <AppText
          variant="labelCaps"
          color="onSurfaceVariant"
          uppercase
          style={{ textAlign: 'center', marginTop: 6 }}
        >
          FitSphere v{Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
      </View>

      {editing ? (
        <EditProfileSheet visible profile={p} onClose={() => setEditing(false)} onSave={save} />
      ) : null}

      <ConfirmationModal
        visible={confirm === 'logout'}
        title="Sign out?"
        message="You'll be signed out on this device and reminders will be turned off."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void logout();
        }}
      />
      <ConfirmationModal
        visible={confirm === 'reset'}
        title="Reset demo data?"
        message="This replaces your logged workouts, runs, meals and weights with the sample data and restarts onboarding."
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void resetDemo();
        }}
      />
    </Screen>
  );
}
