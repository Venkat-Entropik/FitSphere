import { useState } from 'react';

import { Screen } from '@/components/common/Screen';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useNow } from '@/hooks/useNow';
import { useActiveWorkoutStore } from '@/store/active-workout.store';

import { ExerciseTrackerCard } from '../components/ExerciseTrackerCard';
import { NextExerciseBar } from '../components/NextExerciseBar';
import { RestTimerCard } from '../components/RestTimerCard';
import { SessionTelemetryCard } from '../components/SessionTelemetryCard';
import { WorkoutActionDock } from '../components/WorkoutActionDock';
import { WorkoutCategoryChips } from '../components/WorkoutCategoryChips';
import { useActiveSessionTemplate, useWorkoutCategories } from '../hooks/useWorkoutData';
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
  const categories = useWorkoutCategories();
  const template = useActiveSessionTemplate();
  const { session, rest, start, adjustWeight, adjustReps, logSet, addRest, skipRest, finish } =
    useActiveWorkoutStore();
  const [categoryId, setCategoryId] = useState('push');
  const [confirmFinish, setConfirmFinish] = useState(false);

  // Ticks once per second only while a session or rest timer is on screen; cleared on unmount.
  const now = useNow(session !== null);

  if (template.isPending || categories.isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading workout" />
      </Screen>
    );
  }
  if (template.error || !template.data) {
    return (
      <Screen>
        <ErrorState error={template.error} onRetry={() => void template.refetch()} />
      </Screen>
    );
  }

  const exercise = session ? currentExercise(session) : undefined;
  if (!session || !exercise) {
    return (
      <Screen>
        <EmptyState
          icon="fitness_center"
          title="No active workout"
          message="Start a session to log sets, track rest and see live volume."
          actionLabel="Start Push Day"
          onAction={() => start(template.data)}
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
        selectedId={categoryId}
        onSelect={setCategoryId}
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
      <WorkoutActionDock
        logLabel={set ? `Log Set ${set.number}` : 'All sets logged'}
        canLog={Boolean(set)}
        onLog={() => logSet()}
        onFinish={() => setConfirmFinish(true)}
      />
      <ConfirmationModal
        visible={confirmFinish}
        title="Finish workout?"
        message="Your logged sets are saved. Sets you have not logged will be skipped."
        confirmLabel="Finish Workout"
        cancelLabel="Keep Going"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={() => {
          setConfirmFinish(false);
          finish();
        }}
      />
    </Screen>
  );
}
