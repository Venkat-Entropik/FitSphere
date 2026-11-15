import { useRouter } from 'expo-router';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Screen } from '@/components/common/Screen';
import { Reveal } from '@/components/motion/Reveal';

import { AiInsightCard } from '../components/AiInsightCard';
import { DailyTelemetryCard } from '../components/DailyTelemetryCard';
import { DashboardHeader } from '../components/DashboardHeader';
import { QuickLinks } from '../components/QuickLinks';
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
      <Reveal index={0}>
        <DashboardHeader
          athleteName={data.athleteName}
          goalLabel={data.goalLabel}
          streakDays={data.streakDays}
          weightKg={data.weightKg}
        />
      </Reveal>
      <Reveal index={1}>
        <DailyTelemetryCard telemetry={data.telemetry} weeklyTargetDays={data.weeklyTargetDays} />
      </Reveal>
      <Reveal index={2}>
        <StartWorkoutCta
          scheduledLabel={`${data.todaysWorkout.name} scheduled`}
          weekNumber={data.weekNumber}
          programWeeks={data.programWeeks}
          onStart={() => void startWorkout()}
        />
      </Reveal>
      <Reveal index={3}>
        <QuickLinks />
      </Reveal>
      <Reveal index={4}>
        <AiInsightCard insight={data.insight} onViewSession={() => void startWorkout()} />
      </Reveal>
      <Reveal index={5}>
        <WeeklyFrequencyCard days={data.weeklyFrequency} targetDays={data.weeklyTargetDays} />
      </Reveal>
      <Reveal index={6}>
        <ScheduledWorkoutCard workout={data.todaysWorkout} />
      </Reveal>
      <Reveal index={7}>
        <RecoveryCard recovery={data.recovery} />
      </Reveal>
      <Reveal index={8}>
        <RecentLogsCard logs={data.recentLogs} onViewHistory={() => router.navigate('/progress')} />
      </Reveal>
    </Screen>
  );
}
