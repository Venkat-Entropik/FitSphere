import { useState } from 'react';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useHydrated } from '@/hooks/useHydrated';
import { useNow } from '@/hooks/useNow';
import { toApiError } from '@/services/api/api-error';
import { useActiveWorkoutStore } from '@/store/active-workout.store';

import { ExerciseTrackerCard } from '../components/ExerciseTrackerCard';
import { NextExerciseBar } from '../components/NextExerciseBar';
import { RestTimerCard } from '../components/RestTimerCard';
import { SessionTelemetryCard } from '../components/SessionTelemetryCard';
import { WorkoutActionDock } from '../components/WorkoutActionDock';
import { WorkoutCategoryChips } from '../components/WorkoutCategoryChips';
import { useStartWorkout } from '../hooks/useStartWorkout';
import {
  useFinishWorkout,
  useNextPlan,
  useWorkoutCategories,
  useWorkoutPlans,
} from '../hooks/useWorkoutData';
import {
  activeSet,
  completedSetCount,
  currentExercise,
  formatClock,
  formatVolume,
  nextExercise,
  restRemainingSeconds,
  sessionVolumeKg,
  totalSetCount,
} from '../utils/workout.logic';

export function WorkoutsScreen() {
  const hydrated = useHydrated(useActiveWorkoutStore);
  const categories = useWorkoutCategories();
  const plans = useWorkoutPlans();
  const suggestedPlan = useNextPlan();
  const startWorkout = useStartWorkout();
  const finishWorkout = useFinishWorkout();
  const { session, rest, adjustWeight, adjustReps, logSet, addRest, skipRest } =
    useActiveWorkoutStore();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);

  // Ticks once per second only while a session is on screen; cleared on unmount.
  const now = useNow(session !== null);

  if (!hydrated || categories.isPending || plans.isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading workout" />
      </Screen>
    );
  }
  if (categories.error || plans.error) {
    return (
      <Screen>
        <ErrorState
          error={categories.error ?? plans.error}
          onRetry={() => {
            void categories.refetch();
            void plans.refetch();
          }}
        />
      </Screen>
    );
  }

  const exercise = session ? currentExercise(session) : undefined;
  if (!session || !exercise) {
    const selectedId = categoryId ?? suggestedPlan?.categoryId ?? 'push';
    const plan = plans.data?.find((p) => p.categoryId === selectedId) ?? suggestedPlan;
    return (
      <Screen scroll>
        <WorkoutCategoryChips
          categories={categories.data ?? []}
          selectedId={selectedId}
          onSelect={setCategoryId}
        />
        <EmptyState
          icon="fitness_center"
          title="No active workout"
          message={
            plan
              ? `${plan.name}. Loads and rep targets are set from your last sessions.`
              : 'Pick a day to start a session.'
          }
          actionLabel={plan ? `Start ${plan.name.split(' –')[0]}` : undefined}
          onAction={plan ? () => void startWorkout(plan.id) : undefined}
        />
      </Screen>
    );
  }

  const set = activeSet(exercise);
  const upNext = nextExercise(session);
  const restSeconds = rest ? restRemainingSeconds(rest.endsAt, now) : 0;

  return (
    <Screen scroll>
      <WorkoutCategoryChips
        categories={categories.data ?? []}
        selectedId={plans.data?.find((p) => p.id === session.planId)?.categoryId ?? 'push'}
        onSelect={() => undefined}
      />
      <SessionTelemetryCard
        title={session.title}
        elapsed={formatClock((now - session.startedAt) / 1000)}
        volume={formatVolume(sessionVolumeKg(session))}
        setsDone={completedSetCount(session)}
        setsTotal={totalSetCount(session)}
        heartRateBpm={session.heartRateBpm}
        onOpenSettings={() => undefined}
      />
      <ExerciseTrackerCard
        exercise={exercise}
        position={session.completedExerciseCount + session.currentExerciseIndex + 1}
        total={session.totalExerciseCount}
        activeSetNumber={set?.number ?? null}
        onAdjustWeight={adjustWeight}
        onAdjustReps={adjustReps}
      />
      {rest && restSeconds > 0 ? (
        <RestTimerCard
          remainingSeconds={restSeconds}
          totalSeconds={rest.totalSeconds}
          onAdd={() => addRest()}
          onSkip={skipRest}
        />
      ) : null}
      {upNext ? <NextExerciseBar name={upNext.name} setCount={upNext.sets.length} /> : null}
      {finishWorkout.error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          Couldn&apos;t save your workout: {toApiError(finishWorkout.error).message} Your sets are
          still here — try again.
        </AppText>
      ) : null}
      <WorkoutActionDock
        logLabel={set ? `Log Set ${set.number}` : 'All sets logged'}
        canLog={Boolean(set)}
        onLog={() => logSet()}
        onFinish={() => setConfirmFinish(true)}
      />
      <ConfirmationModal
        visible={confirmFinish}
        title="Finish workout?"
        message="Your logged sets are saved to your history. Sets you have not logged will be skipped."
        confirmLabel="Finish Workout"
        cancelLabel="Keep Going"
        loading={finishWorkout.isPending}
        onCancel={() => setConfirmFinish(false)}
        onConfirm={() => {
          setConfirmFinish(false);
          finishWorkout.mutate();
        }}
      />
    </Screen>
  );
}
