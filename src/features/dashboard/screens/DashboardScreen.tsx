import { useRouter } from 'expo-router';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Screen } from '@/components/common/Screen';

import { AiInsightCard } from '../components/AiInsightCard';
import { DailyTelemetryCard } from '../components/DailyTelemetryCard';
import { DashboardHeader } from '../components/DashboardHeader';
import { RecentLogsCard } from '../components/RecentLogsCard';
import { RecoveryCard } from '../components/RecoveryCard';
import { ScheduledWorkoutCard } from '../components/ScheduledWorkoutCard';
import { StartWorkoutCta } from '../components/StartWorkoutCta';
import { WeeklyFrequencyCard } from '../components/WeeklyFrequencyCard';
import { useStartWorkout } from '@/features/workouts/hooks/useStartWorkout';

import { useDashboard } from '../hooks/useDashboard';

export function DashboardScreen() {
  const router = useRouter();
  const startWorkout = useStartWorkout();
  const { data, isPending, error, refetch } = useDashboard();

  if (isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading your dashboard" />
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

  return (
    <Screen scroll>
      <DashboardHeader
        athleteName={data.athleteName}
        goalLabel={data.goalLabel}
        streakDays={data.streakDays}
        weightKg={data.weightKg}
      />
      <DailyTelemetryCard telemetry={data.telemetry} weeklyTargetDays={data.weeklyTargetDays} />
      <StartWorkoutCta
        scheduledLabel={`${data.todaysWorkout.name} scheduled`}
        weekNumber={data.weekNumber}
        programWeeks={data.programWeeks}
        onStart={() => void startWorkout()}
      />
      <AiInsightCard insight={data.insight} onViewSession={() => void startWorkout()} />
      <WeeklyFrequencyCard days={data.weeklyFrequency} targetDays={data.weeklyTargetDays} />
      <ScheduledWorkoutCard workout={data.todaysWorkout} />
      <RecoveryCard recovery={data.recovery} />
      <RecentLogsCard logs={data.recentLogs} onViewHistory={() => router.navigate('/progress')} />
    </Screen>
  );
}
